import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SupportedLanguage } from '../../../common/domain';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEnum(SupportedLanguage)
  preferredLanguage?: SupportedLanguage;
}
