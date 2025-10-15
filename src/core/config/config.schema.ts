import { IsString, IsNotEmpty, IsUrl, IsNumber, IsOptional, IsEnum, IsArray } from 'class-validator';
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

  // Optional but recommended in production for webhook verification
  @IsString()
  @IsOptional()
  WHATSAPP_VERIFY_TOKEN: string;

  @IsString()
  @IsOptional()
  WHATSAPP_APP_SECRET: string;

  // Graph API routing
  @IsString()
  @IsOptional()
  WHATSAPP_GRAPH_BASE: string = 'https://graph.facebook.com';

  @IsString()
  @IsOptional()
  WHATSAPP_GRAPH_VERSION: string = 'v20.0';

  // Fallback phone_number_id if tenant mapping is absent
  @IsString()
  @IsOptional()
  WHATSAPP_DEFAULT_PHONE_NUMBER_ID: string;

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

  @IsString()
  @IsOptional()
  WHATSAPP_TENANT_PHONE_MAP: string; // JSON map of phone_number_id -> tenantId

  // Rate limiting (GraphQL guards)
  @IsNumber()
  @IsOptional()
  RATE_LIMIT_WINDOW_SECONDS: number = 60;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_MAX_REQUESTS: number = 100;

  // Queue limiter for messages queue
  @IsNumber()
  @IsOptional()
  MESSAGES_QUEUE_LIMIT_MAX: number = 1200;

  @IsNumber()
  @IsOptional()
  MESSAGES_QUEUE_LIMIT_DURATION: number = 60000;

  // CORS origins (comma-separated)
  @IsString()
  @IsOptional()
  CORS_ORIGINS: string;
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