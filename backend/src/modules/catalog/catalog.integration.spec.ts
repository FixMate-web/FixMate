import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

  it('seeds the expanded catalog and preserves prices and admin edits idempotently without duplicating on rerun', async () => {
    const firstRun = await seedCanonicalCatalog(categoryModel, serviceModel);
    expect(firstRun.categoriesInserted).toBe(15);
    expect(firstRun.categoriesTotal).toBe(15);
    expect(firstRun.servicesInserted).toBe(62);
    expect(firstRun.servicesTotal).toBe(62);

    const secondRun = await seedCanonicalCatalog(categoryModel, serviceModel);
    expect(secondRun.categoriesInserted).toBe(0);
    expect(secondRun.categoriesTotal).toBe(15);
    expect(secondRun.servicesInserted).toBe(0);
    expect(secondRun.servicesTotal).toBe(62);
  });

  it('exposes all 14 discovery groups and 56 service routes without inventing prices or moving legacy IDs', async () => {
    const manifest = JSON.parse(
      readFileSync(
        resolve(process.cwd(), '../frontend/public/catalog/discovery-taxonomy.json'),
        'utf8',
      ),
    ) as { slug: string; services: { slug: string }[] }[];
    expect(manifest).toHaveLength(14);
    const original = await serviceModel.findOne({ slug: 'wooden-door-and-lock-repair' }).exec();
    const originalId = original!._id.toString();
    let unpriced = 0;
    for (const category of manifest) {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/categories/${category.slug}`)
        .expect(200);
      for (const service of category.services) {
        expect(response.body.services.some((s: { slug: string }) => s.slug === service.slug)).toBe(
          true,
        );
        const detail = await request(app.getHttpServer())
          .get(`/api/v1/services/${service.slug}`)
          .expect(200);
        if (detail.body.pricingPolicy === null) unpriced++;
      }
    }
    expect(unpriced).toBe(48);
    await serviceModel.updateOne({_id:original!._id},{$set:{'title.en':'Admin customized lock title'}});
    await seedCanonicalCatalog(categoryModel, serviceModel);
    const unchanged = await serviceModel.findOne({ slug: 'wooden-door-and-lock-repair' }).exec();
    expect(unchanged!._id.toString()).toBe(originalId);
    expect(unchanged!.title.en).toBe('Admin customized lock title');
    expect(unchanged!.categoryId.toString()).toBe(original!.categoryId.toString());
    expect(unchanged!.pricingPolicy!.indicativeAmountFils).toBe(15000);
  });

  it('keeps the replaced piano and heating entries, reuses the AC ID, and leaves gas exchange unpriced', async () => {
    const piano=await serviceModel.findOne({slug:'piano-moving'}).exec();
    const heating=await serviceModel.findOne({slug:'heating-system-maintenance'}).exec();
    const ac=await serviceModel.findOne({slug:'ac-cooling-diagnostics-recharge'}).exec();
    expect(piano).toBeTruthy();expect(heating).toBeTruthy();expect(ac).toBeTruthy();
    const gas=await request(app.getHttpServer()).get('/api/v1/services/gas-cylinder-exchange').expect(200);
    expect(gas.body.title.ar).toBe('تبديل جرة الغاز');expect(gas.body.pricingPolicy).toBeNull();
    expect(gas.body.description.en).toContain('exchange for the empty cylinder');
    await seedCanonicalCatalog(categoryModel, serviceModel);
    for(const [slug,id] of [['piano-moving',piano!._id],['heating-system-maintenance',heating!._id],['ac-cooling-diagnostics-recharge',ac!._id]] as const){
      const current=await serviceModel.findOne({slug}).exec();expect(current!._id.toString()).toBe(id.toString());
    }
    expect((await serviceModel.findOne({slug:'ac-cooling-diagnostics-recharge'}).exec())!.pricingPolicy!.indicativeAmountFils).toBe(15000);
  });

  it('returns active categories ordered by displayOrder and category details by slug', async () => {
    const listRes = await request(app.getHttpServer()).get('/api/v1/categories').expect(200);
    expect(listRes.body).toHaveLength(15);
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
    expect(allRes.body.total).toBe(62);
    expect(allRes.body.totalPages).toBe(13);
    expect(
      allRes.body.items.every(
        (item: { pricingPolicy: { indicativeAmountFils: number } | null }) =>
          item.pricingPolicy === null || Number.isInteger(item.pricingPolicy.indicativeAmountFils),
      ),
    ).toBe(true);
    const priced = await request(app.getHttpServer())
      .get('/api/v1/services?limit=50&sort=price_asc&pricingType=STARTING_AT')
      .expect(200);
    const amounts = priced.body.items.map(
      (item: { pricingPolicy: { indicativeAmountFils: number } }) =>
        item.pricingPolicy.indicativeAmountFils,
    );
    expect(amounts).toEqual([...amounts].sort((a: number, b: number) => a - b));

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
    const quote = await request(app.getHttpServer()).patch(`/api/v1/services/${newServiceId}`).set('Authorization', `Bearer ${adminToken}`).send({pricingPolicy:null}).expect(200);
    expect(quote.body.pricingPolicy).toBeNull();
    const restored = await request(app.getHttpServer()).patch(`/api/v1/services/${newServiceId}`).set('Authorization', `Bearer ${adminToken}`).send({pricingPolicy:{pricingType:PricingType.FIXED,indicativeAmountFils:25000}}).expect(200);
    expect(restored.body.pricingPolicy.indicativeAmountFils).toBe(25000);


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
