import { IsString, IsNotEmpty, IsUrl, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsUrl({ require_tld: false })
  @IsOptional()
  WHATSAPP_API_URL: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  WHATSAPP_ACCESS_TOKEN: string = 'development';

  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'development-secret';

  @IsUrl()
  @IsOptional()
  DEEPSEEK_API_URL: string;

  @IsString()
  @IsOptional()
  DEEPSEEK_API_KEY: string;
}

export function validateConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    console.warn('Config validation warnings:', errors);
    // Only throw if required fields are missing
    const criticalErrors = errors.filter(error => 
      !error.property.includes('WHATSAPP') && // Skip WhatsApp related errors in development
      !error.constraints?.isOptional
    );
    if (criticalErrors.length > 0) {
      throw new Error(`Config validation error: ${criticalErrors}`);
    }
  }

  return validatedConfig;
} 