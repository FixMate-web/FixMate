import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/auth';
import {
  AccountStatus,
  CurrencyCode,
  NotificationResourceType,
  NotificationType,
  PricingType,
  ProviderApprovalStatus,
  UserRole,
} from '../../common/domain';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AvailabilityWindow,
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
import { escapeRegexLiteral } from '../catalog/catalog.service';
import {
  AdminProviderApprovalDto,
  ApplyProviderDto,
  QueryAdminProvidersDto,
  QueryPublicProvidersDto,
  UpdateProviderProfileDto,
  UpsertProviderServiceDto,
} from './dto/providers.dto';

export interface ProviderOfferingView {
  id: string;
  serviceId: string;
  service?: {
    id: string;
    slug: string;
    title: { ar: string; en: string };
    categoryId: string;
    isActive: boolean;
  };
  pricingType: PricingType;
  priceAmountFils: number;
  currency: CurrencyCode;
  estimatedDurationMinutes: number;
  isEnabled: boolean;
}

export interface OwnerProviderProfileView {
  id: string;
  userId: string;
  displayName: string;
  bio: { ar: string; en: string };
  yearsOfExperience: number;
  coverageGovernorates: string[];
  coverageAreas: string[];
  weeklyAvailability: AvailabilityWindow[];
  approvalStatus: ProviderApprovalStatus;
  approvalFeedback: {
    submittedAt?: string;
    reviewedAt?: string;
    rejectionOrSuspensionReason?: string;
  };
  averageRating: number;
  reviewCount: number;
  offerings: ProviderOfferingView[];
}

export interface AdminProviderProfileView extends OwnerProviderProfileView {
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: UserRole;
    status: AccountStatus;
  };
  adminMetadata: {
    submittedAt?: string;
    reviewedAt?: string;
    reviewedByUserId?: string;
    rejectionOrSuspensionReason?: string;
    verificationNotes?: string;
  };
}

export interface PublicProviderOfferingView {
  serviceId: string;
  serviceSlug: string;
  serviceTitle: { ar: string; en: string };
  pricingType: PricingType;
  priceAmountFils: number;
  currency: CurrencyCode;
  estimatedDurationMinutes: number;
}

export interface PublicProviderSummaryView {
  id: string;
  displayName: string;
  bio: { ar: string; en: string };
  yearsOfExperience: number;
  coverageGovernorates: string[];
  coverageAreas: string[];
  approvalStatus: ProviderApprovalStatus.APPROVED;
  averageRating: number | null;
  reviewCount: number;
  offerings: PublicProviderOfferingView[];
}

export interface PublicProviderDetailView extends PublicProviderSummaryView {
  weeklyAvailability: AvailabilityWindow[];
}

@Injectable()
export class ProvidersService {
  constructor(
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
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  async getMyProfile(user: AuthenticatedUser): Promise<OwnerProviderProfileView> {
    const profile = await this.getOrInitializeOwnerProfile(user);
    const offerings = await this.loadOfferingsForProfile(profile._id);
    return this.toOwnerView(profile, offerings);
  }

  async updateMyProfile(
    user: AuthenticatedUser,
    dto: UpdateProviderProfileDto,
  ): Promise<OwnerProviderProfileView> {
    const profile = await this.getOrInitializeOwnerProfile(user);

    if (dto.weeklyAvailability) {
      this.assertNonOverlappingAvailability(dto.weeklyAvailability);
    }

    if (dto.displayName !== undefined) profile.displayName = dto.displayName.trim();
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.yearsOfExperience !== undefined) profile.yearsOfExperience = dto.yearsOfExperience;
    if (dto.coverageGovernorates !== undefined) {
      profile.coverageGovernorates = this.cleanStringArray(dto.coverageGovernorates);
    }
    if (dto.coverageAreas !== undefined) {
      profile.coverageAreas = this.cleanStringArray(dto.coverageAreas);
    }
    if (dto.weeklyAvailability !== undefined) {
      profile.weeklyAvailability = dto.weeklyAvailability;
    }

    await profile.save();
    const offerings = await this.loadOfferingsForProfile(profile._id);
    return this.toOwnerView(profile, offerings);
  }

