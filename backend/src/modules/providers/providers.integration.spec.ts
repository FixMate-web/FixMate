import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import mongoose, { Model } from 'mongoose';
import * as request from 'supertest';
import { PricingType, ProviderApprovalStatus, UserRole } from '../../common/domain';
import { validateEnvironment } from '../../config/env.validation';
import {
  Category,
  CategoryDocument,
  ProviderProfile,
  ProviderProfileDocument,
  ProviderServiceOffering,
  ProviderServiceOfferingDocument,
  Service,
  ServiceDocument,
  User,
  UserDocument,
} from '../../database/schemas';
import { bootstrapAdminAccount } from '../../scripts/bootstrap-admin';
import { seedCanonicalCatalog } from '../../scripts/seed-catalog';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { UsersModule } from '../users/users.module';
import { ProvidersModule } from './providers.module';

const TEST_DB_URI =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/fixmate_part07_09_providers_test';

describe('Part 07 & Part 09 — Provider Onboarding, Approval & Public Discovery Integration', () => {
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let categoryModel: Model<CategoryDocument>;
  let serviceModel: Model<ServiceDocument>;
  let providerProfileModel: Model<ProviderProfileDocument>;
  let offeringModel: Model<ProviderServiceOfferingDocument>;

  let adminToken = '';
  let providerToken = '';
  let customerToken = '';
  let providerProfileId = '';
  let plumbingServiceId = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = TEST_DB_URI;
    process.env.CORS_ORIGINS = 'http://localhost:4200';
    process.env.JWT_ACCESS_SECRET = 'test-part07-09-jwt-access-secret-key-2026';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: validateEnvironment,
        }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 200 }]),
        MongooseModule.forRoot(TEST_DB_URI),
        UsersModule,
        AuthModule,
        CatalogModule,
        ProvidersModule,
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
    categoryModel = moduleFixture.get<Model<CategoryDocument>>(getModelToken(Category.name));
    serviceModel = moduleFixture.get<Model<ServiceDocument>>(getModelToken(Service.name));
    providerProfileModel = moduleFixture.get<Model<ProviderProfileDocument>>(
      getModelToken(ProviderProfile.name),
    );
    offeringModel = moduleFixture.get<Model<ProviderServiceOfferingDocument>>(
      getModelToken(ProviderServiceOffering.name),
    );

    await Promise.all([
      userModel.deleteMany({}),
      categoryModel.deleteMany({}),
      serviceModel.deleteMany({}),
      providerProfileModel.deleteMany({}),
      offeringModel.deleteMany({}),
    ]);

    await seedCanonicalCatalog(categoryModel, serviceModel);
    const leakService = await serviceModel
      .findOne({ slug: 'water-leak-detection-repair' })
      .exec();
    plumbingServiceId = leakService!._id.toString();

    await bootstrapAdminAccount({
      mongoUri: TEST_DB_URI,
      email: 'admin@fixmate.jo',
      password: 'AdminPassword123',
      fullName: 'Moderation Admin',
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@fixmate.jo', password: 'AdminPassword123' })
      .expect(200);
    adminToken = adminLogin.body.accessToken as string;

    const provReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Tariq Plumber',
        email: 'tariq@example.com',
        password: 'Password123',
        role: UserRole.PROVIDER,
        phone: '+962791112233',
      })
      .expect(201);
    providerToken = provReg.body.accessToken as string;

    const custReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Rania Customer',
        email: 'rania@example.com',
        password: 'Password123',
        role: UserRole.CUSTOMER,
      })
      .expect(201);
    customerToken = custReg.body.accessToken as string;
  });

  afterAll(async () => {
    if (app) {
      await Promise.all([
        userModel.deleteMany({}),
        categoryModel.deleteMany({}),
        serviceModel.deleteMany({}),
        providerProfileModel.deleteMany({}),
        offeringModel.deleteMany({}),
      ]);
      await app.close();
    }
    await mongoose.disconnect();
  });

  it('creates a DRAFT profile for a registered provider and hides it from public discovery', async () => {
    const meRes = await request(app.getHttpServer())
      .get('/api/v1/providers/me')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);

    expect(meRes.body.approvalStatus).toBe(ProviderApprovalStatus.DRAFT);
    providerProfileId = meRes.body.id as string;

    // Public directory must not return DRAFT providers
    const pubList = await request(app.getHttpServer()).get('/api/v1/providers').expect(200);
    expect(pubList.body.items).toHaveLength(0);

    await request(app.getHttpServer())
      .get(`/api/v1/providers/${providerProfileId}`)
      .expect(404);
  });

  it('prevents provider from self-approving or spoofing ratings, and blocks premature submission', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/providers/me')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        displayName: 'Tariq Master Plumbing',
        approvalStatus: ProviderApprovalStatus.APPROVED,
      })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/api/v1/providers/me')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        displayName: 'Tariq Master Plumbing',
        averageRating: 5,
      })
      .expect(400);

    // Reject submission while coverageAreas or active offerings are missing
    await request(app.getHttpServer())
      .post('/api/v1/providers/me/submit')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(400);
  });

  it('validates weekly availability windows, attaches active catalog offerings, and transitions to PENDING_REVIEW', async () => {
    // Reject overlapping availability windows on the same day
    await request(app.getHttpServer())
      .patch('/api/v1/providers/me')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        weeklyAvailability: [
          { dayOfWeek: 1, startMinuteOfDay: 540, endMinuteOfDay: 780 },
          { dayOfWeek: 1, startMinuteOfDay: 720, endMinuteOfDay: 960 },
        ],
      })
      .expect(400);

    // Update valid profile fields
    await request(app.getHttpServer())
      .patch('/api/v1/providers/me')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        displayName: 'Tariq Master Plumbing Services',
        bio: {
          ar: 'فني سباكة معتمد بخبرة ١٢ عاماً في صيانة وتمديدات المياه في عمّان والزرقاء.',
          en: 'Certified plumbing technician with 12 years of residential leak and heater experience in Amman.',
        },
        yearsOfExperience: 12,
        coverageGovernorates: ['Amman', 'Zarqa'],
        coverageAreas: ['Abdoun', 'Sweifieh', 'Khalda'],
        weeklyAvailability: [
          { dayOfWeek: 0, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 1, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 2, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
        ],
      })
      .expect(200);

    // Attach active catalog service
    const attachRes = await request(app.getHttpServer())
      .put('/api/v1/providers/me/services')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        serviceId: plumbingServiceId,
        pricingType: PricingType.STARTING_AT,
        priceAmountFils: 16000,
        estimatedDurationMinutes: 60,
        isEnabled: true,
      })
      .expect(200);

    expect(attachRes.body.priceAmountFils).toBe(16000);
    expect(attachRes.body.service.slug).toBe('water-leak-detection-repair');

    // Submit for review -> PENDING_REVIEW
    const submitRes = await request(app.getHttpServer())
      .post('/api/v1/providers/me/submit')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);

    expect(submitRes.body.approvalStatus).toBe(ProviderApprovalStatus.PENDING_REVIEW);

    // Still hidden from public directory while PENDING_REVIEW
    const pubList = await request(app.getHttpServer()).get('/api/v1/providers').expect(200);
    expect(pubList.body.items).toHaveLength(0);
  });

  it('enforces admin moderation workflow (REJECTED -> resubmit -> APPROVED -> public discovery -> SUSPENDED)', async () => {
    // Customer cannot access admin approval endpoints
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/providers/${providerProfileId}/approval`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: ProviderApprovalStatus.APPROVED })
      .expect(403);

    // Rejecting without reason fails validation
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/providers/${providerProfileId}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: ProviderApprovalStatus.REJECTED })
      .expect(400);

    // Admin rejects with reason + internal verificationNotes
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/providers/${providerProfileId}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: ProviderApprovalStatus.REJECTED,
        reason: 'Please expand coverage areas description.',
        verificationNotes: 'Internal note: called phone number, awaiting update.',
      })
      .expect(200);

    // Owner sees rejection reason, but NEVER internal verificationNotes
    const ownerAfterReject = await request(app.getHttpServer())
      .get('/api/v1/providers/me')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);
    expect(ownerAfterReject.body.approvalStatus).toBe(ProviderApprovalStatus.REJECTED);
    expect(ownerAfterReject.body.approvalFeedback.rejectionOrSuspensionReason).toContain(
      'expand coverage areas',
    );
    expect(ownerAfterReject.body.adminMetadata).toBeUndefined();
    expect(JSON.stringify(ownerAfterReject.body)).not.toContain('Internal note:');

    // Owner resubmits -> PENDING_REVIEW
    await request(app.getHttpServer())
      .post('/api/v1/providers/me/submit')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);

    // Admin approves -> APPROVED
    const approveRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/providers/${providerProfileId}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: ProviderApprovalStatus.APPROVED,
        verificationNotes: 'Reviewed and approved for Phase 2 directory.',
      })
      .expect(200);
    expect(approveRes.body.approvalStatus).toBe(ProviderApprovalStatus.APPROVED);

    // Now visible in public GET /api/v1/providers with sanitized fields
    const pubSearch = await request(app.getHttpServer())
      .get('/api/v1/providers')
      .query({ serviceSlug: 'water-leak-detection-repair', governorate: 'Amman', q: 'Tariq' })
      .expect(200);

    expect(pubSearch.body.items).toHaveLength(1);
    const pubItem = pubSearch.body.items[0];
    expect(pubItem.displayName).toBe('Tariq Master Plumbing Services');
    expect(pubItem.approvalStatus).toBe(ProviderApprovalStatus.APPROVED);
    expect(pubItem.reviewCount).toBe(0);
    expect(pubItem.averageRating).toBeNull();
    expect(pubItem.offerings).toHaveLength(1);
    expect(pubItem.offerings[0].priceAmountFils).toBe(16000);

    // Verify zero leakage of private fields in public response
    const serializedPublic = JSON.stringify(pubItem);
    expect(serializedPublic).not.toContain('tariq@example.com');
    expect(serializedPublic).not.toContain('+962791112233');
    expect(serializedPublic).not.toContain('verificationNotes');
    expect(serializedPublic).not.toContain('reviewedByUserId');
    expect(serializedPublic).not.toContain('userId');

    // Public detail endpoint returns provider + weeklyAvailability
    const pubDetail = await request(app.getHttpServer())
      .get(`/api/v1/providers/${providerProfileId}`)
      .expect(200);
    expect(pubDetail.body.weeklyAvailability).toHaveLength(3);

    // Admin suspends provider -> immediately hidden from public discovery
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/providers/${providerProfileId}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: ProviderApprovalStatus.SUSPENDED,
        reason: 'Temporarily suspended for quality review.',
      })
      .expect(200);

    const afterSuspendList = await request(app.getHttpServer())
      .get('/api/v1/providers')
      .expect(200);
    expect(afterSuspendList.body.items).toHaveLength(0);

    await request(app.getHttpServer())
      .get(`/api/v1/providers/${providerProfileId}`)
      .expect(404);
  });
});
