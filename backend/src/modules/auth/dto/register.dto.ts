import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SupportedLanguage, UserRole } from '../../../common/domain';

export const PUBLIC_REGISTRATION_ROLES = [
  UserRole.CUSTOMER,
  UserRole.PROVIDER,
] as const;
export type PublicRegistrationRole = (typeof PUBLIC_REGISTRATION_ROLES)[number];

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must not exceed 72 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsIn(PUBLIC_REGISTRATION_ROLES, {
    message: 'Public registration role must be either CUSTOMER or PROVIDER',
  })
  role?: PublicRegistrationRole;

  @IsOptional()
  @IsEnum(SupportedLanguage)
  preferredLanguage?: SupportedLanguage;
}
