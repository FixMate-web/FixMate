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

  return validatedConfig;
}
