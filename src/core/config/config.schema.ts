import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsUrl, validate } from 'class-validator';

export class EnvironmentVariables {
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsUrl()
  WHATSAPP_API_URL: string;

  @IsNotEmpty()
  WHATSAPP_ACCESS_TOKEN: string;
}

export async function validateConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config);
  const errors = await validate(validatedConfig);

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors}`);
  }
  return validatedConfig;
} 