import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/auth';
import {
  AccountStatus,
  BookingStatus,
  ProviderApprovalStatus,
  ReviewModerationStatus,
  UserRole,
} from '../../common/domain';
import {
  Booking,
  BookingDocument,
  Category,
  CategoryDocument,
  ProviderProfile,
  ProviderProfileDocument,
  RefreshSession,
  RefreshSessionDocument,
  Review,
  ReviewDocument,
  Service,
  ServiceDocument,
  User,
  UserDocument,
} from '../../database/schemas';
import { escapeRegexLiteral } from '../catalog/catalog.service';
import { QueryAdminUsersDto, UpdateAdminUserStatusDto } from './admin.dto';

export interface AdminOverviewMetrics {
  users: {
    total: number;
    customers: number;
    providers: number;
    admins: number;
    active: number;
    suspended: number;
  };
  providers: {
    total: number;
    approved: number;
    pendingReview: number;
    rejected: number;
    suspended: number;
    draft: number;
  };
  bookings: {
    total: number;
    requested: number;
    accepted: number;
    inProgress: number;
    workDone: number;
    completed: number;
    cancelled: number;
    rejected: number;
    expired: number;
  };
  reviews: {
    total: number;
    visible: number;
    hidden: number;
  };
  catalog: {
    activeCategories: number;
    activeServices: number;
  };
}

export interface AdminUserView {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshSession.name)
    private readonly refreshSessionModel: Model<RefreshSessionDocument>,
    @InjectModel(ProviderProfile.name)
    private readonly providerProfileModel: Model<ProviderProfileDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async getOverviewMetrics(): Promise<AdminOverviewMetrics> {
    const [
      totalUsers,
      customers,
      providers,
      admins,
      activeUsers,
      suspendedUsers,
      totalProfiles,
      approvedProfiles,
      pendingProfiles,
      rejectedProfiles,
      suspendedProfiles,
      draftProfiles,
      totalBookings,
      requestedBookings,
      acceptedBookings,
      inProgressBookings,
      workDoneBookings,
      completedBookings,
      cancelledBookings,
      rejectedBookings,
      expiredBookings,
      totalReviews,
      visibleReviews,
      hiddenReviews,
      activeCategories,
      activeServices,
    ] = await Promise.all([
      this.userModel.countDocuments({}).exec(),
      this.userModel.countDocuments({ role: UserRole.CUSTOMER }).exec(),
      this.userModel.countDocuments({ role: UserRole.PROVIDER }).exec(),
      this.userModel.countDocuments({ role: UserRole.ADMIN }).exec(),
      this.userModel.countDocuments({ status: AccountStatus.ACTIVE }).exec(),
      this.userModel.countDocuments({ status: AccountStatus.SUSPENDED }).exec(),
      this.providerProfileModel.countDocuments({}).exec(),
      this.providerProfileModel
        .countDocuments({ approvalStatus: ProviderApprovalStatus.APPROVED })
        .exec(),
      this.providerProfileModel
        .countDocuments({
          approvalStatus: ProviderApprovalStatus.PENDING_REVIEW,
        })
        .exec(),
      this.providerProfileModel
        .countDocuments({ approvalStatus: ProviderApprovalStatus.REJECTED })
        .exec(),
      this.providerProfileModel
        .countDocuments({ approvalStatus: ProviderApprovalStatus.SUSPENDED })
        .exec(),
      this.providerProfileModel
        .countDocuments({ approvalStatus: ProviderApprovalStatus.DRAFT })
        .exec(),
      this.bookingModel.countDocuments({}).exec(),
      this.bookingModel
        .countDocuments({ status: BookingStatus.REQUESTED })
        .exec(),
      this.bookingModel
        .countDocuments({ status: BookingStatus.ACCEPTED })
        .exec(),
      this.bookingModel
        .countDocuments({ status: BookingStatus.IN_PROGRESS })
        .exec(),
      this.bookingModel
        .countDocuments({ status: BookingStatus.WORK_DONE })
        .exec(),
      this.bookingModel
        .countDocuments({ status: BookingStatus.COMPLETED })
        .exec(),
      this.bookingModel
        .countDocuments({ status: BookingStatus.CANCELLED })
        .exec(),
      this.bookingModel
        .countDocuments({ status: BookingStatus.REJECTED })
        .exec(),
      this.bookingModel
        .countDocuments({ status: BookingStatus.EXPIRED })
        .exec(),
      this.reviewModel.countDocuments({}).exec(),
      this.reviewModel
        .countDocuments({ moderationStatus: ReviewModerationStatus.VISIBLE })
        .exec(),
      this.reviewModel
        .countDocuments({ moderationStatus: ReviewModerationStatus.HIDDEN })
        .exec(),
      this.categoryModel.countDocuments({ isActive: true }).exec(),
      this.serviceModel.countDocuments({ isActive: true }).exec(),
    ]);

    return {
      users: {
        total: totalUsers,
        customers,
        providers,
        admins,
        active: activeUsers,
        suspended: suspendedUsers,
      },
      providers: {
        total: totalProfiles,
        approved: approvedProfiles,
        pendingReview: pendingProfiles,
        rejected: rejectedProfiles,
        suspended: suspendedProfiles,
        draft: draftProfiles,
      },
      bookings: {
        total: totalBookings,
        requested: requestedBookings,
        accepted: acceptedBookings,
        inProgress: inProgressBookings,
        workDone: workDoneBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        rejected: rejectedBookings,
        expired: expiredBookings,
      },
      reviews: {
        total: totalReviews,
        visible: visibleReviews,
        hidden: hiddenReviews,
      },
      catalog: {
        activeCategories,
        activeServices,
      },
    };
  }

  async listUsers(query: QueryAdminUsersDto): Promise<{
    items: AdminUserView[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<UserDocument> = {};
    if (query.role) {
      filter.role = query.role;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.q && query.q.trim().length > 0) {
      const pattern = new RegExp(escapeRegexLiteral(query.q.trim()), 'i');
      filter.$or = [{ fullName: pattern }, { email: pattern }, { phone: pattern }];
    }

    const [docs, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      items: docs.map((u) => this.toUserView(u)),
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async updateUserStatus(
    adminUser: AuthenticatedUser,
    userId: string,
    dto: UpdateAdminUserStatusDto,
  ): Promise<AdminUserView> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id.');
    }

    if (adminUser.id === userId && dto.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(
        'Administrators cannot suspend or deactivate their own account.',
      );
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    user.status = dto.status;
    await user.save();

    if (dto.status !== AccountStatus.ACTIVE) {
      await this.refreshSessionModel
        .updateMany(
          { userId: user._id, revokedAt: { $exists: false } },
          {
            $set: {
              revokedAt: new Date(),
              revocationReason: `Account status changed to ${dto.status} by admin`,
            },
          },
        )
        .exec();
    }

    return this.toUserView(user);
  }

  private toUserView(user: UserDocument): AdminUserView {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };
  }
}
