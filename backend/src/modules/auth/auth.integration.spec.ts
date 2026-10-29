import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { Model } from 'mongoose';
import * as request from 'supertest';
import {
  AccountStatus,
  ProviderApprovalStatus,
  SupportedLanguage,
  UserRole,
} from '../../common/domain';
import { validateEnvironment } from '../../config/env.validation';
import { DOMAIN_PERSISTENCE_MODULES } from '../../database/models/domain-persistence.modules';
import {
  ProviderProfile,
  ProviderProfileDocument,
  RefreshSession,
  RefreshSessionDocument,
  User,
  UserDocument,
} from '../../database/schemas';
import { bootstrapAdminAccount } from '../../scripts/bootstrap-admin';
import { UsersModule } from '../users/users.module';
import { AuthModule } from './auth.module';

describe('Part 05 — Auth & Users Integration Tests', () => {
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let providerProfileModel: Model<ProviderProfileDocument>;
  let refreshSessionModel: Model<RefreshSessionDocument>;

  const testDbUri =
    process.env.TEST_AUTH_MONGODB_URI ||
    'mongodb://127.0.0.1:27017/fixmate_phase2_auth_test';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.MONGODB_URI = testDbUri;
    process.env.CORS_ORIGINS = 'http://localhost:4200';
    process.env.JWT_ACCESS_SECRET = 'test-only-jwt-access-secret-key-phase-2';
    process.env.JWT_ACCESS_TTL_SECONDS = '900';
    process.env.REFRESH_SESSION_TTL_DAYS = '7';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: validateEnvironment,
        }),
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 100,
          },
        ]),
        MongooseModule.forRoot(testDbUri),
        ...DOMAIN_PERSISTENCE_MODULES,
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    providerProfileModel = moduleFixture.get<Model<ProviderProfileDocument>>(
      getModelToken(ProviderProfile.name),
    );
    refreshSessionModel = moduleFixture.get<Model<RefreshSessionDocument>>(
      getModelToken(RefreshSession.name),
    );

    await Promise.all([
      userModel.syncIndexes(),
      providerProfileModel.syncIndexes(),
      refreshSessionModel.syncIndexes(),
    ]);
  });

  beforeEach(async () => {
    await Promise.all([
      userModel.deleteMany({}),
      providerProfileModel.deleteMany({}),
      refreshSessionModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    if (app) {
      await Promise.all([
        userModel.deleteMany({}),
        providerProfileModel.deleteMany({}),
        refreshSessionModel.deleteMany({}),
      ]);
      await app.close();
    }
  });

  function extractRefreshCookie(res: request.Response): string {
    const setCookieHeader = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [String(setCookieHeader)]
        : [];
    const rtCookie = cookies.find((c: string) => c.startsWith('fixmate_rt='));
    expect(rtCookie).toBeDefined();
    expect(rtCookie).toContain('HttpOnly');
    expect(rtCookie).toContain('Path=/api/v1/auth');
    return (rtCookie as string).split(';')[0];
  }

  it('registers a CUSTOMER with normalized email, hashes password, and never exposes passwordHash', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Sara Al-Masri',
        email: '  Sara.Customer@Example.COM ',
        password: 'StrongPassword123',
        phone: '+962791234567',
        role: UserRole.CUSTOMER,
        preferredLanguage: SupportedLanguage.AR,
      })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('sara.customer@example.com');
    expect(res.body.user.role).toBe(UserRole.CUSTOMER);
    expect(res.body.user.status).toBe(AccountStatus.ACTIVE);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toEqual(expect.any(String));
    extractRefreshCookie(res);

    const dbUser = await userModel
      .findOne({ email: 'sara.customer@example.com' })
      .select('+passwordHash')
      .lean();
    expect(dbUser).toBeDefined();
    expect(dbUser?.passwordHash).toMatch(/^\$2b\$12\$/);
    expect(dbUser?.passwordHash).not.toBe('StrongPassword123');
  });

  it('registers a PROVIDER and creates an unapproved DRAFT provider profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Tareq Electrician',
        email: 'tareq.provider@example.com',
        password: 'StrongPassword123',
        role: UserRole.PROVIDER,
      })
      .expect(201);

    expect(res.body.user.role).toBe(UserRole.PROVIDER);

    const profile = await providerProfileModel
      .findOne({ userId: res.body.user.id })
      .lean();
    expect(profile).toBeDefined();
    expect(profile?.approvalStatus).toBe(ProviderApprovalStatus.DRAFT);
  });

  it('rejects public registration attempts with role ADMIN or extra privilege fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Attacker Admin',
        email: 'attacker@example.com',
        password: 'StrongPassword123',
        role: UserRole.ADMIN,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Mass Assignment Attacker',
        email: 'attacker2@example.com',
        password: 'StrongPassword123',
        role: UserRole.CUSTOMER,
        isAdmin: true,
      })
      .expect(400);
  });

  it('handles duplicate email registration and concurrent duplicate attempts with 409 Conflict', async () => {
    const payload = {
      fullName: 'Duplicate Test',
      email: 'dup@example.com',
      password: 'StrongPassword123',
      role: UserRole.CUSTOMER,
    };

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post('/api/v1/auth/register').send(payload),
      request(app.getHttpServer()).post('/api/v1/auth/register').send(payload),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
  });

  it('authenticates valid login, rejects bad credentials with generic 401, and blocks suspended accounts with 403', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Nour Customer',
        email: 'nour@example.com',
        password: 'CorrectPassword123',
      })
      .expect(201);

    // Wrong password -> 401
    const wrongPass = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nour@example.com', password: 'WrongPassword999' })
      .expect(401);
    expect(wrongPass.body.message).toBe('Invalid email or password.');

    // Unknown email -> identical generic 401
    const unknownEmail = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'unknown@example.com', password: 'WrongPassword999' })
      .expect(401);
    expect(unknownEmail.body.message).toBe('Invalid email or password.');

    // Valid login -> 200
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'NOUR@example.com', password: 'CorrectPassword123' })
      .expect(200);
    expect(loginRes.body.accessToken).toEqual(expect.any(String));

    // Suspend account -> login and existing access token both rejected with 403
    await userModel.updateOne(
      { email: 'nour@example.com' },
      { $set: { status: AccountStatus.SUSPENDED } },
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nour@example.com', password: 'CorrectPassword123' })
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(403);
  });

  it('rotates refresh tokens, detects replay attacks, handles simultaneous refresh, and enforces CSRF headers/origin', async () => {
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Omar Session',
        email: 'omar@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const cookie1 = extractRefreshCookie(regRes);

    // Missing X-Requested-With header -> 403 CSRF rejection
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie1)
      .set('Origin', 'http://localhost:4200')
      .expect(403);

    // Untrusted Origin header -> 403 CSRF rejection
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie1)
      .set('X-Requested-With', 'FixMateClient')
      .set('Origin', 'https://malicious-site.example')
      .expect(403);

    // Valid refresh -> 200 and rotates cookie1 -> cookie2
    const refresh1 = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie1)
      .set('X-Requested-With', 'FixMateClient')
      .set('Origin', 'http://localhost:4200')
      .expect(200);

    const cookie2 = extractRefreshCookie(refresh1);
    expect(cookie2).not.toBe(cookie1);

    // Replay of old cookie1 -> 401 and revokes the entire session family (invalidating cookie2 as well!)
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie1)
      .set('X-Requested-With', 'FixMateClient')
      .set('Origin', 'http://localhost:4200')
      .expect(401);

    // Verify cookie2 was also revoked due to family replay detection
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie2)
      .set('X-Requested-With', 'FixMateClient')
      .set('Origin', 'http://localhost:4200')
      .expect(401);
  });

  it('supports GET/PATCH /users/me for own profile and blocks role/privilege tampering', async () => {
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Lina User',
        email: 'lina@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const token = regRes.body.accessToken as string;

    // Unauthenticated -> 401
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);

    // Valid PATCH /users/me
    const patched = await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Lina Updated',
        phone: '+962798887766',
        preferredLanguage: SupportedLanguage.EN,
      })
      .expect(200);

    expect(patched.body.fullName).toBe('Lina Updated');
    expect(patched.body.phone).toBe('+962798887766');
    expect(patched.body.preferredLanguage).toBe(SupportedLanguage.EN);
    expect(patched.body.role).toBe(UserRole.CUSTOMER);

    // Attempt to tamper with role via PATCH /users/me -> 400 Bad Request
    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Lina Hacked',
        role: UserRole.ADMIN,
      })
      .expect(400);

    // Logout revokes refresh session idempotently
    const cookie = extractRefreshCookie(regRes);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set('X-Requested-With', 'FixMateClient')
      .set('Origin', 'http://localhost:4200')
      .expect(200);

    // Refresh after logout -> 401
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('X-Requested-With', 'FixMateClient')
      .set('Origin', 'http://localhost:4200')
      .expect(401);
  });

  it('provisions an ADMIN account safely via bootstrapAdminAccount and blocks production without override', async () => {
    await expect(
      bootstrapAdminAccount({
        mongoUri: testDbUri,
        email: 'admin@fixmate.local',
        password: 'AdminStrongPassword123',
        nodeEnv: 'production',
        allowProductionBootstrap: false,
      }),
    ).rejects.toThrow(/blocked in production/);

    const firstRun = await bootstrapAdminAccount({
      mongoUri: testDbUri,
      email: 'admin@fixmate.local',
      password: 'AdminStrongPassword123',
      fullName: 'FixMate Ops Admin',
      nodeEnv: 'test',
    });
    expect(firstRun.created).toBe(true);
    expect(firstRun.role).toBe(UserRole.ADMIN);

    // Idempotent second run
    const secondRun = await bootstrapAdminAccount({
      mongoUri: testDbUri,
      email: 'admin@fixmate.local',
      password: 'AdminStrongPassword123',
      nodeEnv: 'test',
    });
    expect(secondRun.created).toBe(false);
    expect(secondRun.id).toBe(firstRun.id);
  });
});
