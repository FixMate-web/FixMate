import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder, Types } from 'mongoose';
import { CurrencyCode, PricingType } from '../../common/domain';
import { Category, CategoryDocument, Service, ServiceDocument } from '../../database/schemas';
import {
  CreateCategoryDto,
  CreateServiceDto,
  QueryServicesDto,
  UpdateCategoryDto,
  UpdateServiceDto,
} from './dto/catalog.dto';

export interface PublicCategoryView {
  id: string;
  slug: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  iconName?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface PublicServiceView {
  id: string;
  categoryId: string;
  category?: {
    id: string;
    slug: string;
    name: { ar: string; en: string };
    iconName?: string;
  };
  slug: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  pricingPolicy: {
    pricingType: PricingType;
    indicativeAmountFils: number;
    currency: CurrencyCode;
  } | null;
  defaultDurationMinutes: number;
  isActive: boolean;
}

export function escapeRegexLiteral(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async listActiveCategories(): Promise<PublicCategoryView[]> {
    const docs = await this.categoryModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, _id: 1 })
      .exec();
    return docs.map((d) => this.toCategoryView(d));
  }

  async getActiveCategoryBySlug(
    slug: string,
  ): Promise<PublicCategoryView & { services: PublicServiceView[] }> {
    const normalizedSlug = slug.trim().toLowerCase();
    const category = await this.categoryModel
      .findOne({ slug: normalizedSlug, isActive: true })
      .exec();

    if (!category) {
      throw new NotFoundException('Active category not found.');
    }

    const categoryView = this.toCategoryView(category);
    const activePrimaryCategories = await this.categoryModel.find({isActive:true}).select('_id').exec();
    const services = await this.serviceModel
      .find({
        isActive: true,
        categoryId: {$in: activePrimaryCategories.map(c=>c._id)},
        $or: [{ categoryId: category._id }, { discoveryCategorySlugs: category.slug }],
      })
      .sort({ _id: 1 })
      .exec();

    return {
      ...categoryView,
      services: services.map((s) => this.toServiceView(s, category)),
    };
  }

  async listActiveServices(query: QueryServicesDto): Promise<{
    items: PublicServiceView[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 12));

    const activeCategories = await this.categoryModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, _id: 1 })
      .exec();

    const categoryMap = new Map<string, CategoryDocument>();
    for (const cat of activeCategories) {
      categoryMap.set(cat._id.toString(), cat);
    }

    const filter: FilterQuery<ServiceDocument> = {
      isActive: true,
      categoryId: { $in: activeCategories.map((c) => c._id) },
    };

    if (query.categorySlug) {
      const matchedCategory = activeCategories.find((c) => c.slug === query.categorySlug);
      if (!matchedCategory) {
        return { items: [], page, limit, total: 0, totalPages: 0 };
      }
      filter.$and = [
        {
          $or: [
            { categoryId: matchedCategory._id },
            { discoveryCategorySlugs: matchedCategory.slug },
          ],
        },
      ];
    } else if (query.categoryId) {
      if (!categoryMap.has(query.categoryId)) {
        return { items: [], page, limit, total: 0, totalPages: 0 };
      }
      const category = categoryMap.get(query.categoryId)!;
      filter.$and = [
        { $or: [{ categoryId: category._id }, { discoveryCategorySlugs: category.slug }] },
      ];
    }

    if (query.pricingType) {
      filter['pricingPolicy.pricingType'] = query.pricingType;
    }

    if (query.q && query.q.trim().length > 0) {
      const safePattern = new RegExp(escapeRegexLiteral(query.q.trim()), 'i');
      filter.$or = [
        { 'title.ar': safePattern },
        { 'title.en': safePattern },
        { 'description.ar': safePattern },
        { 'description.en': safePattern },
        { slug: safePattern },
      ];
    }

    const sortSpec = this.resolveServiceSort(query.sort);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.serviceModel.find(filter).sort(sortSpec).skip(skip).limit(limit).exec(),
      this.serviceModel.countDocuments(filter).exec(),
    ]);

    const items = docs.map((doc) =>
      this.toServiceView(doc, categoryMap.get(doc.categoryId.toString())),
    );

    return {
      items,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async getActiveServiceBySlug(slug: string): Promise<PublicServiceView> {
    const normalizedSlug = slug.trim().toLowerCase();
    const service = await this.serviceModel
      .findOne({ slug: normalizedSlug, isActive: true })
      .exec();

    if (!service) {
      throw new NotFoundException('Active service not found.');
    }

    const category = await this.categoryModel
      .findOne({ _id: service.categoryId, isActive: true })
      .exec();

    if (!category) {
      throw new NotFoundException('Active service not found.');
    }

    return this.toServiceView(service, category);
  }

  async listCategoriesAdmin(): Promise<PublicCategoryView[]> {
    const docs = await this.categoryModel.find().sort({ displayOrder: 1, _id: 1 }).exec();
    return docs.map((d) => this.toCategoryView(d));
  }

  async createCategory(dto: CreateCategoryDto): Promise<PublicCategoryView> {
    try {
      const created = await this.categoryModel.create({
        slug: dto.slug.trim().toLowerCase(),
        name: dto.name,
        description: dto.description,
        iconName: dto.iconName,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      });
      return this.toCategoryView(created);
    } catch (err: unknown) {
      if (this.isMongoDuplicateKeyError(err)) {
        throw new ConflictException(`Category slug '${dto.slug}' already exists.`);
      }
      throw err;
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<PublicCategoryView> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category id.');
    }

    const update: Record<string, unknown> = {};
    if (dto.slug !== undefined) update.slug = dto.slug.trim().toLowerCase();
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.iconName !== undefined) update.iconName = dto.iconName;
    if (dto.displayOrder !== undefined) update.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) update.isActive = dto.isActive;

    try {
      const updated = await this.categoryModel
        .findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
        .exec();

      if (!updated) {
        throw new NotFoundException('Category not found.');
      }

      return this.toCategoryView(updated);
    } catch (err: unknown) {
      if (this.isMongoDuplicateKeyError(err)) {
        throw new ConflictException(`Category slug '${dto.slug}' already exists.`);
      }
      throw err;
    }
  }

  async listServicesAdmin(): Promise<PublicServiceView[]> {
    const [categories, services] = await Promise.all([
      this.categoryModel.find().exec(),
      this.serviceModel.find().sort({ _id: 1 }).exec(),
    ]);

    const categoryMap = new Map<string, CategoryDocument>();
    for (const c of categories) {
      categoryMap.set(c._id.toString(), c);
    }

    return services.map((s) => this.toServiceView(s, categoryMap.get(s.categoryId.toString())));
  }

  async createService(dto: CreateServiceDto): Promise<PublicServiceView> {
    const category = await this.categoryModel.findById(dto.categoryId).exec();
    if (!category) {
      throw new BadRequestException('Referenced categoryId does not exist.');
    }

    try {
      const created = await this.serviceModel.create({
        categoryId: category._id,
        slug: dto.slug.trim().toLowerCase(),
        title: dto.title,
        description: dto.description,
        pricingPolicy: dto.pricingPolicy
          ? {
              pricingType: dto.pricingPolicy.pricingType,
              indicativeAmountFils: dto.pricingPolicy.indicativeAmountFils,
              currency: CurrencyCode.JOD,
            }
          : null,
        defaultDurationMinutes: dto.defaultDurationMinutes,
        isActive: dto.isActive ?? true,
      });

      return this.toServiceView(created, category);
    } catch (err: unknown) {
      if (this.isMongoDuplicateKeyError(err)) {
        throw new ConflictException(`Service slug '${dto.slug}' already exists.`);
      }
      throw err;
    }
  }

  async updateService(id: string, dto: UpdateServiceDto): Promise<PublicServiceView> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid service id.');
    }

    let category: CategoryDocument | null = null;
    const update: Record<string, unknown> = {};

    if (dto.categoryId !== undefined) {
      category = await this.categoryModel.findById(dto.categoryId).exec();
      if (!category) {
        throw new BadRequestException('Referenced categoryId does not exist.');
      }
      update.categoryId = category._id;
    }

    if (dto.slug !== undefined) update.slug = dto.slug.trim().toLowerCase();
    if (dto.title !== undefined) update.title = dto.title;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.pricingPolicy !== undefined) {
      update.pricingPolicy = dto.pricingPolicy
        ? {
            pricingType: dto.pricingPolicy.pricingType,
            indicativeAmountFils: dto.pricingPolicy.indicativeAmountFils,
            currency: CurrencyCode.JOD,
          }
        : null;
    }
    if (dto.defaultDurationMinutes !== undefined) {
      update.defaultDurationMinutes = dto.defaultDurationMinutes;
    }
    if (dto.isActive !== undefined) {
      update.isActive = dto.isActive;
    }

    try {
      const updated = await this.serviceModel
        .findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
        .exec();

      if (!updated) {
        throw new NotFoundException('Service not found.');
      }

      if (!category) {
        category = await this.categoryModel.findById(updated.categoryId).exec();
      }

      return this.toServiceView(updated, category ?? undefined);
    } catch (err: unknown) {
      if (this.isMongoDuplicateKeyError(err)) {
        throw new ConflictException(`Service slug '${dto.slug}' already exists.`);
      }
      throw err;
    }
  }

  private resolveServiceSort(sort?: string): Record<string, SortOrder> {
    switch (sort) {
      case 'price_asc':
        return { 'pricingPolicy.indicativeAmountFils': 1, _id: 1 };
      case 'price_desc':
        return { 'pricingPolicy.indicativeAmountFils': -1, _id: 1 };
      case 'title_asc':
        return { 'title.en': 1, _id: 1 };
      case 'displayOrder':
      default:
        return { _id: 1 };
    }
  }

  private toCategoryView(doc: CategoryDocument): PublicCategoryView {
    return {
      id: doc._id.toString(),
      slug: doc.slug,
      name: { ar: doc.name.ar, en: doc.name.en },
      description: { ar: doc.description.ar, en: doc.description.en },
      iconName: doc.iconName,
      displayOrder: doc.displayOrder,
      isActive: doc.isActive,
    };
  }

  private toServiceView(doc: ServiceDocument, category?: CategoryDocument): PublicServiceView {
    return {
      id: doc._id.toString(),
      categoryId: doc.categoryId.toString(),
      category: category
        ? {
            id: category._id.toString(),
            slug: category.slug,
            name: { ar: category.name.ar, en: category.name.en },
            iconName: category.iconName,
          }
        : undefined,
      slug: doc.slug,
      title: { ar: doc.title.ar, en: doc.title.en },
      description: { ar: doc.description.ar, en: doc.description.en },
      pricingPolicy: doc.pricingPolicy
        ? {
            pricingType: doc.pricingPolicy.pricingType,
            indicativeAmountFils: doc.pricingPolicy.indicativeAmountFils,
            currency: doc.pricingPolicy.currency,
          }
        : null,
      defaultDurationMinutes: doc.defaultDurationMinutes,
      isActive: doc.isActive,
    };
  }

  private isMongoDuplicateKeyError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: number }).code === 11000
    );
  }
}
