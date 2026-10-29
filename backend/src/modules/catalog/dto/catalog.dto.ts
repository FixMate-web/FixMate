import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  ValidateIf,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PricingType } from '../../../common/domain';

@ValidatorConstraint({ name: 'isMultipleOfThirty', async: false })
export class IsMultipleOfThirtyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value % 30 === 0;
  }

  defaultMessage(): string {
    return 'defaultDurationMinutes must be an integer multiple of 30 minutes (between 60 and 480)';
  }
}

export class LocalizedTextDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  ar!: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  en!: string;
}

export class CreateCategoryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase kebab-case (a-z, 0-9, hyphens)',
  })
  slug!: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description!: LocalizedTextDto;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(64)
  iconName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase kebab-case (a-z, 0-9, hyphens)',
  })
  slug?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name?: LocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(64)
  iconName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ServicePricingPolicyDto {
  @IsEnum(PricingType)
  pricingType!: PricingType;

  @Type(() => Number)
  @IsInt({ message: 'indicativeAmountFils must be an integer amount in fils' })
  @Min(0)
  indicativeAmountFils!: number;
}

export class CreateServiceDto {
  @IsMongoId()
  categoryId!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase kebab-case (a-z, 0-9, hyphens)',
  })
  slug!: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description!: LocalizedTextDto;

  @ValidateIf((o: CreateServiceDto) => o.pricingPolicy !== null)
  @IsDefined()
  @ValidateNested()
  @Type(() => ServicePricingPolicyDto)
  pricingPolicy!: ServicePricingPolicyDto | null;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(480)
  @Validate(IsMultipleOfThirtyConstraint)
  defaultDurationMinutes!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase kebab-case (a-z, 0-9, hyphens)',
  })
  slug?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title?: LocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ServicePricingPolicyDto)
  pricingPolicy?: ServicePricingPolicyDto | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(480)
  @Validate(IsMultipleOfThirtyConstraint)
  defaultDurationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export const ALLOWED_SERVICE_SORTS = [
  'displayOrder',
  'price_asc',
  'price_desc',
  'title_asc',
] as const;
export type ServiceSortOption = (typeof ALLOWED_SERVICE_SORTS)[number];

export class QueryServicesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MaxLength(64)
  categorySlug?: string;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsEnum(ALLOWED_SERVICE_SORTS, {
    message: 'sort must be one of: displayOrder, price_asc, price_desc, title_asc',
  })
  sort?: ServiceSortOption = 'displayOrder';
}
