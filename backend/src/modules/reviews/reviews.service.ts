import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/auth';
import {
  BookingStatus,
  NotificationResourceType,
  NotificationType,
  ProviderApprovalStatus,
  ReviewModerationStatus,
  UserRole,
} from '../../common/domain';
import {
  Booking,
  BookingDocument,
  ProviderProfile,
  ProviderProfileDocument,
  Review,
  ReviewDocument,
  User,
  UserDocument,
} from '../../database/schemas';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateReviewDto,
  ModerateReviewVisibilityDto,
  QueryReviewsDto,
} from './reviews.dto';

export interface PublicReviewView {
  id: string;
  bookingId: string;
  providerProfileId: string;
  customerName: string;
  serviceTitle?: { ar: string; en: string };
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface AdminReviewView extends PublicReviewView {
  customerId: string;
  providerDisplayName?: string;
  moderationStatus: ReviewModerationStatus;
  moderatedByUserId?: string;
  moderationReason?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(ProviderProfile.name)
    private readonly providerProfileModel: Model<ProviderProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  async submitBookingReview(
    user: AuthenticatedUser,
    bookingId: string,
    dto: CreateReviewDto,
  ): Promise<PublicReviewView> {
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only CUSTOMER accounts can submit booking reviews.');
    }

    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking id.');
    }

    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    if (booking.customerId.toString() !== user.id) {
      throw new ForbiddenException('You can only review your own completed bookings.');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        `Reviews can only be submitted for COMPLETED bookings (current status: '${booking.status}').`,
      );
    }

    const existing = await this.reviewModel
      .findOne({ bookingId: booking._id })
      .exec();
    if (existing) {
      throw new ConflictException(
        'A review has already been submitted for this completed booking.',
      );
    }

    let review: ReviewDocument;
    try {
      review = await this.reviewModel.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        providerProfileId: booking.providerProfileId,
        rating: dto.rating,
        comment: dto.comment?.trim(),
        moderationStatus: ReviewModerationStatus.VISIBLE,
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: number }).code === 11000
      ) {
        throw new ConflictException(
          'A review has already been submitted for this completed booking.',
        );
      }
      throw err;
    }

    await this.recalculateProviderRatingSummary(booking.providerProfileId);

    const [customer, providerProfile] = await Promise.all([
      this.userModel.findById(booking.customerId).select('fullName').exec(),
      this.providerProfileModel
        .findById(booking.providerProfileId)
        .select('userId displayName')
        .exec(),
    ]);

    if (this.notificationsService && providerProfile) {
      await this.notificationsService.createNotification({
        recipientUserId: providerProfile.userId,
        type: NotificationType.REVIEW_RECEIVED,
        title: {
          ar: 'تقييم جديد على ملفك المهني',
          en: 'New customer review received',
        },
        body: {
          ar: `أضاف عميل تقييماً (${dto.rating}/5) لخدمة ${booking.serviceSnapshot.titleAr}.`,
          en: `A customer left a ${dto.rating}/5 review for ${booking.serviceSnapshot.titleEn}.`,
        },
        relatedResourceType: NotificationResourceType.REVIEW,
        relatedResourceId: review._id,
      });
    }

    return {
      id: review._id.toString(),
      bookingId: booking._id.toString(),
      providerProfileId: booking.providerProfileId.toString(),
      customerName: customer?.fullName ?? 'Customer',
      serviceTitle: {
        ar: booking.serviceSnapshot.titleAr,
        en: booking.serviceSnapshot.titleEn,
      },
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt?.toISOString(),
    };
  }

  async listPublicProviderReviews(
    providerProfileId: string,
    query: QueryReviewsDto,
  ): Promise<{
    items: PublicReviewView[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(providerProfileId)) {
      throw new NotFoundException('Approved provider profile not found.');
    }

    const profile = await this.providerProfileModel
      .findOne({
        _id: new Types.ObjectId(providerProfileId),
        approvalStatus: ProviderApprovalStatus.APPROVED,
      })
      .select('_id')
      .exec();

    if (!profile) {
      throw new NotFoundException('Approved provider profile not found.');
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ReviewDocument> = {
      providerProfileId: profile._id,
      moderationStatus: ReviewModerationStatus.VISIBLE,
    };

    const [docs, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    const items = await this.hydratePublicReviews(docs);

    return {
      items,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async listMyReviews(user: AuthenticatedUser): Promise<PublicReviewView[]> {
    const docs = await this.reviewModel
      .find({ customerId: new Types.ObjectId(user.id) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .exec();

    return this.hydratePublicReviews(docs);
  }

  async listReviewsForAdmin(query: QueryReviewsDto): Promise<{
    items: AdminReviewView[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ReviewDocument> = {};
    if (query.moderationStatus) {
      filter.moderationStatus = query.moderationStatus;
    }

    const [docs, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    const publicViews = await this.hydratePublicReviews(docs);
    const profileIds = [
      ...new Set(docs.map((d) => d.providerProfileId.toString())),
    ].map((id) => new Types.ObjectId(id));
    const profiles = await this.providerProfileModel
      .find({ _id: { $in: profileIds } })
      .select('displayName')
      .exec();
    const profileMap = new Map(
      profiles.map((p) => [p._id.toString(), p.displayName]),
    );

    const items: AdminReviewView[] = docs.map((d, idx) => ({
      ...publicViews[idx],
      customerId: d.customerId.toString(),
      providerDisplayName: profileMap.get(d.providerProfileId.toString()),
      moderationStatus: d.moderationStatus,
      moderatedByUserId: d.moderatedByUserId?.toString(),
      moderationReason: d.moderationReason,
    }));

    return {
      items,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async moderateReviewVisibility(
    adminUser: AuthenticatedUser,
    reviewId: string,
    dto: ModerateReviewVisibilityDto,
  ): Promise<AdminReviewView> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new BadRequestException('Invalid review id.');
    }

    if (
      dto.moderationStatus === ReviewModerationStatus.HIDDEN &&
      (!dto.reason || dto.reason.trim().length < 3)
    ) {
      throw new BadRequestException(
        'A moderation reason (at least 3 characters) is required when hiding a review.',
      );
    }

    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    review.moderationStatus = dto.moderationStatus;
    review.moderatedByUserId = new Types.ObjectId(adminUser.id);
    review.moderationReason = dto.reason?.trim();
    await review.save();

    await this.recalculateProviderRatingSummary(review.providerProfileId);

    const [hydrated] = await this.hydratePublicReviews([review]);
    const profile = await this.providerProfileModel
      .findById(review.providerProfileId)
      .select('displayName')
      .exec();

    return {
      ...hydrated,
      customerId: review.customerId.toString(),
      providerDisplayName: profile?.displayName,
      moderationStatus: review.moderationStatus,
      moderatedByUserId: review.moderatedByUserId?.toString(),
      moderationReason: review.moderationReason,
    };
  }

  async recalculateProviderRatingSummary(
    providerProfileId: Types.ObjectId,
  ): Promise<void> {
    const stats = await this.reviewModel
      .aggregate<{ _id: Types.ObjectId; avgRating: number; count: number }>([
        {
          $match: {
            providerProfileId,
            moderationStatus: ReviewModerationStatus.VISIBLE,
          },
        },
        {
          $group: {
            _id: '$providerProfileId',
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const summary = stats[0];
    const reviewCount = summary ? summary.count : 0;
    const averageRating =
      summary && summary.count > 0
        ? Math.round(summary.avgRating * 10) / 10
        : 0;

    await this.providerProfileModel
      .updateOne(
        { _id: providerProfileId },
        {
          $set: {
            averageRating,
            reviewCount,
          },
        },
      )
      .exec();
  }

  private async hydratePublicReviews(
    docs: ReviewDocument[],
  ): Promise<PublicReviewView[]> {
    if (docs.length === 0) {
      return [];
    }

    const customerIds = [...new Set(docs.map((d) => d.customerId.toString()))].map(
      (id) => new Types.ObjectId(id),
    );
    const bookingIds = [...new Set(docs.map((d) => d.bookingId.toString()))].map(
      (id) => new Types.ObjectId(id),
    );

    const [customers, bookings] = await Promise.all([
      this.userModel
        .find({ _id: { $in: customerIds } })
        .select('fullName')
        .exec(),
      this.bookingModel
        .find({ _id: { $in: bookingIds } })
        .select('serviceSnapshot')
        .exec(),
    ]);

    const customerMap = new Map(
      customers.map((u) => [u._id.toString(), u.fullName]),
    );
    const bookingServiceMap = new Map(
      bookings.map((b) => [
        b._id.toString(),
        {
          ar: b.serviceSnapshot.titleAr,
          en: b.serviceSnapshot.titleEn,
        },
      ]),
    );

    return docs.map((d) => ({
      id: d._id.toString(),
      bookingId: d.bookingId.toString(),
      providerProfileId: d.providerProfileId.toString(),
      customerName: customerMap.get(d.customerId.toString()) ?? 'Customer',
      serviceTitle: bookingServiceMap.get(d.bookingId.toString()),
      rating: d.rating,
      comment: d.comment,
      createdAt: d.createdAt?.toISOString(),
    }));
  }
}
