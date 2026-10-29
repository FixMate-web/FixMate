import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ReviewModerationStatus } from '../../common/domain';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class QueryReviewsDto {
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

  @IsOptional()
  @IsEnum(ReviewModerationStatus)
  moderationStatus?: ReviewModerationStatus;
}

export class ModerateReviewVisibilityDto {
  @IsEnum(ReviewModerationStatus)
  moderationStatus!: ReviewModerationStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;
}
