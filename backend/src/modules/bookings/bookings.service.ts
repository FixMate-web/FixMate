import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/auth';
import {
  AccountStatus,
  BookingActorRole,
  BookingEventKind,
  BookingStatus,
  canTransitionBookingStatus,
  CurrencyCode,
  decomposeWindowIntoSlots,
  findBookingTransitionRule,
  isAlignedToSlotBoundary,
  NotificationResourceType,
  NotificationType,
  PricingType,
  ProviderApprovalStatus,
  UserRole,
} from '../../common/domain';
import {
  Address,
  AddressDocument,
  Booking,
  BookingAddressSnapshot,
  BookingDocument,
  BookingEvent,
  BookingEventDocument,
  Category,
  CategoryDocument,
  ProviderProfile,
  ProviderProfileDocument,
  ProviderServiceOffering,
  ProviderServiceOfferingDocument,
  ProviderSlot,
  ProviderSlotDocument,
  Review,
  ReviewDocument,
  Service,
  ServiceDocument,
  User,
  UserDocument,
} from '../../database/schemas';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AcceptBookingDto,
  CancelBookingDto,
  CompleteBookingDto,
  CreateAddressDto,
  CreateBookingDto,
  MarkWorkDoneDto,
  QueryBookingsDto,
  RejectBookingDto,
  StartBookingDto,
  UpdateAddressDto,
} from './bookings.dto';

export interface SavedAddressView {
  id: string;
  customerId: string;
  label?: string;
  governorate: string;
  cityOrDistrict: string;
  street: string;
  building: string;
  floorOrApartment?: string;
  landmark?: string;
  contactPhone: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingEventView {
  id: string;
  bookingId: string;
  actorUserId?: string;
  actorRole: BookingActorRole;
  eventKind: BookingEventKind;
  fromStatus?: BookingStatus;
  toStatus: BookingStatus;
  reason?: string;
  occurredAt: string;
}

export interface BookingSlotView {
  slotStartUtc: string;
  slotEndUtc: string;
}

export interface BookingView {
  id: string;
  customerId: string;
  customerName?: string;
  providerProfileId: string;
  providerDisplayName?: string;
  serviceId: string;
  serviceSnapshot: {
    slug: string;
    titleAr: string;
    titleEn: string;
    categorySlug: string;
  };
  addressSnapshot: BookingAddressSnapshot;
  pricingSnapshot: {
    pricingType: PricingType;
    quotedAmountFils: number;
    agreedAmountFils?: number;
    currency: CurrencyCode;
  };
  requestedStartUtc: string;
  requestedEndUtc: string;
  confirmedStartUtc?: string;
  confirmedEndUtc?: string;
  status: BookingStatus;
  customerNotes?: string;
  providerNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledByRole?: BookingActorRole;
  acceptedAt?: string;
  startedAt?: string;
  workDoneAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
  createdAt?: string;
  updatedAt?: string;
  hasReview?: boolean;
}

export interface BookingDetailView extends BookingView {
  events: BookingEventView[];
  reservedSlots: BookingSlotView[];
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(BookingEvent.name)
    private readonly bookingEventModel: Model<BookingEventDocument>,
    @InjectModel(ProviderSlot.name)
    private readonly providerSlotModel: Model<ProviderSlotDocument>,
    @InjectModel(ProviderProfile.name)
    private readonly providerProfileModel: Model<ProviderProfileDocument>,
    @InjectModel(ProviderServiceOffering.name)
    private readonly offeringModel: Model<ProviderServiceOfferingDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  // ===========================================================================
  // SAVED CUSTOMER ADDRESSES CRUD (/api/v1/addresses)
  // ===========================================================================

  async listMyAddresses(user: AuthenticatedUser): Promise<SavedAddressView[]> {
    const docs = await this.addressModel
      .find({
        customerId: new Types.ObjectId(user.id),
        isActive: true,
      })
      .sort({ isDefault: -1, createdAt: -1, _id: -1 })
      .limit(25)
      .exec();

    return docs.map((d) => this.toAddressView(d));
  }

  async createMyAddress(
    user: AuthenticatedUser,
    dto: CreateAddressDto,
  ): Promise<SavedAddressView> {
    const customerId = new Types.ObjectId(user.id);
    const existingCount = await this.addressModel
      .countDocuments({ customerId, isActive: true })
      .exec();

    if (existingCount >= 20) {
      throw new BadRequestException('Maximum of 20 saved addresses reached.');
    }

    const shouldBeDefault = dto.isDefault === true || existingCount === 0;
    if (shouldBeDefault) {
      await this.addressModel
        .updateMany({ customerId, isActive: true }, { $set: { isDefault: false } })
        .exec();
    }

    const doc = await this.addressModel.create({
      customerId,
      label: dto.label?.trim(),
      governorate: dto.governorate.trim(),
      cityOrDistrict: dto.cityOrDistrict.trim(),
      street: dto.street.trim(),
      building: dto.building.trim(),
      floorOrApartment: dto.floorOrApartment?.trim(),
      landmark: dto.landmark?.trim(),
      contactPhone: dto.contactPhone.trim(),
      isDefault: shouldBeDefault,
      isActive: true,
    });

    return this.toAddressView(doc);
  }