  async applyAsProvider(
    user: AuthenticatedUser,
    dto: ApplyProviderDto,
  ): Promise<OwnerProviderProfileView> {
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Administrators cannot apply as service providers.');
    }

    if (dto.weeklyAvailability) {
      this.assertNonOverlappingAvailability(dto.weeklyAvailability);
    }

    const userDoc = await this.userModel.findById(user.id).exec();
    if (!userDoc || userDoc.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('Active user account required.');
    }

    let profile = await this.providerProfileModel.findOne({ userId: userDoc._id }).exec();
    const governorates = this.cleanStringArray(dto.coverageGovernorates);
    const areas = this.cleanStringArray(dto.coverageAreas);

    if (governorates.length === 0 || areas.length === 0) {
      throw new BadRequestException(
        'At least one coverage governorate and one coverage area are required.',
      );
    }

    if (!profile) {
      profile = await this.providerProfileModel.create({
        userId: userDoc._id,
        displayName: dto.displayName.trim(),
        bio: dto.bio,
        yearsOfExperience: dto.yearsOfExperience,
        coverageGovernorates: governorates,
        coverageAreas: areas,
        weeklyAvailability: dto.weeklyAvailability ?? [
          { dayOfWeek: 0, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 1, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 2, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 3, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 4, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
        ],
        approvalStatus: ProviderApprovalStatus.DRAFT,
        approvalMetadata: {},
      });
    } else {
      profile.displayName = dto.displayName.trim();
      profile.bio = dto.bio;
      profile.yearsOfExperience = dto.yearsOfExperience;
      profile.coverageGovernorates = governorates;
      profile.coverageAreas = areas;
      if (dto.weeklyAvailability) {
        profile.weeklyAvailability = dto.weeklyAvailability;
      }
      await profile.save();
    }

    if (userDoc.role === UserRole.CUSTOMER) {
      userDoc.role = UserRole.PROVIDER;
      await userDoc.save();
    }

    const offerings = await this.loadOfferingsForProfile(profile._id);
    return this.toOwnerView(profile, offerings);
  }

  async submitForReview(user: AuthenticatedUser): Promise<OwnerProviderProfileView> {
    const profile = await this.getOrInitializeOwnerProfile(user);

    if (profile.approvalStatus === ProviderApprovalStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Suspended provider profiles cannot self-resubmit without administrator review.',
      );
    }

    if (profile.approvalStatus === ProviderApprovalStatus.APPROVED) {
      const offerings = await this.loadOfferingsForProfile(profile._id);
      return this.toOwnerView(profile, offerings);
    }

    const offerings = await this.loadOfferingsForProfile(profile._id);
    this.assertProfileCompleteForSubmission(profile, offerings);

    profile.approvalStatus = ProviderApprovalStatus.PENDING_REVIEW;
    profile.approvalMetadata = {
      ...profile.approvalMetadata,
      submittedAt: new Date(),
    };
    await profile.save();

