import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { AuthenticatedUser } from '../../common/auth';
import { UserRole } from '../../common/domain';
import { ProviderProfile, ProviderProfileDocument } from '../../database/schemas';
import { ProvidersService } from '../providers/providers.service';
import {
  CreateProjectRequestDto,
  QueryProjectRequestsDto,
  RespondToProjectRequestDto,
} from './project-requests.dto';
import { ProjectRequest, ProjectRequestDocument } from './project-request.schema';
@Injectable()
export class ProjectRequestsService {
  constructor(
    @InjectModel(ProjectRequest.name) private readonly requests: Model<ProjectRequestDocument>,
    @InjectModel(ProviderProfile.name) private readonly profiles: Model<ProviderProfileDocument>,
    private readonly providers: ProvidersService,
  ) {}
  private scope(user: AuthenticatedUser): FilterQuery<ProjectRequest> {
    if (user.role === UserRole.ADMIN) return {};
    return user.role === UserRole.PROVIDER
      ? { providerUserId: new Types.ObjectId(user.id) }
      : { customerId: new Types.ObjectId(user.id) };
  }
  private view(doc: ProjectRequestDocument) {
    return {
      id: doc.id as string,
      providerProfileId: doc.providerProfileId.toString(),
      serviceId: doc.serviceId.toString(),
      customerName: doc.customerName,
      providerName: doc.providerName,
      serviceTitle: doc.serviceTitle,
      governorate: doc.governorate,
      area: doc.area,
      description: doc.description,
      status: doc.status,
      providerResponse: doc.providerResponse,
      respondedAt: doc.respondedAt?.toISOString(),
      createdAt: doc.createdAt?.toISOString(),
    };
  }
  async create(user: AuthenticatedUser, dto: CreateProjectRequestDto) {
    const existing = await this.requests.findOne({
      customerId: user.id,
      clientRequestId: dto.clientRequestId,
    });
    if (existing) return this.view(existing);
    const provider = await this.providers.getPublicProviderById(dto.providerProfileId);
    const offering = provider.offerings.find((o) => o.serviceId === dto.serviceId);
    if (!offering)
      throw new BadRequestException('This provider does not offer the selected service.');
    if (!provider.coverageGovernorates.includes(dto.governorate))
      throw new BadRequestException('Choose a governorate covered by this provider.');
    const profile = await this.profiles.findById(dto.providerProfileId).select('userId').lean();
    if (!profile) throw new NotFoundException('Provider not found.');
    try {
      const doc = await this.requests.create({
        customerId: user.id,
        providerUserId: profile.userId,
        providerProfileId: dto.providerProfileId,
        serviceId: dto.serviceId,
        clientRequestId: dto.clientRequestId,
        customerName: user.fullName,
        providerName: provider.displayName,
        serviceTitle: offering.serviceTitle,
        governorate: dto.governorate,
        area: dto.area,
        description: dto.description,
        status: 'OPEN',
      });
      return this.view(doc);
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        const duplicate = await this.requests.findOne({
          customerId: user.id,
          clientRequestId: dto.clientRequestId,
        });
        if (duplicate) return this.view(duplicate);
      }
      throw error;
    }
  }
  async list(user: AuthenticatedUser, query: QueryProjectRequestsDto) {
    const scope = this.scope(user);
    const [items, total] = await Promise.all([
      this.requests
        .find(scope)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      this.requests.countDocuments(scope),
    ]);
    return {
      items: items.map((d) => this.view(d)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
  async detail(user: AuthenticatedUser, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Request not found.');
    const doc = await this.requests.findOne({ ...this.scope(user), _id: id });
    if (!doc) throw new NotFoundException('Request not found.');
    return this.view(doc);
  }
  async respond(user: AuthenticatedUser, id: string, dto: RespondToProjectRequestDto) {
    await this.detail(user, id);
    const doc = await this.requests.findOneAndUpdate(
      { _id: id, providerUserId: user.id, status: 'OPEN' },
      { $set: { status: dto.status, providerResponse: dto.response, respondedAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!doc) throw new ConflictException('Only open requests can receive a response.');
    return this.view(doc);
  }
  async cancel(user: AuthenticatedUser, id: string) {
    await this.detail(user, id);
    const doc = await this.requests.findOneAndUpdate(
      { _id: id, customerId: user.id, status: { $in: ['OPEN', 'RESPONDED'] } },
      { $set: { status: 'CANCELLED' } },
      { new: true, runValidators: true },
    );
    if (!doc) throw new ConflictException('This request can no longer be cancelled.');
    return this.view(doc);
  }
}