  async updateMyAddress(
    user: AuthenticatedUser,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<SavedAddressView> {
    if (!Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid address id.');
    }

    const customerId = new Types.ObjectId(user.id);
    const doc = await this.addressModel
      .findOne({
        _id: new Types.ObjectId(addressId),
        customerId,
        isActive: true,
      })
      .exec();

    if (!doc) {
      throw new NotFoundException('Saved address not found.');
    }

    if (dto.isDefault === true) {
      await this.addressModel
        .updateMany(
          { customerId, isActive: true, _id: { $ne: doc._id } },
          { $set: { isDefault: false } },
        )
        .exec();
      doc.isDefault = true;
    } else if (dto.isDefault === false) {
      doc.isDefault = false;
    }

    if (dto.label !== undefined) doc.label = dto.label.trim();
    if (dto.governorate !== undefined) doc.governorate = dto.governorate.trim();
    if (dto.cityOrDistrict !== undefined) doc.cityOrDistrict = dto.cityOrDistrict.trim();
    if (dto.street !== undefined) doc.street = dto.street.trim();
    if (dto.building !== undefined) doc.building = dto.building.trim();
    if (dto.floorOrApartment !== undefined) doc.floorOrApartment = dto.floorOrApartment.trim();
    if (dto.landmark !== undefined) doc.landmark = dto.landmark.trim();
    if (dto.contactPhone !== undefined) doc.contactPhone = dto.contactPhone.trim();

    await doc.save();
    return this.toAddressView(doc);
  }

  async deleteMyAddress(
    user: AuthenticatedUser,
    addressId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    if (!Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid address id.');
    }

    const customerId = new Types.ObjectId(user.id);
    const doc = await this.addressModel
      .findOne({
        _id: new Types.ObjectId(addressId),
        customerId,
        isActive: true,
      })
      .exec();

    if (!doc) {
      throw new NotFoundException('Saved address not found.');
    }

    doc.isActive = false;
    doc.isDefault = false;
    await doc.save();

    return { deleted: true, id: addressId };
  }

  // ===========================================================================
  // BOOKING CREATION, SNAPSHOTS, SLOT RESERVATION & LIFECYCLE ENGINE
  // ===========================================================================

  async createBooking(
    user: AuthenticatedUser,
    dto: CreateBookingDto,
  ): Promise<BookingDetailView> {
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only CUSTOMER accounts can create bookings.');
    }

    const customerObjectId = new Types.ObjectId(user.id);

    // 1. Idempotency check via clientRequestId
    if (dto.clientRequestId) {
      const existing = await this.bookingModel
        .findOne({
          customerId: customerObjectId,
          clientRequestId: dto.clientRequestId.trim(),
        })
        .exec();

      if (existing) {
        return this.getBookingById(user, existing._id.toString());
      }
    }

    // 2. Validate requestedStartUtc is in the future and aligned to a 30-min UTC boundary
    const startUtc = new Date(dto.requestedStartUtc);
    if (Number.isNaN(startUtc.getTime())) {
      throw new BadRequestException('Invalid requestedStartUtc ISO 8601 timestamp.');
    }
    if (!isAlignedToSlotBoundary(startUtc)) {
      throw new BadRequestException(
        'requestedStartUtc must be aligned to a 30-minute UTC boundary (:00 or :30, 0s, 0ms).',
      );
    }
    if (startUtc.getTime() <= Date.now()) {
      throw new BadRequestException('requestedStartUtc must be in the future.');
    }

    // 3. Validate provider profile is APPROVED and owned by an ACTIVE user
    const providerProfile = await this.providerProfileModel
      .findOne({
        _id: new Types.ObjectId(dto.providerProfileId),
        approvalStatus: ProviderApprovalStatus.APPROVED,
      })
      .exec();

    if (!providerProfile) {
      throw new BadRequestException(
        'Selected provider is not approved or not available for bookings.',
      );
    }

    if (providerProfile.userId.toString() === user.id) {
      throw new BadRequestException('You cannot create a booking with your own provider profile.');
    }

    const providerUser = await this.userModel
      .findOne({
        _id: providerProfile.userId,
        status: AccountStatus.ACTIVE,
      })
      .exec();

    if (!providerUser) {
      throw new BadRequestException('Selected provider account is not active.');
    }

    // 4. Validate active catalog service & category + enabled provider service offering
    const service = await this.serviceModel
      .findOne({
        _id: new Types.ObjectId(dto.serviceId),
        isActive: true,
      })
      .exec();

    if (!service) {
      throw new BadRequestException('Selected service does not exist or is archived.');
    }

    const category = await this.categoryModel
      .findOne({
        _id: service.categoryId,
        isActive: true,
      })
      .exec();

    if (!category) {
      throw new BadRequestException('Selected service category is archived.');
    }

    const offering = await this.offeringModel
      .findOne({
        providerProfileId: providerProfile._id,
        serviceId: service._id,
        isEnabled: true,
      })
      .exec();

    if (!offering) {
      throw new BadRequestException(
        'Selected provider does not offer this service or the offering is disabled.',
      );
    }

    // 5. Resolve address snapshot (from saved addressId or inline address)
    const addressSnapshot = await this.resolveAddressSnapshot(customerObjectId, dto);

    // 6. Validate provider covers the address governorate
    const coversGov = providerProfile.coverageGovernorates.some(
      (g) => g.toLowerCase() === addressSnapshot.governorate.toLowerCase(),
    );
    if (!coversGov) {
      throw new BadRequestException(
        `Provider does not cover governorate '${addressSnapshot.governorate}'.`,
      );
    }

    // 7. Compute end time from offering's estimatedDurationMinutes & verify slot decomposition
    const durationMinutes = offering.estimatedDurationMinutes;
    const endUtc = new Date(startUtc.getTime() + durationMinutes * 60 * 1000);
    // Validate window can be decomposed into valid 30-min slots
    decomposeWindowIntoSlots(startUtc, endUtc);

    // 8. Check if any slot in [startUtc, endUtc) is already locked by an ACCEPTED/IN_PROGRESS booking
    const proposedSlots = decomposeWindowIntoSlots(startUtc, endUtc);
    const conflictingSlot = await this.providerSlotModel
      .findOne({
        providerProfileId: providerProfile._id,
        slotStartUtc: { $in: proposedSlots.map((s) => s.slotStartUtc) },
      })
      .exec();

    if (conflictingSlot) {
      throw new ConflictException(
        'Provider already has a confirmed booking overlapping the requested time window.',
      );
    }

    // 9. Persist Booking in REQUESTED state with immutable snapshots (integer fils)
    let booking: BookingDocument;
    try {
      booking = await this.bookingModel.create({
        customerId: customerObjectId,
        providerProfileId: providerProfile._id,
        serviceId: service._id,
        serviceSnapshot: {
          slug: service.slug,
          titleAr: service.title.ar,
          titleEn: service.title.en,
          categorySlug: category.slug,
        },
        addressSnapshot,
        pricingSnapshot: {
          pricingType: offering.pricingType,
          quotedAmountFils: offering.priceAmountFils,
          currency: CurrencyCode.JOD,
        },
        requestedStartUtc: startUtc,
        requestedEndUtc: endUtc,
        status: BookingStatus.REQUESTED,
        customerNotes: dto.customerNotes?.trim(),
        clientRequestId: dto.clientRequestId?.trim(),
      });
    } catch (err: unknown) {
      if (
        dto.clientRequestId &&
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: number }).code === 11000
      ) {
        const existing = await this.bookingModel
          .findOne({
            customerId: customerObjectId,
            clientRequestId: dto.clientRequestId.trim(),
          })
          .exec();
        if (existing) {
          return this.getBookingById(user, existing._id.toString());
        }
      }
      throw err;
    }

