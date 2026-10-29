import mongoose, { Connection, Model, Types } from 'mongoose';
import {
  AccountStatus,
  BookingActorRole,
  BookingEventKind,
  BookingStatus,
  CurrencyCode,
  NotificationResourceType,
  NotificationType,
  PricingType,
  ProviderApprovalStatus,
  ReviewModerationStatus,
  SupportedLanguage,
  UserRole,
} from '../../common/domain';
import {
  Address,
  AddressSchema,
  Booking,
  BookingEvent,
  BookingEventSchema,
  BookingSchema,
  Category,
  CategorySchema,
  Notification,
  NotificationSchema,
  ProviderProfile,
  ProviderProfileSchema,
  ProviderServiceOffering,
  ProviderServiceOfferingSchema,
  ProviderSlot,
  ProviderSlotSchema,
  Review,
  ReviewSchema,
  Service,
  ServiceSchema,
  User,
  UserSchema,
} from './index';

describe('MongoDB Domain Schemas, Constraints & Unique Indexes', () => {
  let connection: Connection;
  let userModel: Model<User>;
  let providerProfileModel: Model<ProviderProfile>;
  let categoryModel: Model<Category>;
  let serviceModel: Model<Service>;
  let providerServiceModel: Model<ProviderServiceOffering>;
  let addressModel: Model<Address>;
  let bookingModel: Model<Booking>;
  let providerSlotModel: Model<ProviderSlot>;
  let bookingEventModel: Model<BookingEvent>;
  let reviewModel: Model<Review>;
  let notificationModel: Model<Notification>;

  const testMongoUri =
    process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmate_phase1_schema_test';

  beforeAll(async () => {
    connection = await mongoose
      .createConnection(testMongoUri, {
        serverSelectionTimeoutMS: 5000,
      })
      .asPromise();

    userModel = connection.model(User.name, UserSchema);
    providerProfileModel = connection.model(ProviderProfile.name, ProviderProfileSchema);
    categoryModel = connection.model(Category.name, CategorySchema);
    serviceModel = connection.model(Service.name, ServiceSchema);
    providerServiceModel = connection.model(
      ProviderServiceOffering.name,
      ProviderServiceOfferingSchema,
    );
    addressModel = connection.model(Address.name, AddressSchema);
    bookingModel = connection.model(Booking.name, BookingSchema);
    providerSlotModel = connection.model(ProviderSlot.name, ProviderSlotSchema);
    bookingEventModel = connection.model(BookingEvent.name, BookingEventSchema);
    reviewModel = connection.model(Review.name, ReviewSchema);
    notificationModel = connection.model(Notification.name, NotificationSchema);

    await Promise.all([
      userModel.syncIndexes(),
      providerProfileModel.syncIndexes(),
      categoryModel.syncIndexes(),
      serviceModel.syncIndexes(),
      providerServiceModel.syncIndexes(),
      addressModel.syncIndexes(),
      bookingModel.syncIndexes(),
      providerSlotModel.syncIndexes(),
      bookingEventModel.syncIndexes(),
      reviewModel.syncIndexes(),
      notificationModel.syncIndexes(),
    ]);

    await Promise.all([
      userModel.deleteMany({}),
      providerProfileModel.deleteMany({}),
      categoryModel.deleteMany({}),
      serviceModel.deleteMany({}),
      providerServiceModel.deleteMany({}),
      addressModel.deleteMany({}),
      bookingModel.deleteMany({}),
      providerSlotModel.deleteMany({}),
      bookingEventModel.deleteMany({}),
      reviewModel.deleteMany({}),
      notificationModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    if (connection && connection.readyState === 1) {
      await Promise.all([
        userModel.deleteMany({}),
        providerProfileModel.deleteMany({}),
        categoryModel.deleteMany({}),
        serviceModel.deleteMany({}),
        providerServiceModel.deleteMany({}),
        addressModel.deleteMany({}),
        bookingModel.deleteMany({}),
        providerSlotModel.deleteMany({}),
        bookingEventModel.deleteMany({}),
        reviewModel.deleteMany({}),
        notificationModel.deleteMany({}),
      ]);
      await connection.close();
    }
  });

  it('enforces normalized unique email on users and excludes passwordHash from default queries', async () => {
    const created = await userModel.create({
      fullName: 'Ahmad Al-Zoubi',
      email: 'Ahmad.Customer@Example.com',
      passwordHash: '$2b$10$placeholderHashForPhaseTwoAuthTesting123456',
      role: UserRole.CUSTOMER,
      status: AccountStatus.ACTIVE,
      preferredLanguage: SupportedLanguage.AR,
    });

    expect(created.email).toBe('ahmad.customer@example.com');

    const queried = await userModel.findById(created._id).lean();
    expect(queried).toBeDefined();
    expect((queried as Record<string, unknown>).passwordHash).toBeUndefined();

    await expect(
      userModel.create({
        fullName: 'Duplicate User',
        email: 'ahmad.customer@example.com',
        passwordHash: '$2b$10$anotherPlaceholderHashForPhaseTwoAuthTest',
        role: UserRole.CUSTOMER,
      }),
    ).rejects.toThrow(/E11000/);
  });

  it('enforces one-review-per-booking uniqueness and 1..5 integer rating bounds', async () => {
    const customerId = new Types.ObjectId();
    const providerProfileId = new Types.ObjectId();
    const bookingId = new Types.ObjectId();

    const firstReview = await reviewModel.create({
      bookingId,
      customerId,
      providerProfileId,
      rating: 5,
      comment: 'Excellent plumbing repair, arrived on time.',
      moderationStatus: ReviewModerationStatus.VISIBLE,
    });

    expect(firstReview.rating).toBe(5);

    // Duplicate review for the same bookingId must fail with E11000
    await expect(
      reviewModel.create({
        bookingId,
        customerId,
        providerProfileId,
        rating: 4,
        comment: 'Second review on same booking should fail.',
      }),
    ).rejects.toThrow(/E11000/);

    // Invalid rating (> 5 or non-integer) must fail validation
    await expect(
      reviewModel.create({
        bookingId: new Types.ObjectId(),
        customerId,
        providerProfileId,
        rating: 6,
      }),
    ).rejects.toThrow();

    await expect(
      reviewModel.create({
        bookingId: new Types.ObjectId(),
        customerId,
        providerProfileId,
        rating: 4.5,
      }),
    ).rejects.toThrow(/rating must be an integer/);
  });

  it('rejects invalid booking status and floating-point fils amounts, and prevents overlapping provider_slots', async () => {
    const customerId = new Types.ObjectId();
    const providerProfileId = new Types.ObjectId();
    const serviceId = new Types.ObjectId();

    // Rejects invalid BookingStatus
    await expect(
      bookingModel.create({
        customerId,
        providerProfileId,
        serviceId,
        serviceSnapshot: {
          slug: 'pipe-leak-repair',
          titleAr: 'إصلاح تسرب المياه',
          titleEn: 'Pipe Leak Repair',
          categorySlug: 'plumbing',
        },
        addressSnapshot: {
          governorate: 'Amman',
          cityOrDistrict: 'Abdoun',
          street: 'Al-Umawyeen St',
          building: '14',
          contactPhone: '+962790000000',
        },
        pricingSnapshot: {
          pricingType: PricingType.STARTING_AT,
          quotedAmountFils: 15000,
          currency: CurrencyCode.JOD,
        },
        requestedStartUtc: new Date('2026-11-10T09:00:00.000Z'),
        requestedEndUtc: new Date('2026-11-10T10:00:00.000Z'),
        status: 'INVALID_STATUS' as BookingStatus,
      }),
    ).rejects.toThrow();

    // Rejects floating-point JOD amount in pricingSnapshot
    await expect(
      bookingModel.create({
        customerId,
        providerProfileId,
        serviceId,
        serviceSnapshot: {
          slug: 'pipe-leak-repair',
          titleAr: 'إصلاح تسرب المياه',
          titleEn: 'Pipe Leak Repair',
          categorySlug: 'plumbing',
        },
        addressSnapshot: {
          governorate: 'Amman',
          cityOrDistrict: 'Abdoun',
          street: 'Al-Umawyeen St',
          building: '14',
          contactPhone: '+962790000000',
        },
        pricingSnapshot: {
          pricingType: PricingType.FIXED,
          quotedAmountFils: 15.5,
          currency: CurrencyCode.JOD,
        },
        requestedStartUtc: new Date('2026-11-10T09:00:00.000Z'),
        requestedEndUtc: new Date('2026-11-10T10:00:00.000Z'),
        status: BookingStatus.REQUESTED,
      }),
    ).rejects.toThrow(/quotedAmountFils/);

    // Atomic slot conflict protection via { providerProfileId, slotStartUtc } unique index
    const slotStartUtc = new Date('2026-11-10T09:00:00.000Z');
    const slotEndUtc = new Date('2026-11-10T09:30:00.000Z');

    await providerSlotModel.create({
      providerProfileId,
      bookingId: new Types.ObjectId(),
      slotStartUtc,
      slotEndUtc,
    });

    await expect(
      providerSlotModel.create({
        providerProfileId,
        bookingId: new Types.ObjectId(),
        slotStartUtc,
        slotEndUtc,
      }),
    ).rejects.toThrow(/E11000/);
  });

  it('persists and indexes all remaining domain collections (categories, services, provider_profiles, provider_services, addresses, booking_events, notifications)', async () => {
    const providerUser = await userModel.create({
      fullName: 'Khaled Haddad',
      email: 'khaled.provider@example.com',
      passwordHash: '$2b$10$providerPlaceholderHashForPhase1Test123456',
      role: UserRole.PROVIDER,
    });

    const profile = await providerProfileModel.create({
      userId: providerUser._id,
      displayName: 'Khaled Master Plumbing',
      bio: {
        ar: 'فني سباكة معتمد بخبرة ١٢ عاماً في عمان',
        en: 'Certified plumbing technician with 12 years of experience in Amman',
      },
      yearsOfExperience: 12,
      coverageGovernorates: ['amman'],
      coverageAreas: ['abdoun', 'khalda'],
      approvalStatus: ProviderApprovalStatus.PENDING_REVIEW,
    });

    const category = await categoryModel.create({
      slug: 'plumbing',
      name: { ar: 'السباكة', en: 'Plumbing' },
      description: { ar: 'خدمات السباكة المنزلية', en: 'Residential plumbing services' },
      displayOrder: 1,
    });

    const service = await serviceModel.create({
      categoryId: category._id,
      slug: 'water-heater-maintenance',
      title: { ar: 'صيانة سخان المياه', en: 'Water Heater Maintenance' },
      description: {
        ar: 'فحص وصيانة سخانات المياه الكهربائية والغازية',
        en: 'Inspection and maintenance of electric and gas water heaters',
      },
      pricingPolicy: {
        pricingType: PricingType.STARTING_AT,
        indicativeAmountFils: 12000,
        currency: CurrencyCode.JOD,
      },
      defaultDurationMinutes: 60,
    });

    const offering = await providerServiceModel.create({
      providerProfileId: profile._id,
      serviceId: service._id,
      pricingType: PricingType.STARTING_AT,
      priceAmountFils: 12000,
      estimatedDurationMinutes: 60,
    });

    const address = await addressModel.create({
      customerId: providerUser._id,
      label: 'Home',
      governorate: 'Amman',
      cityOrDistrict: 'Khalda',
      street: 'Wasfi Al-Tal St',
      building: '22B',
      landmark: 'Near Khalda Circle',
      contactPhone: '+962791112233',
    });

    const booking = await bookingModel.create({
      customerId: providerUser._id,
      providerProfileId: profile._id,
      serviceId: service._id,
      serviceSnapshot: {
        slug: service.slug,
        titleAr: service.title.ar,
        titleEn: service.title.en,
        categorySlug: category.slug,
      },
      addressSnapshot: {
        label: address.label,
        governorate: address.governorate,
        cityOrDistrict: address.cityOrDistrict,
        street: address.street,
        building: address.building,
        landmark: address.landmark,
        contactPhone: address.contactPhone,
      },
      pricingSnapshot: {
        pricingType: offering.pricingType,
        quotedAmountFils: offering.priceAmountFils,
        currency: CurrencyCode.JOD,
      },
      requestedStartUtc: new Date('2026-11-12T10:00:00.000Z'),
      requestedEndUtc: new Date('2026-11-12T11:00:00.000Z'),
      status: BookingStatus.REQUESTED,
    });

    const event = await bookingEventModel.create({
      bookingId: booking._id,
      actorUserId: providerUser._id,
      actorRole: BookingActorRole.CUSTOMER,
      eventKind: BookingEventKind.CREATED,
      toStatus: BookingStatus.REQUESTED,
    });

    const notification = await notificationModel.create({
      recipientUserId: providerUser._id,
      type: NotificationType.BOOKING_REQUESTED,
      title: { ar: 'طلب حجز جديد', en: 'New Booking Request' },
      body: {
        ar: 'لديك طلب حجز جديد لصيانة سخان المياه',
        en: 'You have a new booking request for Water Heater Maintenance',
      },
      relatedResourceType: NotificationResourceType.BOOKING,
      relatedResourceId: booking._id,
    });

    expect(profile._id).toBeDefined();
    expect(offering._id).toBeDefined();
    expect(event._id).toBeDefined();
    expect(notification.isRead).toBe(false);
  });
});
