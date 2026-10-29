import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PricingType, ProviderApprovalStatus } from '../../../common/domain';
import { IsMultipleOfThirtyConstraint, LocalizedTextDto } from '../../catalog/dto/catalog.dto';

@ValidatorConstraint({ name: 'isValidAvailabilityWindow', async: false })
export class IsValidAvailabilityWindowConstraint implements ValidatorConstraintInterface {
  validate(win: unknown): boolean {
    if (!win || typeof win !== 'object') return false;
    const w = win as { startMinuteOfDay?: unknown; endMinuteOfDay?: unknown };
    return (
      typeof w.startMinuteOfDay === 'number' &&
      typeof w.endMinuteOfDay === 'number' &&
      Number.isInteger(w.startMinuteOfDay) &&
      Number.isInteger(w.endMinuteOfDay) &&
      w.startMinuteOfDay % 30 === 0 &&
      w.endMinuteOfDay % 30 === 0 &&
      w.startMinuteOfDay < w.endMinuteOfDay
    );
  }

  defaultMessage(): string {
    return 'Each availability window must have startMinuteOfDay < endMinuteOfDay in 30-minute increments';
  }
}

export class AvailabilityWindowDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1410)
  @Validate(IsMultipleOfThirtyConstraint)
  startMinuteOfDay!: number;

  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(1440)
  @Validate(IsMultipleOfThirtyConstraint)
  endMinuteOfDay!: number;
}

export class UpdateProviderProfileDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  bio?: LocalizedTextDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  coverageGovernorates?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  coverageAreas?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => AvailabilityWindowDto)
  @Validate(IsValidAvailabilityWindowConstraint, { each: true })
  weeklyAvailability?: AvailabilityWindowDto[];
}

export class ApplyProviderDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  bio!: LocalizedTextDto;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  coverageGovernorates!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  coverageAreas!: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => AvailabilityWindowDto)
  @Validate(IsValidAvailabilityWindowConstraint, { each: true })
  weeklyAvailability?: AvailabilityWindowDto[];
}

export class UpsertProviderServiceDto {
  @IsMongoId()
  serviceId!: string;

  @IsEnum(PricingType)
  pricingType!: PricingType;

  @Type(() => Number)
  @IsInt({ message: 'priceAmountFils must be an integer amount in fils' })
  @Min(0)
  priceAmountFils!: number;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(480)
  @Validate(IsMultipleOfThirtyConstraint)
  estimatedDurationMinutes!: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export const ADMIN_DECISION_STATUSES = [
  ProviderApprovalStatus.APPROVED,
  ProviderApprovalStatus.REJECTED,
  ProviderApprovalStatus.SUSPENDED,
] as const;

export class AdminProviderApprovalDto {
  @IsEnum(ADMIN_DECISION_STATUSES, {
    message: 'status must be one of: APPROVED, REJECTED, SUSPENDED',
  })
  status!: ProviderApprovalStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(1000)
  verificationNotes?: string;
}

export class QueryAdminProvidersDto {
  @IsOptional()
  @IsEnum(ProviderApprovalStatus)
  status?: ProviderApprovalStatus;

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
  limit?: number = 20;
}

export const ALLOWED_PROVIDER_SORTS = ['newest', 'name_asc', 'experience_desc'] as const;
export type ProviderSortOption = (typeof ALLOWED_PROVIDER_SORTS)[number];

export class QueryPublicProvidersDto {
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
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MaxLength(80)
  serviceSlug?: string;

  @IsOptional()
  @IsMongoId()
  serviceId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MaxLength(64)
  categorySlug?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(80)
  governorate?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(80)
  area?: string;

  @IsOptional()
  @IsEnum(ALLOWED_PROVIDER_SORTS, {
    message: 'sort must be one of: newest, name_asc, experience_desc',
  })
  sort?: ProviderSortOption = 'newest';
}
