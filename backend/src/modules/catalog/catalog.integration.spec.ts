import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import mongoose, { Model } from 'mongoose';
import * as request from 'supertest';
import { PricingType, UserRole } from '../../common/domain';
import { validateEnvironment } from '../../config/env.validation';
import {
  Category,
  CategoryDocument,
  Service,
  ServiceDocument,
  User,
  UserDocument,
} from '../../database/schemas';
import { bootstrapAdminAccount } from '../../scripts/bootstrap-admin';
import { seedCanonicalCatalog } from '../../scripts/seed-catalog';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CatalogModule } from './catalog.module';

const TEST_DB_URI =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/fixmate_part06_catalog_test';

describe('Part 06 — Service Categories & Catalog Management Integration', () => {
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let categoryModel: Model<CategoryDocument>;
  let serviceModel: Model<ServiceDocument>;

  let adminToken = '';
  let customerToken = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = TEST_DB_URI;
    process.env.CORS_ORIGINS = 'http://localhost:4200';
    process.env.JWT_ACCESS_SECRET = 'test-part06-jwt-access-secret-key-at-least-24';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: validateEnvironment,
        }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
        MongooseModule.forRoot(TEST_DB_URI),
        UsersModule,
        AuthModule,
        CatalogModule,
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

    await Promise.all([
      userModel.deleteMany({}),
      categoryModel.deleteMany({}),
      serviceModel.deleteMany({}),
    ]);

    await bootstrapAdminAccount({
      mongoUri: TEST_DB_URI,
      email: 'admin@fixmate.jo',
      password: 'AdminPassword123',
      fullName: 'Catalog Admin',
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@fixmate.jo', password: 'AdminPassword123' })
      .expect(200);
    adminToken = adminLogin.body.accessToken as string;

    const custReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Layla Customer',
        email: 'layla@example.com',
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
      ]);
      await app.close();
    }
    await mongoose.disconnect();
  });

  it('seeds the 6 canonical categories and 12 services idempotently without duplicating on rerun', async () => {
    const firstRun = await seedCanonicalCatalog(categoryModel, serviceModel);
    expect(firstRun.categoriesInserted).toBe(6);
    expect(firstRun.categoriesTotal).toBe(6);
    expect(firstRun.servicesInserted).toBe(12);
    expect(firstRun.servicesTotal).toBe(12);

    const secondRun = await seedCanonicalCatalog(categoryModel, serviceModel);
    expect(secondRun.categoriesInserted).toBe(0);
    expect(secondRun.categoriesTotal).toBe(6);
    expect(secondRun.servicesInserted).toBe(0);
    expect(secondRun.servicesTotal).toBe(12);
  });

  it('returns active categories ordered by displayOrder and category details by slug', async () => {
    const listRes = await request(app.getHttpServer()).get('/api/v1/categories').expect(200);
    expect(listRes.body).toHaveLength(6);
    expect(listRes.body[0].slug).toBe('plumbing');
    expect(listRes.body[5].slug).toBe('carpentry');

    const slugRes = await request(app.getHttpServer())
      .get('/api/v1/categories/plumbing')
      .expect(200);
    expect(slugRes.body.slug).toBe('plumbing');
    expect(slugRes.body.services.length).toBeGreaterThanOrEqual(2);

    await request(app.getHttpServer()).get('/api/v1/categories/non-existent-slug').expect(404);
  });

  it('supports bounded service pagination, category/pricing filters, regex-safe search, and sorting', async () => {
    const allRes = await request(app.getHttpServer())
      .get('/api/v1/services?page=1&limit=5&sort=price_asc')
      .expect(200);

    expect(allRes.body.items).toHaveLength(5);
    expect(allRes.body.total).toBe(12);
    expect(allRes.body.totalPages).toBe(3);
    expect(allRes.body.items[0].pricingPolicy.indicativeAmountFils).toBeLessThanOrEqual(
      allRes.body.items[1].pricingPolicy.indicativeAmountFils,
    );

    // Filter by categorySlug and pricingType
    const filteredRes = await request(app.getHttpServer())
      .get('/api/v1/services')
      .query({ categorySlug: 'plumbing', pricingType: PricingType.FIXED })
      .expect(200);
    expect(filteredRes.body.items).toHaveLength(1);
    expect(filteredRes.body.items[0].slug).toBe('electric-water-heater-maintenance');

    // Regex metacharacters in q must not crash RegExp compilation
    const regexMetacharRes = await request(app.getHttpServer())
      .get('/api/v1/services')
      .query({ q: '[a-z]+.*(leak' })
      .expect(200);
    expect(regexMetacharRes.body.items).toHaveLength(0);

    // Reject out-of-bounds limit > 50 or invalid sort
    await request(app.getHttpServer()).get('/api/v1/services?limit=200').expect(400);
    await request(app.getHttpServer()).get('/api/v1/services?sort=arbitrary_field').expect(400);
  });

  it('blocks anonymous and non-admin users from catalog write and admin read endpoints', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({
        slug: 'solar-systems',
        name: { ar: 'الطاقة الشمسية', en: 'Solar Systems' },
        description: { ar: 'وصف', en: 'Description' },
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        slug: 'solar-systems',
        name: { ar: 'الطاقة الشمسية', en: 'Solar Systems' },
        description: { ar: 'وصف', en: 'Description' },
      })
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('allows ADMIN to create, update, and soft-archive categories and services with strict validation', async () => {
    const createCatRes = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug: 'smart-locks',
        name: { ar: 'الأقفال الذكية', en: 'Smart Locks' },
        description: {
          ar: 'تركيب وبرمجة الأقفال الإلكترونية للمنازل',
          en: 'Installation and setup of residential smart locks',
        },
        iconName: 'lock',
        displayOrder: 7,
      })
      .expect(201);

    const newCategoryId = createCatRes.body.id as string;

    // Duplicate category slug returns 409 Conflict
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug: 'smart-locks',
        name: { ar: 'مكرر', en: 'Duplicate' },
        description: { ar: 'مكرر', en: 'Duplicate' },
      })
      .expect(409);

    // Reject non-integer fils or non-multiple-of-30 duration
    await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: newCategoryId,
        slug: 'smart-lock-install',
        title: { ar: 'تركيب قفل ذكي', en: 'Smart Lock Installation' },
        description: { ar: 'تركيب كامل', en: 'Full installation' },
        pricingPolicy: { pricingType: PricingType.FIXED, indicativeAmountFils: 25.5 },
        defaultDurationMinutes: 60,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: newCategoryId,
        slug: 'smart-lock-install',
        title: { ar: 'تركيب قفل ذكي', en: 'Smart Lock Installation' },
        description: { ar: 'تركيب كامل', en: 'Full installation' },
        pricingPolicy: { pricingType: PricingType.FIXED, indicativeAmountFils: 25000 },
        defaultDurationMinutes: 75,
      })
      .expect(400);

    // Valid service creation
    const createSvcRes = await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: newCategoryId,
        slug: 'smart-lock-install',
        title: { ar: 'تركيب قفل ذكي', en: 'Smart Lock Installation' },
        description: { ar: 'تركيب وبرمجة القفل الذكي', en: 'Install and configure smart lock' },
        pricingPolicy: { pricingType: PricingType.FIXED, indicativeAmountFils: 25000 },
        defaultDurationMinutes: 60,
      })
      .expect(201);

    const newServiceId = createSvcRes.body.id as string;

    // Public detail works while active
    await request(app.getHttpServer()).get('/api/v1/services/smart-lock-install').expect(200);

    // Soft-archive the service -> hidden from public, still visible to admin
    await request(app.getHttpServer())
      .patch(`/api/v1/services/${newServiceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);

    await request(app.getHttpServer()).get('/api/v1/services/smart-lock-install').expect(404);

    // Re-activate service, then soft-archive parent category -> service is also hidden from public
    await request(app.getHttpServer())
      .patch(`/api/v1/services/${newServiceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${newCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);

    await request(app.getHttpServer()).get('/api/v1/categories/smart-locks').expect(404);
    await request(app.getHttpServer()).get('/api/v1/services/smart-lock-install').expect(404);

    // Admin list still includes archived categories & services
    const adminCats = await request(app.getHttpServer())
      .get('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminCats.body.some((c: { slug: string }) => c.slug === 'smart-locks')).toBe(true);
  });
});