    return this.toOwnerView(profile, offerings);
  }

  async getMyServices(user: AuthenticatedUser): Promise<ProviderOfferingView[]> {
    const profile = await this.getOrInitializeOwnerProfile(user);
    return this.loadOfferingsForProfile(profile._id);
  }

  async upsertMyService(
    user: AuthenticatedUser,
    dto: UpsertProviderServiceDto,
  ): Promise<ProviderOfferingView> {
    const profile = await this.getOrInitializeOwnerProfile(user);

    const service = await this.serviceModel
      .findOne({ _id: new Types.ObjectId(dto.serviceId), isActive: true })
      .exec();
    if (!service) {
      throw new BadRequestException('Referenced catalog service does not exist or is archived.');
    }

    const category = await this.categoryModel
      .findOne({ _id: service.categoryId, isActive: true })
      .exec();
    if (!category) {
      throw new BadRequestException(
        'Cannot attach a service belonging to an archived catalog category.',
      );
    }

    const updated = await this.offeringModel
      .findOneAndUpdate(
        {
          providerProfileId: profile._id,
          serviceId: service._id,
        },
        {
          $set: {
            pricingType: dto.pricingType,
            priceAmountFils: dto.priceAmountFils,
            currency: CurrencyCode.JOD,
            estimatedDurationMinutes: dto.estimatedDurationMinutes,
            isEnabled: dto.isEnabled ?? true,
          },
        },
        { new: true, upsert: true, runValidators: true },
      )
      .exec();

    return {
      id: updated._id.toString(),
      serviceId: service._id.toString(),
      service: {
        id: service._id.toString(),
        slug: service.slug,
        title: { ar: service.title.ar, en: service.title.en },
        categoryId: service.categoryId.toString(),
        isActive: service.isActive,
      },
      pricingType: updated.pricingType,
      priceAmountFils: updated.priceAmountFils,
      currency: updated.currency,
      estimatedDurationMinutes: updated.estimatedDurationMinutes,
      isEnabled: updated.isEnabled,
    };
  }

  async removeMyService(
    user: AuthenticatedUser,
    serviceId: string,
  ): Promise<{ removed: boolean; serviceId: string }> {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException('Invalid serviceId.');
    }

    const profile = await this.getOrInitializeOwnerProfile(user);
    const res = await this.offeringModel
      .deleteOne({
        providerProfileId: profile._id,
        serviceId: new Types.ObjectId(serviceId),
      })
      .exec();

    if (!res.deletedCount) {
      throw new NotFoundException('Service offering not found on your provider profile.');
    }

    return { removed: true, serviceId };
  }

  async listProvidersForAdmin(query: QueryAdminProvidersDto): Promise<{
    items: AdminProviderProfileView[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const filter: FilterQuery<ProviderProfileDocument> = {};
    if (query.status) {
      filter.approvalStatus = query.status;
    }

    const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      this.providerProfileModel
        .find(filter)
        .select('+approvalMetadata.verificationNotes')
        .sort({ updatedAt: -1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.providerProfileModel.countDocuments(filter).exec(),
    ]);

    const userIds = profiles.map((p) => p.userId);
    const users = await this.userModel.find({ _id: { $in: userIds } }).exec();
    const userMap = new Map<string, UserDocument>();
    for (const u of users) {
      userMap.set(u._id.toString(), u);
    }

    const items: AdminProviderProfileView[] = [];
    for (const p of profiles) {
      const offerings = await this.loadOfferingsForProfile(p._id);
      items.push(this.toAdminView(p, offerings, userMap.get(p.userId.toString())));
    }

    return {
      items,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async updateProviderApproval(
    adminUser: AuthenticatedUser,
    providerProfileId: string,
    dto: AdminProviderApprovalDto,
  ): Promise<AdminProviderProfileView> {
    if (!Types.ObjectId.isValid(providerProfileId)) {
      throw new BadRequestException('Invalid provider profile id.');
    }

    if (
      (dto.status === ProviderApprovalStatus.REJECTED ||
        dto.status === ProviderApprovalStatus.SUSPENDED) &&
      (!dto.reason || dto.reason.trim().length < 3)
    ) {
      throw new BadRequestException(
        'A clear reason (at least 3 characters) is required when rejecting or suspending a provider profile.',
      );
    }

    const profile = await this.providerProfileModel
      .findById(providerProfileId)
      .select('+approvalMetadata.verificationNotes')
      .exec();

    if (!profile) {
      throw new NotFoundException('Provider profile not found.');
    }

    const offerings = await this.loadOfferingsForProfile(profile._id);
    if (dto.status === ProviderApprovalStatus.APPROVED) {
      this.assertProfileCompleteForSubmission(profile, offerings);
    }

    profile.approvalStatus = dto.status;
    profile.approvalMetadata = {
      submittedAt: profile.approvalMetadata?.submittedAt,
      reviewedAt: new Date(),
      reviewedByUserId: new Types.ObjectId(adminUser.id),
      rejectionOrSuspensionReason:
        dto.status === ProviderApprovalStatus.APPROVED
          ? undefined
          : dto.reason?.trim() || profile.approvalMetadata?.rejectionOrSuspensionReason,
      verificationNotes:
        dto.verificationNotes !== undefined
          ? dto.verificationNotes.trim()
          : profile.approvalMetadata?.verificationNotes,
    };

    await profile.save();
    if (this.notificationsService) {
      await this.notificationsService.createNotification({
        recipientUserId: profile.userId,
        type: NotificationType.PROVIDER_APPROVAL_UPDATED,
        title: {
          ar: 'تحديث حالة اعتماد ملفك المهني',
          en: 'Your professional profile status was updated',
        },
        body: {
          ar: `حالة ملفك المهني الآن: ${dto.status}`,
          en: `Your provider listing status is now ${dto.status}.`,
        },
        relatedResourceType: NotificationResourceType.PROVIDER_PROFILE,
        relatedResourceId: profile._id,
      });
    }
    const ownerUser = await this.userModel.findById(profile.userId).exec();
    return this.toAdminView(profile, offerings, ownerUser ?? undefined);
  }

  async listPublicProviders(query: QueryPublicProvidersDto): Promise<{
    items: PublicProviderSummaryView[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 12));

    // Step 1: Active catalog services & categories
    const [activeCategories, allActiveServices] = await Promise.all([
      this.categoryModel.find({ isActive: true }).exec(),
      this.serviceModel.find({ isActive: true }).exec(),
    ]);
    const activeCategoryIds = new Set(activeCategories.map((c) => c._id.toString()));
    const validActiveServices = allActiveServices.filter((s) =>
      activeCategoryIds.has(s.categoryId.toString()),
    );
    const serviceMap = new Map<string, ServiceDocument>();
    for (const s of validActiveServices) {
      serviceMap.set(s._id.toString(), s);
    }

    // Step 2: Filter by serviceSlug / serviceId / categorySlug if requested
    let requiredServiceIds: Types.ObjectId[] | null = null;
    if (query.serviceSlug) {
      const matched = validActiveServices.find((s) => s.slug === query.serviceSlug);
      if (!matched) {
        return { items: [], page, limit, total: 0, totalPages: 0 };
      }
      requiredServiceIds = [matched._id];
    } else if (query.serviceId) {
      const matched = serviceMap.get(query.serviceId);
      if (!matched) {
        return { items: [], page, limit, total: 0, totalPages: 0 };
      }
      requiredServiceIds = [matched._id];
    } else if (query.categorySlug) {
      const cat = activeCategories.find((c) => c.slug === query.categorySlug);
      if (!cat) {
        return { items: [], page, limit, total: 0, totalPages: 0 };
      }
      requiredServiceIds = validActiveServices
        .filter((s) => s.categoryId.toString() === cat._id.toString())
        .map((s) => s._id);
      if (requiredServiceIds.length === 0) {
        return { items: [], page, limit, total: 0, totalPages: 0 };
      }
    }

    // Step 3: Only active user accounts are eligible for public discovery
    const activeUsers = await this.userModel
      .find({ status: AccountStatus.ACTIVE })
      .select('_id')
      .exec();
    const activeUserIds = activeUsers.map((u) => u._id);

    const filter: FilterQuery<ProviderProfileDocument> = {
      approvalStatus: ProviderApprovalStatus.APPROVED,
      userId: { $in: activeUserIds },
    };

    if (requiredServiceIds !== null) {
      const matchingOfferings = await this.offeringModel
        .find({
          serviceId: { $in: requiredServiceIds },
          isEnabled: true,
        })
        .select('providerProfileId')
        .exec();

      const eligibleProfileIds = matchingOfferings.map((o) => o.providerProfileId);
      filter._id = { $in: eligibleProfileIds };
    }

    if (query.governorate) {
      const govPattern = new RegExp(`^${escapeRegexLiteral(query.governorate)}$`, 'i');
      filter.coverageGovernorates = govPattern;
    }

    if (query.area) {
      const areaPattern = new RegExp(escapeRegexLiteral(query.area), 'i');
      filter.coverageAreas = areaPattern;
    }

    if (query.q && query.q.trim().length > 0) {
      const qPattern = new RegExp(escapeRegexLiteral(query.q.trim()), 'i');
      filter.$or = [
        { displayName: qPattern },
        { 'bio.ar': qPattern },
        { 'bio.en': qPattern },
        { coverageAreas: qPattern },
        { coverageGovernorates: qPattern },
      ];
    }

    const sortSpec = this.resolveProviderSort(query.sort);
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      this.providerProfileModel.find(filter).sort(sortSpec).skip(skip).limit(limit).exec(),
      this.providerProfileModel.countDocuments(filter).exec(),
    ]);

    const profileIds = profiles.map((p) => p._id);
    const enabledOfferings = await this.offeringModel
      .find({
        providerProfileId: { $in: profileIds },
        isEnabled: true,
      })
      .sort({ _id: 1 })
      .exec();

    const offeringsByProfile = new Map<string, PublicProviderOfferingView[]>();
    for (const off of enabledOfferings) {
      const svc = serviceMap.get(off.serviceId.toString());
      if (!svc) continue;
      const key = off.providerProfileId.toString();
      const list = offeringsByProfile.get(key) ?? [];
      list.push({
        serviceId: svc._id.toString(),
        serviceSlug: svc.slug,
        serviceTitle: { ar: svc.title.ar, en: svc.title.en },
        pricingType: off.pricingType,
        priceAmountFils: off.priceAmountFils,
        currency: off.currency,
        estimatedDurationMinutes: off.estimatedDurationMinutes,
      });
      offeringsByProfile.set(key, list);
    }

    const items = profiles.map((p) =>
      this.toPublicSummaryView(p, offeringsByProfile.get(p._id.toString()) ?? []),
    );

    return {
      items,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async getPublicProviderById(id: string): Promise<PublicProviderDetailView> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Approved provider profile not found.');
    }

    const profile = await this.providerProfileModel
      .findOne({
        _id: new Types.ObjectId(id),
        approvalStatus: ProviderApprovalStatus.APPROVED,
      })
      .exec();

    if (!profile) {
      throw new NotFoundException('Approved provider profile not found.');
    }

    const user = await this.userModel
      .findOne({ _id: profile.userId, status: AccountStatus.ACTIVE })
      .select('_id')
      .exec();

    if (!user) {
      throw new NotFoundException('Approved provider profile not found.');
    }

    const [activeCategories, activeServices, enabledOfferings] = await Promise.all([
      this.categoryModel.find({ isActive: true }).exec(),
      this.serviceModel.find({ isActive: true }).exec(),
      this.offeringModel
        .find({ providerProfileId: profile._id, isEnabled: true })
        .sort({ _id: 1 })
        .exec(),
    ]);

    const activeCatSet = new Set(activeCategories.map((c) => c._id.toString()));
    const serviceMap = new Map<string, ServiceDocument>();
    for (const s of activeServices) {
      if (activeCatSet.has(s.categoryId.toString())) {
        serviceMap.set(s._id.toString(), s);
      }
    }

    const publicOfferings: PublicProviderOfferingView[] = [];
    for (const off of enabledOfferings) {
      const svc = serviceMap.get(off.serviceId.toString());
      if (!svc) continue;
      publicOfferings.push({
        serviceId: svc._id.toString(),
        serviceSlug: svc.slug,
        serviceTitle: { ar: svc.title.ar, en: svc.title.en },
        pricingType: off.pricingType,
        priceAmountFils: off.priceAmountFils,
        currency: off.currency,
        estimatedDurationMinutes: off.estimatedDurationMinutes,
      });
    }

    return {
      ...this.toPublicSummaryView(profile, publicOfferings),
      weeklyAvailability: profile.weeklyAvailability.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startMinuteOfDay: w.startMinuteOfDay,
        endMinuteOfDay: w.endMinuteOfDay,
      })),
    };
  }

  private async getOrInitializeOwnerProfile(
    user: AuthenticatedUser,
  ): Promise<ProviderProfileDocument> {
    if (user.role !== UserRole.PROVIDER) {
      throw new ForbiddenException(
        'Only accounts with the PROVIDER role can manage a provider profile.',
      );
    }

    const userObjectId = new Types.ObjectId(user.id);
    let profile = await this.providerProfileModel.findOne({ userId: userObjectId }).exec();

    if (!profile) {
      const userDoc = await this.userModel.findById(userObjectId).exec();
      profile = await this.providerProfileModel.create({
        userId: userObjectId,
        displayName: userDoc?.fullName ?? 'Provider',
        bio: {
          ar: 'نبذة مهنية قيد الإعداد',
          en: 'Professional bio pending completion',
        },
        yearsOfExperience: 0,
        coverageGovernorates: ['Amman'],
        coverageAreas: [],
        weeklyAvailability: [
          { dayOfWeek: 0, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 1, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 2, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 3, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
          { dayOfWeek: 4, startMinuteOfDay: 540, endMinuteOfDay: 1020 },
        ],
        approvalStatus: ProviderApprovalStatus.DRAFT,
        approvalMetadata: {},
      });
    }

    return profile;
  }

  private async loadOfferingsForProfile(
    providerProfileId: Types.ObjectId,
  ): Promise<ProviderOfferingView[]> {
    const offerings = await this.offeringModel
      .find({ providerProfileId })
      .sort({ _id: 1 })
      .exec();

    if (offerings.length === 0) {
      return [];
    }

    const serviceIds = offerings.map((o) => o.serviceId);
    const services = await this.serviceModel.find({ _id: { $in: serviceIds } }).exec();
    const serviceMap = new Map<string, ServiceDocument>();
    for (const s of services) {
      serviceMap.set(s._id.toString(), s);
    }

    return offerings.map((off) => {
      const svc = serviceMap.get(off.serviceId.toString());
      return {
        id: off._id.toString(),
        serviceId: off.serviceId.toString(),
        service: svc
          ? {
              id: svc._id.toString(),
              slug: svc.slug,
              title: { ar: svc.title.ar, en: svc.title.en },
              categoryId: svc.categoryId.toString(),
              isActive: svc.isActive,
            }
          : undefined,
        pricingType: off.pricingType,
        priceAmountFils: off.priceAmountFils,
        currency: off.currency,
        estimatedDurationMinutes: off.estimatedDurationMinutes,
        isEnabled: off.isEnabled,
      };
    });
  }

  private assertNonOverlappingAvailability(windows: AvailabilityWindow[]): void {
    const byDay = new Map<number, AvailabilityWindow[]>();
    for (const win of windows) {
      if (win.startMinuteOfDay >= win.endMinuteOfDay) {
        throw new BadRequestException(
          'Availability window startMinuteOfDay must be strictly less than endMinuteOfDay.',
        );
      }
      const list = byDay.get(win.dayOfWeek) ?? [];
      list.push(win);
      byDay.set(win.dayOfWeek, list);
    }

    for (const [day, list] of byDay.entries()) {
      const sorted = [...list].sort((a, b) => a.startMinuteOfDay - b.startMinuteOfDay);
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].startMinuteOfDay < sorted[i - 1].endMinuteOfDay) {
          throw new BadRequestException(
            `Overlapping availability windows are not allowed on dayOfWeek ${day}.`,
          );
        }
      }
    }
  }

  private assertProfileCompleteForSubmission(
    profile: ProviderProfileDocument,
    offerings: ProviderOfferingView[],
  ): void {
    if (!profile.displayName || profile.displayName.trim().length < 2) {
      throw new BadRequestException('Display name is required before submitting for review.');
    }
    if (
      !profile.bio?.ar ||
      profile.bio.ar.trim().length < 10 ||
      !profile.bio?.en ||
      profile.bio.en.trim().length < 10
    ) {
      throw new BadRequestException(
        'Both Arabic and English biographies (at least 10 characters each) are required before submission.',
      );
    }
    if (!profile.coverageGovernorates || profile.coverageGovernorates.length === 0) {
      throw new BadRequestException(
        'At least one coverage governorate is required before submission.',
      );
    }
    if (!profile.coverageAreas || profile.coverageAreas.length === 0) {
      throw new BadRequestException('At least one coverage area is required before submission.');
    }
    if (!profile.weeklyAvailability || profile.weeklyAvailability.length === 0) {
      throw new BadRequestException(
        'At least one weekly availability window is required before submission.',
      );
    }

    const activeEnabledOfferings = offerings.filter(
      (o) => o.isEnabled && o.service && o.service.isActive,
    );
    if (activeEnabledOfferings.length === 0) {
      throw new BadRequestException(
        'At least one enabled service offering linked to an active catalog service is required before submission.',
      );
    }
  }

  private resolveProviderSort(sort?: string): Record<string, SortOrder> {
    switch (sort) {
      case 'name_asc':
        return { displayName: 1, _id: 1 };
      case 'experience_desc':
        return { yearsOfExperience: -1, _id: 1 };
      case 'newest':
      default:
        return { createdAt: -1, _id: 1 };
    }
  }

  private cleanStringArray(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of values) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(trimmed);
      }
    }
    return result;
  }

  private toOwnerView(
    doc: ProviderProfileDocument,
    offerings: ProviderOfferingView[],
  ): OwnerProviderProfileView {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      displayName: doc.displayName,
      bio: { ar: doc.bio.ar, en: doc.bio.en },
      yearsOfExperience: doc.yearsOfExperience,
      coverageGovernorates: [...doc.coverageGovernorates],
      coverageAreas: [...doc.coverageAreas],
      weeklyAvailability: doc.weeklyAvailability.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startMinuteOfDay: w.startMinuteOfDay,
        endMinuteOfDay: w.endMinuteOfDay,
      })),
      approvalStatus: doc.approvalStatus,
      approvalFeedback: {
        submittedAt: doc.approvalMetadata?.submittedAt?.toISOString(),
        reviewedAt: doc.approvalMetadata?.reviewedAt?.toISOString(),
        rejectionOrSuspensionReason: doc.approvalMetadata?.rejectionOrSuspensionReason,
      },
      averageRating: doc.averageRating,
      reviewCount: doc.reviewCount,
      offerings,
    };
  }

  private toAdminView(
    doc: ProviderProfileDocument,
    offerings: ProviderOfferingView[],
    user?: UserDocument,
  ): AdminProviderProfileView {
    return {
      ...this.toOwnerView(doc, offerings),
      user: user
        ? {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
          }
        : undefined,
      adminMetadata: {
        submittedAt: doc.approvalMetadata?.submittedAt?.toISOString(),
        reviewedAt: doc.approvalMetadata?.reviewedAt?.toISOString(),
        reviewedByUserId: doc.approvalMetadata?.reviewedByUserId?.toString(),
        rejectionOrSuspensionReason: doc.approvalMetadata?.rejectionOrSuspensionReason,
        verificationNotes: doc.approvalMetadata?.verificationNotes,
      },
    };
  }

  private toPublicSummaryView(
    doc: ProviderProfileDocument,
    offerings: PublicProviderOfferingView[],
  ): PublicProviderSummaryView {
    return {
      id: doc._id.toString(),
      displayName: doc.displayName,
      bio: { ar: doc.bio.ar, en: doc.bio.en },
      yearsOfExperience: doc.yearsOfExperience,
      coverageGovernorates: [...doc.coverageGovernorates],
      coverageAreas: [...doc.coverageAreas],
      approvalStatus: ProviderApprovalStatus.APPROVED,
      averageRating: doc.reviewCount > 0 ? doc.averageRating : null,
      reviewCount: doc.reviewCount,
      offerings,
    };
  }
}
