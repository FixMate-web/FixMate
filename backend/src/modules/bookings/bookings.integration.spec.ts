import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { Connection } from 'mongoose';
import * as request from 'supertest';
import { DatabaseModule } from '../../database/database.module';
import { bootstrapAdminAccount } from '../../scripts/bootstrap-admin';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProvidersModule } from '../providers/providers.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { UsersModule } from '../users/users.module';
import { BookingsModule } from './bookings.module';

describe('Phase 3, 4 & 5 Integration: Addresses, Bookings, Atomic Slot Reservation, Lifecycle, Reviews, Admin & Notifications', () => {
  let app: INestApplication;
  let connection: Connection;
  let customerToken: string;
  let strangerToken: string;
  let providerToken: string;
  let otherProviderToken: string;
  let adminToken: string;
  let providerId: string;
  let serviceId: string;
  let savedAddressId: string;

  const uri = `mongodb://127.0.0.1:27017/fixmate_bookings_test_${Date.now()}`;
  const password = 'BookingTestPassword123';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = uri;
    process.env.JWT_ACCESS_SECRET =
      'booking-integration-test-secret-at-least-32-chars';
    process.env.CORS_ORIGINS = 'http://localhost:4200';

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        MongooseModule.forRoot(uri),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 500 }]),
        DatabaseModule,
        UsersModule,
        AuthModule,
        CatalogModule,
        ProvidersModule,
        NotificationsModule,
        BookingsModule,
        ReviewsModule,
        AdminModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    connection = moduleRef.get<Connection>(getConnectionToken());
    expect(connection.name).toBe(uri.split('/').pop());

    await bootstrapAdminAccount({
      mongoUri: uri,
      email: 'admin@bookings.test',
      password,
      fullName: 'Bookings Test Admin',
    });

    adminToken = (
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@bookings.test', password })
        .expect(200)
    ).body.accessToken as string;

    async function registerUser(email: string, role: string): Promise<string> {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          fullName: `User ${email}`,
          email,
          password,
          role,
        })
        .expect(201);
      return res.body.accessToken as string;
    }

    customerToken = await registerUser('customer@bookings.test', 'CUSTOMER');
    strangerToken = await registerUser('stranger@bookings.test', 'CUSTOMER');
    providerToken = await registerUser('provider@bookings.test', 'PROVIDER');
    otherProviderToken = await registerUser(
      'other-provider@bookings.test',
      'PROVIDER',
    );

    const catRes = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug: 'electrical-repairs',
        name: { ar: 'صيانة كهربائية', en: 'Electrical Repairs' },
        description: {
          ar: 'خدمات الكهرباء المنزلية',
          en: 'Home electrical repair services',
        },
      })
      .expect(201);

    const svcRes = await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: catRes.body.id,
        slug: 'breaker-panel-inspection',
        title: { ar: 'فحص لوحة القواطع', en: 'Breaker Panel Inspection' },
        description: {
          ar: 'فحص وصيانة لوحة القواطع الكهربائية',
          en: 'Inspection and maintenance of main breaker panel',
        },
        pricingPolicy: {
          pricingType: 'FIXED',
          indicativeAmountFils: 20000,
        },
        defaultDurationMinutes: 120,
      })
      .expect(201);
    serviceId = svcRes.body.id as string;

    const profRes = await request(app.getHttpServer())
      .patch('/api/v1/providers/me')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        displayName: 'Amman Master Electrician',
        bio: {
          ar: 'فني كهرباء معتمد بخبرة تزيد عن عشر سنوات في عمان',
          en: 'Certified master electrician with over 10 years experience in Amman.',
        },
        yearsOfExperience: 10,
        coverageGovernorates: ['Amman', 'Zarqa'],
        coverageAreas: ['Abdoun', 'Sweifieh', 'Khalda'],
        weeklyAvailability: [
          { dayOfWeek: 0, startMinuteOfDay: 480, endMinuteOfDay: 1080 },
          { dayOfWeek: 1, startMinuteOfDay: 480, endMinuteOfDay: 1080 },
        ],
      })
      .expect(200);
    providerId = profRes.body.id as string;

    await request(app.getHttpServer())
      .put('/api/v1/providers/me/services')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        serviceId,
        pricingType: 'FIXED',
        priceAmountFils: 25000,
        estimatedDurationMinutes: 120,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/providers/me/submit')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/providers/${providerId}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' })
      .expect(200);
  }, 30000);

  afterAll(async () => {
    if (
      connection &&
      connection.name.startsWith('fixmate_bookings_test_')
    ) {
      await connection.dropDatabase();
    }
    if (app) {
      await app.close();
    }
  });

  function futureSlotIso(daysAhead: number, hourUtc: number, minuteUtc = 0): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + daysAhead);
    d.setUTCHours(hourUtc, minuteUtc, 0, 0);
    return d.toISOString();
  }

  it('manages customer saved addresses with strict ownership protection', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        label: 'Home Apartment',
        governorate: 'Amman',
        cityOrDistrict: 'Abdoun',
        street: 'Princess Basma St',
        building: 'Building 14',
        floorOrApartment: 'Floor 3, Apt 6',
        landmark: 'Near Abdoun Circle',
        contactPhone: '+962790001122',
      })
      .expect(201);

    savedAddressId = createRes.body.id as string;
    expect(createRes.body.isDefault).toBe(true);

    // Stranger cannot update or delete customer's address
    await request(app.getHttpServer())
      .patch(`/api/v1/addresses/${savedAddressId}`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({ label: 'Hijacked' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/addresses/${savedAddressId}`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .expect(404);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].id).toBe(savedAddressId);
  });

  it('creates a REQUESTED booking with immutable snapshots, integer fils pricing, and idempotency', async () => {
    const clientRequestId = randomUUID();
    const startIso = futureSlotIso(5, 10, 0);

    const first = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerProfileId: providerId,
        serviceId,
        requestedStartUtc: startIso,
        addressId: savedAddressId,
        customerNotes: 'Main kitchen breaker trips when oven runs.',
        clientRequestId,
      })
      .expect(201);

    expect(first.body.status).toBe('REQUESTED');
    expect(first.body.pricingSnapshot.quotedAmountFils).toBe(25000);
    expect(first.body.pricingSnapshot.currency).toBe('JOD');
    expect(first.body.serviceSnapshot.slug).toBe('breaker-panel-inspection');
    expect(first.body.addressSnapshot.governorate).toBe('Amman');
    expect(first.body.reservedSlots).toHaveLength(0);
    expect(first.body.events).toHaveLength(1);

    // Retry with same clientRequestId returns the exact same booking idempotently
    const retry = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerProfileId: providerId,
        serviceId,
        requestedStartUtc: startIso,
        addressId: savedAddressId,
        customerNotes: 'Main kitchen breaker trips when oven runs.',
        clientRequestId,
      })
      .expect(201);

    expect(retry.body.id).toBe(first.body.id);

    // Rejects non-30-minute boundary timestamp
    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerProfileId: providerId,
        serviceId,
        requestedStartUtc: futureSlotIso(5, 10, 15),
        addressId: savedAddressId,
      })
      .expect(400);
  });

  it('enforces atomic 30-minute slot reservation on concurrent provider acceptance and releases slots on cancellation', async () => {
    // Booking A: Day +7, 10:00 -> 12:00 UTC (slots: 10:00, 10:30, 11:00, 11:30)
    const bookingARes = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerProfileId: providerId,
        serviceId,
        requestedStartUtc: futureSlotIso(7, 10, 0),
        addressId: savedAddressId,
      })
      .expect(201);

    // Booking B: Day +7, 11:00 -> 13:00 UTC (slots: 11:00, 11:30, 12:00, 12:30) — overlaps 11:00 and 11:30!
    const bookingBRes = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({
        providerProfileId: providerId,
        serviceId,
        requestedStartUtc: futureSlotIso(7, 11, 0),
        address: {
          governorate: 'Amman',
          cityOrDistrict: 'Sweifieh',
          street: 'Wakalat St',
          building: '22',
          contactPhone: '+962791112233',
        },
      })
      .expect(201);

    const idA = bookingARes.body.id as string;
    const idB = bookingBRes.body.id as string;

    // Race both accept requests concurrently
    const [resA, resB] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/v1/bookings/${idA}/accept`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ providerNotes: 'Accepting A' }),
      request(app.getHttpServer())
        .patch(`/api/v1/bookings/${idB}/accept`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ providerNotes: 'Accepting B' }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winnerId = resA.status === 200 ? idA : idB;
    const loserId = resA.status === 200 ? idB : idA;

    const winnerDetail = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${winnerId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);
    expect(winnerDetail.body.status).toBe('ACCEPTED');
    expect(winnerDetail.body.reservedSlots).toHaveLength(4);

    // Cancel the winning ACCEPTED booking -> releases its 4 slots
    await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${winnerId}/cancel`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ reason: 'Schedule adjustment needed' })
      .expect(200);

    // Now the loser booking can be accepted cleanly!
    const retryLoser = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${loserId}/accept`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ providerNotes: 'Now slot is free' })
      .expect(200);
    expect(retryLoser.body.status).toBe('ACCEPTED');
    expect(retryLoser.body.reservedSlots).toHaveLength(4);
  });

  it('completes the full booking lifecycle, enforces one review per completed booking, recalculates ratings, and emits notifications', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        providerProfileId: providerId,
        serviceId,
        requestedStartUtc: futureSlotIso(9, 14, 0),
        addressId: savedAddressId,
      })
      .expect(201);

    const bookingId = createRes.body.id as string;

    // Cannot review before COMPLETED
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/review`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 5, comment: 'Too early' })
      .expect(400);

    // Other provider cannot accept
    await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${otherProviderToken}`)
      .send({})
      .expect(403);

    // Assigned provider accepts -> starts -> marks work done
    await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ providerNotes: 'Confirmed for 14:00 UTC' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${bookingId}/start`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ providerNotes: 'On site, starting inspection' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${bookingId}/work-done`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        agreedAmountFils: 25000,
        providerNotes: 'Replaced faulty 32A breaker and tested load.',
      })
      .expect(200);

    // Customer confirms completion
    const completedRes = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${bookingId}/complete`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Great work, everything works safely.' })
      .expect(200);

    expect(completedRes.body.status).toBe('COMPLETED');
    expect(completedRes.body.events).toHaveLength(5);

    // Customer submits verified review
    const reviewRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/review`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 5,
        comment: 'Punctual, professional, and solved the breaker issue cleanly.',
      })
      .expect(201);

    expect(reviewRes.body.rating).toBe(5);

    // Duplicate review on same booking is rejected with 409 Conflict
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/review`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 4, comment: 'Second review attempt' })
      .expect(409);

    // Public provider profile now reflects real averageRating=5 and reviewCount=1
    const pubProf = await request(app.getHttpServer())
      .get(`/api/v1/providers/${providerId}`)
      .expect(200);
    expect(pubProf.body.averageRating).toBe(5);
    expect(pubProf.body.reviewCount).toBe(1);

    // Admin hides review -> provider rating recalculates to 0 reviews
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/reviews/${reviewRes.body.id}/visibility`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        moderationStatus: 'HIDDEN',
        reason: 'Testing moderation visibility toggle',
      })
      .expect(200);

    const pubProfAfterHide = await request(app.getHttpServer())
      .get(`/api/v1/providers/${providerId}`)
      .expect(200);
    expect(pubProfAfterHide.body.reviewCount).toBe(0);

    // Admin restores review -> provider rating returns to 5
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/reviews/${reviewRes.body.id}/visibility`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        moderationStatus: 'VISIBLE',
        reason: 'Restored after audit',
      })
      .expect(200);

    // Verify customer & provider notifications were persisted
    const customerNotifs = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(customerNotifs.body.total).toBeGreaterThanOrEqual(2);
    expect(customerNotifs.body.unreadCount).toBeGreaterThanOrEqual(2);

    const firstNotifId = customerNotifs.body.items[0].id as string;
    const markOne = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${firstNotifId}/read`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(markOne.body.isRead).toBe(true);

    await request(app.getHttpServer())
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    // Verify Admin Overview metrics endpoint returns real bounded aggregations
    const overview = await request(app.getHttpServer())
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(overview.body.bookings.completed).toBeGreaterThanOrEqual(1);
    expect(overview.body.reviews.visible).toBe(1);
    expect(overview.body.providers.approved).toBe(1);
  });
});
