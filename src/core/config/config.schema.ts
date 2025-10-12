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

  @IsUrl({ require_tld: false })
  @IsOptional()
  DEEPSEEK_API_URL: string;

  @IsString()
  @IsOptional()
  DEEPSEEK_API_KEY: string;

  @IsOptional()
  @IsEnum(['deepseek', 'openai', 'anthropic', 'gemini'] as any)
  AI_PROVIDER: 'deepseek' | 'openai' | 'anthropic' | 'gemini' = 'deepseek';

  @IsString()
  @IsOptional()
  OPENAI_API_KEY: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  OPENAI_API_URL: string;

  @IsString()
  @IsOptional()
  OPENAI_MODEL: string;

  @IsString()
  @IsOptional()
  ANTHROPIC_API_KEY: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  ANTHROPIC_API_URL: string;

  @IsString()
  @IsOptional()
  ANTHROPIC_MODEL: string;

  @IsString()
  @IsOptional()
  GEMINI_API_KEY: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  GEMINI_API_URL: string;

  @IsString()
  @IsOptional()
  GEMINI_MODEL: string;
}

export function validateConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: process.env.NODE_ENV !== 'production',
  });

  if (errors.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Config validation error: ${JSON.stringify(errors)}`);
    } else {
      console.warn('Config validation warnings (non-fatal in dev):', errors);
    }
  }

  return validatedConfig;
} 