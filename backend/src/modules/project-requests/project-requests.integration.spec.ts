import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ProvidersModule } from '../providers/providers.module';
import { ProjectRequestsModule } from './project-requests.module';
import { bootstrapAdminAccount } from '../../scripts/bootstrap-admin';

describe('Project requests: persistence, ownership and state transitions', () => {
  let app: INestApplication;
  let connection: Connection;
  let customer: string;
  let stranger: string;
  let provider: string;
  let otherProvider: string;
  let admin: string;
  let providerId: string;
  let serviceId: string;
  const uri = `mongodb://127.0.0.1:27017/fixmate_project_requests_test_${Date.now()}`;
  const password = 'RequestTestPassword123';
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = uri;
    process.env.JWT_ACCESS_SECRET = 'project-request-test-secret-at-least-32-characters';
    process.env.CORS_ORIGINS = 'http://localhost:4200';
    const module = await Test.createTestingModule({ imports: [ConfigModule.forRoot({isGlobal:true,ignoreEnvFile:true}),MongooseModule.forRoot(uri),ThrottlerModule.forRoot([{name:'default',ttl:60000,limit:200}]),UsersModule,AuthModule,CatalogModule,ProvidersModule,ProjectRequestsModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    connection = module.get<Connection>(getConnectionToken());
    expect(connection.name).toBe(uri.split('/').pop());
    await bootstrapAdminAccount({
      mongoUri: uri,
      email: 'admin@requests.test',
      password,
      fullName: 'Test administrator',
    });
    admin = (
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@requests.test', password })
        .expect(200)
    ).body.accessToken as string;
    async function register(email: string, role: string) {
      return (
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({ fullName: 'Isolated test account', email, password, role })
          .expect(201)
      ).body.accessToken as string;
    }
    customer = await register('customer@requests.test', 'CUSTOMER');
    stranger = await register('stranger@requests.test', 'CUSTOMER');
    provider = await register('provider@requests.test', 'PROVIDER');
    otherProvider = await register('other-provider@requests.test', 'PROVIDER');
    const category = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        slug: 'test-plumbing',
        name: { en: 'Test plumbing', ar: 'سباكة اختبار' },
        description: { en: 'Test category', ar: 'تصنيف تجريبي' },
      })
      .expect(201);
    const svc = await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        categoryId: category.body.id,
        slug: 'test-leak-repair',
        title: { en: 'Test leak repair', ar: 'إصلاح تسرب تجريبي' },
        description: { en: 'Test service description', ar: 'وصف الخدمة التجريبية' },
        pricingPolicy: { pricingType: 'STARTING_AT', indicativeAmountFils: 15000 },
        defaultDurationMinutes: 60,
      })
      .expect(201);
    serviceId = svc.body.id as string;
    const profile = await request(app.getHttpServer())
      .patch('/api/v1/providers/me')
      .set('Authorization', `Bearer ${provider}`)
      .send({
        displayName: 'QA Plumbing Fixture',
        bio: {
          en: 'Test provider biography for isolated integration verification.',
          ar: 'نبذة تجريبية لمزود الخدمة للتحقق في بيئة اختبار معزولة.',
        },
        yearsOfExperience: 4,
        coverageGovernorates: ['Amman'],
        coverageAreas: ['Test area'],
        weeklyAvailability: [{ dayOfWeek: 0, startMinuteOfDay: 540, endMinuteOfDay: 1020 }],
      })
      .expect(200);
    providerId = profile.body.id as string;
    await request(app.getHttpServer())
      .put('/api/v1/providers/me/services')
      .set('Authorization', `Bearer ${provider}`)
      .send({
        serviceId,
        pricingType: 'STARTING_AT',
        priceAmountFils: 16000,
        estimatedDurationMinutes: 60,
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/providers/me/submit')
      .set('Authorization', `Bearer ${provider}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/providers/${providerId}/approval`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'APPROVED' })
      .expect(200);
  }, 30000);
  afterAll(async () => {
    if (connection && connection.name === uri.split('/').pop() && connection.name.startsWith('fixmate_project_requests_test_')) {
      for (const collection of Object.values(connection.collections))
        await collection.deleteMany({});
    }
    if (app) await app.close();
  });
  function payload() {
    return {
      providerProfileId: providerId,
      serviceId,
      clientRequestId: randomUUID(),
      governorate: 'Amman',
      area: 'Test area',
      description: 'Please inspect and repair a leaking kitchen fitting.',
    };
  }
  async function create() {
    return request(app.getHttpServer())
      .post('/api/v1/project-requests')
      .set('Authorization', `Bearer ${customer}`)
      .send(payload())
      .expect(201);
  }
  it('persists a request, snapshots names, and makes retries idempotent', async () => {
    const body = payload();
    const first = await request(app.getHttpServer())
      .post('/api/v1/project-requests')
      .set('Authorization', `Bearer ${customer}`)
      .send(body)
      .expect(201);
    const retry = await request(app.getHttpServer())
      .post('/api/v1/project-requests')
      .set('Authorization', `Bearer ${customer}`)
      .send(body)
      .expect(201);
    expect(retry.body.id).toBe(first.body.id);
    expect(first.body.status).toBe('OPEN');
    const stored = await connection
      .collection('project_requests')
      .findOne({ clientRequestId: body.clientRequestId });
    expect(stored?.description).toBe(body.description);
    expect(first.body.customerId).toBeUndefined();
    expect(first.body.email).toBeUndefined();
  });
  it('requires customer authorization and rejects client-owned status fields', async () => {
    await request(app.getHttpServer()).post('/api/v1/project-requests').send(payload()).expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/project-requests')
      .set('Authorization', `Bearer ${provider}`)
      .send(payload())
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/project-requests')
      .set('Authorization', `Bearer ${customer}`)
      .send({ ...payload(), status: 'RESPONDED' })
      .expect(400);
  });
  it('rejects an unsupported service and a location outside provider coverage', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/project-requests')
      .set('Authorization', `Bearer ${customer}`)
      .send({ ...payload(), serviceId: '000000000000000000000001' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/project-requests')
      .set('Authorization', `Bearer ${customer}`)
      .send({ ...payload(), governorate: 'Irbid' })
      .expect(400);
  });
  it('hides requests from unrelated customers and providers', async () => {
    const r = await create();
    await request(app.getHttpServer())
      .get(`/api/v1/project-requests/${r.body.id}`)
      .set('Authorization', `Bearer ${stranger}`)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/v1/project-requests/${r.body.id}/response`)
      .set('Authorization', `Bearer ${otherProvider}`)
      .send({ status: 'RESPONDED', response: 'This is not my request.' })
      .expect(404);
    const list = await request(app.getHttpServer())
      .get('/api/v1/project-requests')
      .set('Authorization', `Bearer ${stranger}`)
      .expect(200);
    expect(list.body.total).toBe(0);
  });
  it('allows one provider response, customer cancellation, and admin oversight', async () => {
    const r = await create();
    const id = r.body.id as string;
    await request(app.getHttpServer())
      .patch(`/api/v1/project-requests/${id}/response`)
      .set('Authorization', `Bearer ${customer}`)
      .send({ status: 'RESPONDED', response: 'Unauthorized customer response.' })
      .expect(403);
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/project-requests/${id}/response`)
      .set('Authorization', `Bearer ${provider}`)
      .send({ status: 'RESPONDED', response: 'I can discuss the described work with you.' })
      .expect(200);
    expect(response.body.providerResponse).toContain('described work');
    await request(app.getHttpServer())
      .patch(`/api/v1/project-requests/${id}/response`)
      .set('Authorization', `Bearer ${provider}`)
      .send({ status: 'DECLINED', response: 'A second response should not overwrite it.' })
      .expect(409);
    await request(app.getHttpServer())
      .patch(`/api/v1/project-requests/${id}/cancel`)
      .set('Authorization', `Bearer ${customer}`)
      .expect(200);
    const view = await request(app.getHttpServer())
      .get(`/api/v1/project-requests/${id}`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(view.body.status).toBe('CANCELLED');
    await request(app.getHttpServer())
      .patch(`/api/v1/project-requests/${id}/cancel`)
      .set('Authorization', `Bearer ${customer}`)
      .expect(409);
  });
  it('does not allow a provider response after cancellation', async () => {
    const r = await create();
    await request(app.getHttpServer())
      .patch(`/api/v1/project-requests/${r.body.id}/cancel`)
      .set('Authorization', `Bearer ${customer}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/project-requests/${r.body.id}/response`)
      .set('Authorization', `Bearer ${provider}`)
      .send({ status: 'RESPONDED', response: 'This must not reopen a cancelled request.' })
      .expect(409);
  });
});
