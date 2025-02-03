import { DocumentBuilder } from '@nestjs/swagger';

export const SWAGGER_CONFIG = new DocumentBuilder()
  .setTitle('WhatsApp Marketing API')
  .setDescription('Multi-tenant WhatsApp marketing platform')
  .setVersion('1.0')
  .addBearerAuth()
  .addApiKey({
    type: 'apiKey',
    name: 'X-Tenant-ID',
    in: 'header'
  }, 'TenantAuth')
  .build(); 