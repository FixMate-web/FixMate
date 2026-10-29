import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { JwtAccessPayload } from '../../common/auth';
import {
  AccountStatus,
  ProviderApprovalStatus,
  SupportedLanguage,
  UserRole,
} from '../../common/domain';
import {
  ProviderProfile,
  ProviderProfileDocument,
  RefreshSession,
  RefreshSessionDocument,
  User,
  UserDocument,
} from '../../database/schemas';
import { SanitizedUserProfile, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { PUBLIC_REGISTRATION_ROLES, RegisterDto } from './dto/register.dto';
import { JWT_AUDIENCE, JWT_ISSUER } from './jwt.strategy';

const BCRYPT_ROUNDS = 12;
// Precomputed bcrypt hash of an unreachable random string to equalize timing when email is not found
const DUMMY_BCRYPT_HASH =
  '$2b$12$g5.y7U4Q2v8M1n0P9k3L6eW8rT5yU2iO1pA3sD4fG6hJ7kL8zX9cV';

export interface SessionClientMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthSessionResult {
  user: SanitizedUserProfile;
  accessToken: string;
  expiresInSeconds: number;
  refreshCookieValue: string;
  refreshCookieMaxAgeMs: number;
}

@Injectable()
export class AuthService {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlDays: number;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(ProviderProfile.name)
    private readonly providerProfileModel: Model<ProviderProfileDocument>,
    @InjectModel(RefreshSession.name)
    private readonly refreshSessionModel: Model<RefreshSessionDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTtlSeconds = this.configService.get<number>('JWT_ACCESS_TTL_SECONDS', 900);
    this.refreshTtlDays = this.configService.get<number>('REFRESH_SESSION_TTL_DAYS', 7);
  }

  async register(
    dto: RegisterDto,
    meta: SessionClientMetadata = {},
  ): Promise<AuthSessionResult> {
    const requestedRole = dto.role ?? UserRole.CUSTOMER;

    // Hard server-side defense against privilege escalation
    if (
      !PUBLIC_REGISTRATION_ROLES.includes(
        requestedRole as (typeof PUBLIC_REGISTRATION_ROLES)[number],
      )
    ) {
      throw new BadRequestException(
        'Public registration is restricted to CUSTOMER or PROVIDER roles.',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ email: normalizedEmail }).select('_id').lean();
    if (existing) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    let createdUser: UserDocument;
    try {
      createdUser = await this.userModel.create({
        fullName: dto.fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: dto.phone ? dto.phone.trim() : undefined,
        role: requestedRole,
        status: AccountStatus.ACTIVE,
        preferredLanguage: dto.preferredLanguage ?? SupportedLanguage.AR,
      });
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('An account with this email address already exists.');
      }
      throw error;
    }

    if (requestedRole === UserRole.PROVIDER) {
      try {
        await this.ensureInitialProviderProfile(createdUser._id, createdUser.fullName);
      } catch (profileError) {
        await this.userModel.deleteOne({ _id: createdUser._id });
        throw profileError;
      }
    }

    return this.issueSessionForUser(createdUser, meta);
  }

  async login(
    dto: LoginDto,
    meta: SessionClientMetadata = {},
  ): Promise<AuthSessionResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userModel
      .findOne({ email: normalizedEmail })
      .select('+passwordHash')
      .exec();

    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_BCRYPT_HASH);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('Account is suspended or deactivated.');
    }

    return this.issueSessionForUser(user, meta);
  }

  async refresh(
    rawCookieValue: string | null,
    meta: SessionClientMetadata = {},
  ): Promise<AuthSessionResult> {
    const parsed = this.parseRefreshCookie(rawCookieValue);
    if (!parsed) {
      throw new UnauthorizedException('Missing or malformed refresh session credential.');
    }

    const { sessionId, rawSecret } = parsed;
    const existingSession = await this.refreshSessionModel
      .findOne({ sessionId })
      .select('+secretHash')
      .exec();

    if (!existingSession) {
      throw new UnauthorizedException('Refresh session not found or expired.');
    }

    if (!this.verifySecretHash(rawSecret, existingSession.secretHash)) {
      throw new UnauthorizedException('Invalid refresh session credential.');
    }

    // Replay Detection: if this session was already rotated or revoked, revoke the entire family
    if (existingSession.revokedAt !== null) {
      await this.revokeSessionFamily(existingSession.familyId, 'REPLAY_DETECTED');
      throw new UnauthorizedException(
        'Refresh token reuse detected. Session family has been revoked.',
      );
    }

    const now = new Date();
    if (existingSession.expiresAt.getTime() <= now.getTime()) {
      await this.refreshSessionModel.updateOne(
        { _id: existingSession._id, revokedAt: null },
        { $set: { revokedAt: now, revocationReason: 'LOGOUT' } },
      );
      throw new UnauthorizedException('Refresh session has expired.');
    }

    const newSessionId = randomUUID();

    // Atomic compare-and-set to ensure deterministic behavior on simultaneous refresh calls
    const lockedSession = await this.refreshSessionModel.findOneAndUpdate(
      { sessionId, revokedAt: null },
      {
        $set: {
          revokedAt: now,
          revocationReason: 'ROTATED',
          replacedBySessionId: newSessionId,
        },
      },
      { new: true },
    );

    if (!lockedSession) {
      await this.revokeSessionFamily(existingSession.familyId, 'REPLAY_DETECTED');
      throw new UnauthorizedException('Concurrent refresh replay detected.');
    }

    const user = await this.userModel.findById(existingSession.userId).exec();
    if (!user) {
      throw new UnauthorizedException('User account no longer exists.');
    }

    if (user.status !== AccountStatus.ACTIVE) {
      await this.revokeSessionFamily(existingSession.familyId, 'ACCOUNT_SUSPENDED');
      throw new ForbiddenException('Account is suspended or deactivated.');
    }

    return this.issueSessionForUser(user, meta, existingSession.familyId, newSessionId);
  }

  async logout(rawCookieValue: string | null): Promise<{ loggedOut: true }> {
    const parsed = this.parseRefreshCookie(rawCookieValue);
    if (!parsed) {
      return { loggedOut: true };
    }

    const existingSession = await this.refreshSessionModel
      .findOne({ sessionId: parsed.sessionId })
      .select('+secretHash')
      .exec();

    if (
      existingSession &&
      this.verifySecretHash(parsed.rawSecret, existingSession.secretHash)
    ) {
      await this.revokeSessionFamily(existingSession.familyId, 'LOGOUT');
    }

    return { loggedOut: true };
  }

  private async issueSessionForUser(
    user: UserDocument,
    meta: SessionClientMetadata,
    existingFamilyId?: string,
    preallocatedSessionId?: string,
  ): Promise<AuthSessionResult> {
    const sessionId = preallocatedSessionId ?? randomUUID();
    const familyId = existingFamilyId ?? randomUUID();
    const rawSecret = randomBytes(32).toString('base64url');
    const secretHash = this.hashSecret(rawSecret);

    const refreshMaxAgeMs = this.refreshTtlDays * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + refreshMaxAgeMs);

    await this.refreshSessionModel.create({
      sessionId,
      userId: user._id,
      familyId,
      secretHash,
      expiresAt,
      revokedAt: null,
      revocationReason: null,
      replacedBySessionId: null,
      userAgent: meta.userAgent ? meta.userAgent.slice(0, 255) : undefined,
      ipAddress: meta.ipAddress ? meta.ipAddress.slice(0, 64) : undefined,
    });

    const payload: JwtAccessPayload = {
      sub: user._id.toString(),
      role: user.role,
      tokenType: 'access',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.accessTtlSeconds,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256',
    });

    return {
      user: this.usersService.toSanitizedProfile(user),
      accessToken,
      expiresInSeconds: this.accessTtlSeconds,
      refreshCookieValue: `${sessionId}.${rawSecret}`,
      refreshCookieMaxAgeMs: refreshMaxAgeMs,
    };
  }

  private async ensureInitialProviderProfile(
    userId: Types.ObjectId,
    displayName: string,
  ): Promise<void> {
    await this.providerProfileModel.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          displayName,
          bio: {
            ar: 'ملف مزود خدمة قيد الإعداد — يرجى استكمال البيانات للتقديم للمراجعة.',
            en: 'Provider profile in draft — please complete details to submit for review.',
          },
          yearsOfExperience: 0,
          coverageGovernorates: ['Amman'],
          coverageAreas: [],
          weeklyAvailability: [
            { dayOfWeek: 0, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
            { dayOfWeek: 1, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
            { dayOfWeek: 2, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
            { dayOfWeek: 3, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
            { dayOfWeek: 4, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          ],
          approvalStatus: ProviderApprovalStatus.DRAFT,
          approvalMetadata: {},
          averageRating: 0,
          reviewCount: 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private async revokeSessionFamily(
    familyId: string,
    reason: 'LOGOUT' | 'REPLAY_DETECTED' | 'ACCOUNT_SUSPENDED',
  ): Promise<void> {
    await this.refreshSessionModel.updateMany(
      { familyId, revokedAt: null },
      { $set: { revokedAt: new Date(), revocationReason: reason } },
    );
  }

  private parseRefreshCookie(
    rawCookieValue: string | null,
  ): { sessionId: string; rawSecret: string } | null {
    if (!rawCookieValue || typeof rawCookieValue !== 'string') {
      return null;
    }
    const dotIdx = rawCookieValue.indexOf('.');
    if (dotIdx <= 0 || dotIdx === rawCookieValue.length - 1) {
      return null;
    }
    const sessionId = rawCookieValue.slice(0, dotIdx).trim();
    const rawSecret = rawCookieValue.slice(dotIdx + 1).trim();
    if (!sessionId || !rawSecret || sessionId.length > 64 || rawSecret.length < 16) {
      return null;
    }
    return { sessionId, rawSecret };
  }

  private hashSecret(rawSecret: string): string {
    return createHash('sha256').update(rawSecret, 'utf8').digest('hex');
  }

  private verifySecretHash(rawSecret: string, expectedHexHash: string): boolean {
    const candidateHex = this.hashSecret(rawSecret);
    const a = Buffer.from(candidateHex, 'hex');
    const b = Buffer.from(expectedHexHash, 'hex');
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