    await this.bookingEventModel.create({
      bookingId: booking._id,
      actorUserId: customerObjectId,
      actorRole: BookingActorRole.CUSTOMER,
      eventKind: BookingEventKind.CREATED,
      toStatus: BookingStatus.REQUESTED,
      reason: dto.customerNotes?.trim(),
      occurredAt: new Date(),
    });

    if (this.notificationsService) {
      await this.notificationsService.createNotification({
        recipientUserId: providerProfile.userId,
        type: NotificationType.BOOKING_REQUESTED,
        title: {
          ar: 'طلب حجز موعد جديد',
          en: 'New appointment booking request',
        },
        body: {
          ar: `لديك طلب حجز جديد لخدمة ${service.title.ar} في ${addressSnapshot.governorate}.`,
          en: `New booking request for ${service.title.en} in ${addressSnapshot.governorate}.`,
        },
        relatedResourceType: NotificationResourceType.BOOKING,
        relatedResourceId: booking._id,
      });
    }

    return this.getBookingById(user, booking._id.toString());
  }

  async listBookings(
    user: AuthenticatedUser,
    query: QueryBookingsDto,
  ): Promise<{
    items: BookingView[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    await this.expireStaleRequestedBookings();

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<BookingDocument> = {};
    if (query.status) {
      filter.status = query.status;
    }

    if (user.role === UserRole.CUSTOMER) {
      filter.customerId = new Types.ObjectId(user.id);
    } else if (user.role === UserRole.PROVIDER) {
      const profile = await this.providerProfileModel
        .findOne({ userId: new Types.ObjectId(user.id) })
        .select('_id')
        .exec();
      if (!profile) {
        return { items: [], page, limit, total: 0, totalPages: 0 };
      }
      filter.providerProfileId = profile._id;
    }

    const [docs, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    const views = await this.hydrateBookingViews(docs);

    return {
      items: views,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async getBookingById(
    user: AuthenticatedUser,
    bookingId: string,
  ): Promise<BookingDetailView> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking id.');
    }

    await this.expireStaleRequestedBookings();

    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    await this.assertCanAccessBooking(user, booking);

    const [hydrated] = await this.hydrateBookingViews([booking]);
    const [events, slots] = await Promise.all([
      this.bookingEventModel
        .find({ bookingId: booking._id })
        .sort({ occurredAt: 1, _id: 1 })
        .exec(),
      this.providerSlotModel
        .find({ bookingId: booking._id })
        .sort({ slotStartUtc: 1 })
        .exec(),
    ]);

    return {
      ...hydrated,
      events: events.map((e) => ({
        id: e._id.toString(),
        bookingId: e.bookingId.toString(),
        actorUserId: e.actorUserId?.toString(),
        actorRole: e.actorRole,
        eventKind: e.eventKind,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        reason: e.reason,
        occurredAt: e.occurredAt.toISOString(),
      })),
      reservedSlots: slots.map((s) => ({
        slotStartUtc: s.slotStartUtc.toISOString(),
        slotEndUtc: s.slotEndUtc.toISOString(),
      })),
    };
  }

  /**
   * Provider accepts a REQUESTED booking:
   * - Validates ownership & transition rule (REQUESTED -> ACCEPTED)
   * - Decomposes [requestedStartUtc, requestedEndUtc) into 30-min UTC slots
   * - Atomically locks all 30-min slots in `provider_slots` (enforced by unique compound index { providerProfileId: 1, slotStartUtc: 1 })
   * - Compensates/rolls back inserted slots on any duplicate key (11000) or concurrent state change and throws 409 ConflictException
   */
  async acceptBooking(
    user: AuthenticatedUser,
    bookingId: string,
    dto: AcceptBookingDto,
  ): Promise<BookingDetailView> {
    const { booking, providerProfile } = await this.loadBookingForProviderAction(
      user,
      bookingId,
    );

    if (
      !canTransitionBookingStatus(
        booking.status,
        BookingStatus.ACCEPTED,
        BookingActorRole.PROVIDER,
      )
    ) {
      throw new ConflictException(
        `Cannot accept booking in status '${booking.status}'.`,
      );
    }

    if (booking.requestedStartUtc.getTime() <= Date.now()) {
      await this.expireStaleRequestedBookings();
      throw new BadRequestException(
        'Booking requested start time has already passed and can no longer be accepted.',
      );
    }

    const slots = decomposeWindowIntoSlots(
      booking.requestedStartUtc,
      booking.requestedEndUtc,
    );

    const slotDocs = slots.map((s) => ({
      providerProfileId: providerProfile._id,
      bookingId: booking._id,
      slotStartUtc: s.slotStartUtc,
      slotEndUtc: s.slotEndUtc,
    }));

    try {
      await this.providerSlotModel.insertMany(slotDocs, { ordered: true });
    } catch (err: unknown) {
      // Clean up any partial slots inserted for this bookingId before failing
      await this.providerSlotModel.deleteMany({ bookingId: booking._id }).exec();
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: number }).code === 11000
      ) {
        throw new ConflictException(
          'One or more 30-minute time slots in this booking window are already reserved.',
        );
      }
      throw err;
    }

    const now = new Date();
    const updated = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          status: BookingStatus.REQUESTED,
        },
        {
          $set: {
            status: BookingStatus.ACCEPTED,
            acceptedAt: now,
            confirmedStartUtc: booking.requestedStartUtc,
            confirmedEndUtc: booking.requestedEndUtc,
            ...(dto.providerNotes !== undefined
              ? { providerNotes: dto.providerNotes.trim() }
              : {}),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      await this.providerSlotModel.deleteMany({ bookingId: booking._id }).exec();
      throw new ConflictException('Booking status changed concurrently.');
    }

    await this.bookingEventModel.create({
      bookingId: booking._id,
      actorUserId: new Types.ObjectId(user.id),
      actorRole: BookingActorRole.PROVIDER,
      eventKind: BookingEventKind.STATUS_CHANGED,
      fromStatus: BookingStatus.REQUESTED,
      toStatus: BookingStatus.ACCEPTED,
      reason: dto.providerNotes?.trim(),
      occurredAt: now,
    });

    if (this.notificationsService) {
      await this.notificationsService.createNotification({
        recipientUserId: booking.customerId,
        type: NotificationType.BOOKING_ACCEPTED,
        title: {
          ar: 'تم تأكيد حجز موعدك',
          en: 'Your booking has been accepted',
        },
        body: {
          ar: `قبل المزود ${providerProfile.displayName} حجزك لخدمة ${booking.serviceSnapshot.titleAr}.`,
          en: `${providerProfile.displayName} accepted your booking for ${booking.serviceSnapshot.titleEn}.`,
        },
        relatedResourceType: NotificationResourceType.BOOKING,
        relatedResourceId: booking._id,
      });
    }

    return this.getBookingById(user, booking._id.toString());
  }

  async rejectBooking(
    user: AuthenticatedUser,
    bookingId: string,
    dto: RejectBookingDto,
  ): Promise<BookingDetailView> {
    const { booking, providerProfile } = await this.loadBookingForProviderAction(
      user,
      bookingId,
    );

    if (
      !canTransitionBookingStatus(
        booking.status,
        BookingStatus.REJECTED,
        BookingActorRole.PROVIDER,
      )
    ) {
      throw new ConflictException(
        `Cannot reject booking in status '${booking.status}'.`,
      );
    }

    const now = new Date();
    const updated = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          status: BookingStatus.REQUESTED,
        },
        {
          $set: {
            status: BookingStatus.REJECTED,
            rejectedAt: now,
            rejectionReason: dto.reason.trim(),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new ConflictException('Booking status changed concurrently.');
    }

    await this.bookingEventModel.create({
      bookingId: booking._id,
      actorUserId: new Types.ObjectId(user.id),
      actorRole: BookingActorRole.PROVIDER,
      eventKind: BookingEventKind.STATUS_CHANGED,
      fromStatus: BookingStatus.REQUESTED,
      toStatus: BookingStatus.REJECTED,
      reason: dto.reason.trim(),
      occurredAt: now,
    });

    if (this.notificationsService) {
      await this.notificationsService.createNotification({
        recipientUserId: booking.customerId,
        type: NotificationType.BOOKING_REJECTED,
        title: {
          ar: 'اعتذر المزود عن طلب الحجز',
          en: 'Booking request declined',
        },
        body: {
          ar: `اعتذر ${providerProfile.displayName} عن طلب الحجز: ${dto.reason.trim()}`,
          en: `${providerProfile.displayName} declined the booking request: ${dto.reason.trim()}`,
        },
        relatedResourceType: NotificationResourceType.BOOKING,
        relatedResourceId: booking._id,
      });
    }

    return this.getBookingById(user, booking._id.toString());
  }

  async startBooking(
    user: AuthenticatedUser,
    bookingId: string,
    dto: StartBookingDto,
  ): Promise<BookingDetailView> {
    const { booking } = await this.loadBookingForProviderAction(user, bookingId);

    if (
      !canTransitionBookingStatus(
        booking.status,
        BookingStatus.IN_PROGRESS,
        BookingActorRole.PROVIDER,
      )
    ) {
      throw new ConflictException(
        `Cannot start work on booking in status '${booking.status}'.`,
      );
    }

    const now = new Date();
    const updated = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          status: BookingStatus.ACCEPTED,
        },
        {
          $set: {
            status: BookingStatus.IN_PROGRESS,
            startedAt: now,
            ...(dto.providerNotes !== undefined
              ? { providerNotes: dto.providerNotes.trim() }
              : {}),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new ConflictException('Booking status changed concurrently.');
    }

    await this.bookingEventModel.create({
      bookingId: booking._id,
      actorUserId: new Types.ObjectId(user.id),
      actorRole: BookingActorRole.PROVIDER,
      eventKind: BookingEventKind.STATUS_CHANGED,
      fromStatus: BookingStatus.ACCEPTED,
      toStatus: BookingStatus.IN_PROGRESS,
      reason: dto.providerNotes?.trim(),
      occurredAt: now,
    });

    return this.getBookingById(user, booking._id.toString());
  }

  async markWorkDone(
    user: AuthenticatedUser,
    bookingId: string,
    dto: MarkWorkDoneDto,
  ): Promise<BookingDetailView> {
    const { booking, providerProfile } = await this.loadBookingForProviderAction(
      user,
      bookingId,
    );

    if (
      !canTransitionBookingStatus(
        booking.status,
        BookingStatus.WORK_DONE,
        BookingActorRole.PROVIDER,
      )
    ) {
      throw new ConflictException(
        `Cannot mark work done on booking in status '${booking.status}'.`,
      );
    }

    const now = new Date();
    const updateSet: Record<string, unknown> = {
      status: BookingStatus.WORK_DONE,
      workDoneAt: now,
    };
    if (dto.providerNotes !== undefined) {
      updateSet.providerNotes = dto.providerNotes.trim();
    }
    if (dto.agreedAmountFils !== undefined) {
      updateSet['pricingSnapshot.agreedAmountFils'] = dto.agreedAmountFils;
    }

    const updated = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          status: BookingStatus.IN_PROGRESS,
        },
        { $set: updateSet },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new ConflictException('Booking status changed concurrently.');
    }

    await this.bookingEventModel.create({
      bookingId: booking._id,
      actorUserId: new Types.ObjectId(user.id),
      actorRole: BookingActorRole.PROVIDER,
      eventKind: BookingEventKind.STATUS_CHANGED,
      fromStatus: BookingStatus.IN_PROGRESS,
      toStatus: BookingStatus.WORK_DONE,
      reason: dto.providerNotes?.trim(),
      occurredAt: now,
    });

    if (this.notificationsService) {
      await this.notificationsService.createNotification({
        recipientUserId: booking.customerId,
        type: NotificationType.BOOKING_WORK_DONE,
        title: {
          ar: 'أنهى المزود العمل — يرجى التأكيد',
          en: 'Work marked done — please confirm completion',
        },
        body: {
          ar: `أنهى ${providerProfile.displayName} العمل على خدمة ${booking.serviceSnapshot.titleAr}. يرجى مراجعة الطلب وتأكيد الإنجاز.`,
          en: `${providerProfile.displayName} marked work done for ${booking.serviceSnapshot.titleEn}. Please confirm completion in your workspace.`,
        },
        relatedResourceType: NotificationResourceType.BOOKING,
        relatedResourceId: booking._id,
      });
    }

    return this.getBookingById(user, booking._id.toString());
  }

  async completeBooking(
    user: AuthenticatedUser,
    bookingId: string,
    dto: CompleteBookingDto,
  ): Promise<BookingDetailView> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking id.');
    }

    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    let actorRole: BookingActorRole;
    if (user.role === UserRole.ADMIN) {
      actorRole = BookingActorRole.ADMIN;
    } else if (
      user.role === UserRole.CUSTOMER &&
      booking.customerId.toString() === user.id
    ) {
      actorRole = BookingActorRole.CUSTOMER;
    } else {
      throw new ForbiddenException(
        'Only the booking customer or an administrator can confirm completion.',
      );
    }

    if (
      !canTransitionBookingStatus(
        booking.status,
        BookingStatus.COMPLETED,
        actorRole,
      )
    ) {
      throw new ConflictException(
        `Cannot complete booking in status '${booking.status}'.`,
      );
    }

    const now = new Date();
    const updated = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          status: BookingStatus.WORK_DONE,
        },
        {
          $set: {
            status: BookingStatus.COMPLETED,
            completedAt: now,
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new ConflictException('Booking status changed concurrently.');
    }

    await this.bookingEventModel.create({
      bookingId: booking._id,
      actorUserId: new Types.ObjectId(user.id),
      actorRole,
      eventKind:
        actorRole === BookingActorRole.ADMIN
          ? BookingEventKind.ADMIN_INTERVENTION
          : BookingEventKind.STATUS_CHANGED,
      fromStatus: BookingStatus.WORK_DONE,
      toStatus: BookingStatus.COMPLETED,
      reason: dto.reason?.trim(),
      occurredAt: now,
    });

    const providerProfile = await this.providerProfileModel
      .findById(booking.providerProfileId)
      .exec();

    if (this.notificationsService && providerProfile) {
      await this.notificationsService.createNotification({
        recipientUserId: providerProfile.userId,
        type: NotificationType.BOOKING_COMPLETED,
        title: {
          ar: 'أكد العميل اكتمال الخدمة',
          en: 'Customer confirmed job completion',
        },
        body: {
          ar: `تم تأكيد اكتمال خدمة ${booking.serviceSnapshot.titleAr}.`,
          en: `Booking for ${booking.serviceSnapshot.titleEn} has been marked completed.`,
        },
        relatedResourceType: NotificationResourceType.BOOKING,
        relatedResourceId: booking._id,
      });
    }

    return this.getBookingById(user, booking._id.toString());
  }

  async cancelBooking(
    user: AuthenticatedUser,
    bookingId: string,
    dto: CancelBookingDto,
  ): Promise<BookingDetailView> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking id.');
    }

    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    const providerProfile = await this.providerProfileModel
      .findById(booking.providerProfileId)
      .exec();

    let actorRole: BookingActorRole;
    if (user.role === UserRole.ADMIN) {
      actorRole = BookingActorRole.ADMIN;
    } else if (
      user.role === UserRole.CUSTOMER &&
      booking.customerId.toString() === user.id
    ) {
      actorRole = BookingActorRole.CUSTOMER;
    } else if (
      user.role === UserRole.PROVIDER &&
      providerProfile &&
      providerProfile.userId.toString() === user.id
    ) {
      actorRole = BookingActorRole.PROVIDER;
    } else {
      throw new ForbiddenException('You are not authorized to cancel this booking.');
    }

    const transitionRule = findBookingTransitionRule(
      booking.status,
      BookingStatus.CANCELLED,
    );
    if (!transitionRule || !transitionRule.allowedActors.includes(actorRole)) {
      throw new ConflictException(
        `Role '${actorRole}' cannot cancel a booking in status '${booking.status}'.`,
      );
    }

    const previousStatus = booking.status;
    const now = new Date();
    const updated = await this.bookingModel
      .findOneAndUpdate(
        {
          _id: booking._id,
          status: previousStatus,
        },
        {
          $set: {
            status: BookingStatus.CANCELLED,
            cancelledAt: now,
            cancelledByRole: actorRole,
            cancellationReason: dto.reason.trim(),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new ConflictException('Booking status changed concurrently.');
    }

    if (transitionRule.releasesSlots) {
      await this.providerSlotModel.deleteMany({ bookingId: booking._id }).exec();
    }

    await this.bookingEventModel.create({
      bookingId: booking._id,
      actorUserId: new Types.ObjectId(user.id),
      actorRole,
      eventKind:
        actorRole === BookingActorRole.ADMIN
          ? BookingEventKind.ADMIN_INTERVENTION
          : BookingEventKind.STATUS_CHANGED,
      fromStatus: previousStatus,
      toStatus: BookingStatus.CANCELLED,
      reason: dto.reason.trim(),
      occurredAt: now,
    });

    if (this.notificationsService) {
      const notifyUserId =
        actorRole === BookingActorRole.CUSTOMER && providerProfile
          ? providerProfile.userId
          : booking.customerId;

      await this.notificationsService.createNotification({
        recipientUserId: notifyUserId,
        type: NotificationType.BOOKING_CANCELLED,
        title: {
          ar: 'تم إلغاء الحجز',
          en: 'Booking cancelled',
        },
        body: {
          ar: `تم إلغاء حجز خدمة ${booking.serviceSnapshot.titleAr}: ${dto.reason.trim()}`,
          en: `Booking for ${booking.serviceSnapshot.titleEn} was cancelled: ${dto.reason.trim()}`,
        },
        relatedResourceType: NotificationResourceType.BOOKING,
        relatedResourceId: booking._id,
      });
    }

    return this.getBookingById(user, booking._id.toString());
  }

  /**
   * Automatically transitions stale REQUESTED bookings whose requestedStartUtc <= now to EXPIRED.
   */
  async expireStaleRequestedBookings(): Promise<number> {
    const now = new Date();
    const staleBookings = await this.bookingModel
      .find({
        status: BookingStatus.REQUESTED,
        requestedStartUtc: { $lte: now },
      })
      .limit(100)
      .exec();

    let expiredCount = 0;
    for (const b of staleBookings) {
      const updated = await this.bookingModel
        .findOneAndUpdate(
          {
            _id: b._id,
            status: BookingStatus.REQUESTED,
          },
          {
            $set: {
              status: BookingStatus.EXPIRED,
              expiredAt: now,
            },
          },
          { new: true },
        )
        .exec();

      if (updated) {
        expiredCount += 1;
        await this.bookingEventModel.create({
          bookingId: b._id,
          actorRole: BookingActorRole.SYSTEM,
          eventKind: BookingEventKind.STATUS_CHANGED,
          fromStatus: BookingStatus.REQUESTED,
          toStatus: BookingStatus.EXPIRED,
          reason: 'Requested start time elapsed before provider response.',
          occurredAt: now,
        });
      }
    }

    return expiredCount;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private async resolveAddressSnapshot(
    customerId: Types.ObjectId,
    dto: CreateBookingDto,
  ): Promise<BookingAddressSnapshot> {
    if (dto.addressId) {
      const saved = await this.addressModel
        .findOne({
          _id: new Types.ObjectId(dto.addressId),
          customerId,
          isActive: true,
        })
        .exec();

      if (!saved) {
        throw new BadRequestException(
          'Saved addressId does not exist or does not belong to your account.',
        );
      }

      return {
        label: saved.label,
        governorate: saved.governorate,
        cityOrDistrict: saved.cityOrDistrict,
        street: saved.street,
        building: saved.building,
        floorOrApartment: saved.floorOrApartment,
        landmark: saved.landmark,
        contactPhone: saved.contactPhone,
      };
    }

    if (dto.address) {
      return {
        label: dto.address.label?.trim(),
        governorate: dto.address.governorate.trim(),
        cityOrDistrict: dto.address.cityOrDistrict.trim(),
        street: dto.address.street.trim(),
        building: dto.address.building.trim(),
        floorOrApartment: dto.address.floorOrApartment?.trim(),
        landmark: dto.address.landmark?.trim(),
        contactPhone: dto.address.contactPhone.trim(),
      };
    }

    throw new BadRequestException(
      'Either a saved addressId or an inline address object is required.',
    );
  }

  private async loadBookingForProviderAction(
    user: AuthenticatedUser,
    bookingId: string,
  ): Promise<{
    booking: BookingDocument;
    providerProfile: ProviderProfileDocument;
  }> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking id.');
    }

    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    const providerProfile = await this.providerProfileModel
      .findById(booking.providerProfileId)
      .exec();

    if (
      !providerProfile ||
      user.role !== UserRole.PROVIDER ||
      providerProfile.userId.toString() !== user.id
    ) {
      throw new ForbiddenException(
        'Only the assigned provider can perform this action on the booking.',
      );
    }

    return { booking, providerProfile };
  }

  private async assertCanAccessBooking(
    user: AuthenticatedUser,
    booking: BookingDocument,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.CUSTOMER && booking.customerId.toString() === user.id) {
      return;
    }

    if (user.role === UserRole.PROVIDER) {
      const profile = await this.providerProfileModel
        .findById(booking.providerProfileId)
        .select('userId')
        .exec();

      if (profile && profile.userId.toString() === user.id) {
        return;
      }
    }

    throw new ForbiddenException('You do not have permission to view this booking.');
  }

  private async hydrateBookingViews(
    docs: BookingDocument[],
  ): Promise<BookingView[]> {
    if (docs.length === 0) {
      return [];
    }

    const customerIds = [...new Set(docs.map((d) => d.customerId.toString()))].map(
      (id) => new Types.ObjectId(id),
    );
    const providerProfileIds = [
      ...new Set(docs.map((d) => d.providerProfileId.toString())),
    ].map((id) => new Types.ObjectId(id));
    const bookingIds = docs.map((d) => d._id);

    const [customers, profiles, reviews] = await Promise.all([
      this.userModel
        .find({ _id: { $in: customerIds } })
        .select('fullName')
        .exec(),
      this.providerProfileModel
        .find({ _id: { $in: providerProfileIds } })
        .select('displayName')
        .exec(),
      this.reviewModel
        .find({ bookingId: { $in: bookingIds } })
        .select('bookingId')
        .exec(),
    ]);

    const customerMap = new Map(customers.map((u) => [u._id.toString(), u.fullName]));
    const profileMap = new Map(profiles.map((p) => [p._id.toString(), p.displayName]));
    const reviewedBookingIds = new Set(reviews.map((r) => r.bookingId.toString()));

    return docs.map((d) => ({
      id: d._id.toString(),
      customerId: d.customerId.toString(),
      customerName: customerMap.get(d.customerId.toString()),
      providerProfileId: d.providerProfileId.toString(),
      providerDisplayName: profileMap.get(d.providerProfileId.toString()),
      serviceId: d.serviceId.toString(),
      serviceSnapshot: {
        slug: d.serviceSnapshot.slug,
        titleAr: d.serviceSnapshot.titleAr,
        titleEn: d.serviceSnapshot.titleEn,
        categorySlug: d.serviceSnapshot.categorySlug,
      },
      addressSnapshot: {
        label: d.addressSnapshot.label,
        governorate: d.addressSnapshot.governorate,
        cityOrDistrict: d.addressSnapshot.cityOrDistrict,
        street: d.addressSnapshot.street,
        building: d.addressSnapshot.building,
        floorOrApartment: d.addressSnapshot.floorOrApartment,
        landmark: d.addressSnapshot.landmark,
        contactPhone: d.addressSnapshot.contactPhone,
      },
      pricingSnapshot: {
        pricingType: d.pricingSnapshot.pricingType,
        quotedAmountFils: d.pricingSnapshot.quotedAmountFils,
        agreedAmountFils: d.pricingSnapshot.agreedAmountFils,
        currency: d.pricingSnapshot.currency,
      },
      requestedStartUtc: d.requestedStartUtc.toISOString(),
      requestedEndUtc: d.requestedEndUtc.toISOString(),
      confirmedStartUtc: d.confirmedStartUtc?.toISOString(),
      confirmedEndUtc: d.confirmedEndUtc?.toISOString(),
      status: d.status,
      customerNotes: d.customerNotes,
      providerNotes: d.providerNotes,
      rejectionReason: d.rejectionReason,
      cancellationReason: d.cancellationReason,
      cancelledByRole: d.cancelledByRole,
      acceptedAt: d.acceptedAt?.toISOString(),
      startedAt: d.startedAt?.toISOString(),
      workDoneAt: d.workDoneAt?.toISOString(),
      completedAt: d.completedAt?.toISOString(),
      rejectedAt: d.rejectedAt?.toISOString(),
      cancelledAt: d.cancelledAt?.toISOString(),
      expiredAt: d.expiredAt?.toISOString(),
      createdAt: d.createdAt?.toISOString(),
      updatedAt: d.updatedAt?.toISOString(),
      hasReview: reviewedBookingIds.has(d._id.toString()),
    }));
  }

  private toAddressView(doc: AddressDocument): SavedAddressView {
    return {
      id: doc._id.toString(),
      customerId: doc.customerId.toString(),
      label: doc.label,
      governorate: doc.governorate,
      cityOrDistrict: doc.cityOrDistrict,
      street: doc.street,
      building: doc.building,
      floorOrApartment: doc.floorOrApartment,
      landmark: doc.landmark,
      contactPhone: doc.contactPhone,
      isDefault: doc.isDefault,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }
}
