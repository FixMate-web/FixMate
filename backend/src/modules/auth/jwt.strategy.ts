import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtAccessPayload } from '../../common/auth';
import { AccountStatus } from '../../common/domain';
import { User, UserDocument } from '../../database/schemas';

export const JWT_ISSUER = 'fixmate-api';
export const JWT_AUDIENCE = 'fixmate-client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    if (!payload || payload.tokenType !== 'access' || !Types.ObjectId.isValid(payload.sub)) {
      throw new UnauthorizedException('Invalid access token claims.');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('_id email fullName phone role status preferredLanguage')
      .lean();

    if (!user) {
      throw new UnauthorizedException('Account associated with token no longer exists.');
    }

    if (user.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('Account is suspended or deactivated.');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage,
    };
  }
}
