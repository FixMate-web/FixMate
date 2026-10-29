import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BookingStatus } from '../../common/domain';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  governorate!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  cityOrDistrict!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  building!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  floorOrApartment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @IsString()
  @MinLength(7)
  @MaxLength(30)
  contactPhone!: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  governorate?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  cityOrDistrict?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  street?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  building?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  floorOrApartment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isDefault?: boolean;
}

export class BookingInlineAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  governorate!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  cityOrDistrict!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  building!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  floorOrApartment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @IsString()
  @MinLength(7)
  @MaxLength(30)
  contactPhone!: string;
}

export class CreateBookingDto {
  @IsMongoId()
  providerProfileId!: string;

  @IsMongoId()
  serviceId!: string;

  @IsISO8601()
  requestedStartUtc!: string;

  @IsOptional()
  @IsMongoId()
  addressId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingInlineAddressDto)
  address?: BookingInlineAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNotes?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(80)
  clientRequestId?: string;
}

export class QueryBookingsDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

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

export class AcceptBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  providerNotes?: string;
}

export class RejectBookingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class StartBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  providerNotes?: string;
}

export class MarkWorkDoneDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000000)
  agreedAmountFils?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  providerNotes?: string;
}

export class CompleteBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CancelBookingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
