import { plainToInstance, Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export const ALLOWED_NODE_ENVS = ['development', 'test', 'production'] as const;
export type NodeEnv = (typeof ALLOWED_NODE_ENVS)[number];

export class EnvironmentVariables {
  @IsIn(ALLOWED_NODE_ENVS)
  NODE_ENV: NodeEnv = 'development';

  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : 3000))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty({ message: 'MONGODB_URI is required and cannot be empty' })
  MONGODB_URI!: string;

  @IsString()
  @IsNotEmpty({ message: 'CORS_ORIGINS is required (comma-separated list of allowed origins)' })
  CORS_ORIGINS: string = 'http://localhost:4200';

  @IsString()
  @IsNotEmpty({ message: 'JWT_ACCESS_SECRET is required and cannot be empty' })
  @MinLength(16, { message: 'JWT_ACCESS_SECRET must be at least 16 characters long' })
  JWT_ACCESS_SECRET!: string;

  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : 900))
  @IsInt()
  @Min(60)
  @Max(86400)
  JWT_ACCESS_TTL_SECONDS: number = 900;

  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : 7))
  @IsInt()
  @Min(1)
  @Max(90)
  REFRESH_SESSION_TTL_DAYS: number = 7;
}

/**
 * Validates environment configuration at startup.
 * Fails fast with descriptive field-level errors without echoing secret values.
 */
export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'Invalid value';
        return `- ${err.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(`Configuration validation failed:\n${formattedErrors}`);
  }

  if (
    !validatedConfig.MONGODB_URI.startsWith('mongodb://') &&
    !validatedConfig.MONGODB_URI.startsWith('mongodb+srv://')
  ) {
    throw new Error(
      'Configuration validation failed:\n- MONGODB_URI: must start with mongodb:// or mongodb+srv://',
    );
  }

  const origins = validatedConfig.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  const production = validatedConfig.NODE_ENV === 'production';
  if (production && !Object.prototype.hasOwnProperty.call(config, 'CORS_ORIGINS')) {
    throw new Error('Configuration validation failed: CORS_ORIGINS must be explicitly set in production');
  }
  for (const origin of origins) {
    let url: URL;
    try { url = new URL(origin); } catch {
      throw new Error('Configuration validation failed: CORS_ORIGINS must contain exact HTTP(S) origins');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin ||
        url.username || url.password || url.hostname.includes('*') ||
        (production && (url.protocol !== 'https:' ||
          ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
      throw new Error('Configuration validation failed: CORS_ORIGINS must contain exact HTTPS public origins in production (no wildcards, paths or credentials)');
    }
  }
  validatedConfig.CORS_ORIGINS = origins.join(',');
  if (production && (validatedConfig.JWT_ACCESS_SECRET.length < 32 ||
      /replace|example|dev-only|test-only/i.test(validatedConfig.JWT_ACCESS_SECRET))) {
    throw new Error('Configuration validation failed: JWT_ACCESS_SECRET must be a unique random secret of at least 32 characters in production');
  }

  return validatedConfig;
}
