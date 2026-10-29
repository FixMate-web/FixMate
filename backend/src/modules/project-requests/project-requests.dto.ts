import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
export class CreateProjectRequestDto {
  @IsMongoId() providerProfileId!: string;
  @IsMongoId() serviceId!: string;
  @IsUUID() clientRequestId!: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(80) governorate!: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) area!: string;
  @Transform(trim) @IsString() @MinLength(20) @MaxLength(2000) description!: string;
}
export class RespondToProjectRequestDto {
  @IsIn(['RESPONDED', 'DECLINED']) status!: 'RESPONDED' | 'DECLINED';
  @Transform(trim) @IsString() @MinLength(10) @MaxLength(1000) response!: string;
}
export class QueryProjectRequestsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
}
