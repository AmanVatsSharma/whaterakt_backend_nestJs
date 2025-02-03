import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_CONFIG } from './core/swagger/config';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { validateConfig } from './core/config/config.schema';

async function bootstrap() {
  // Validate configuration first
  await validateConfig(process.env);

  const app = await NestFactory.create(AppModule);
  
  // Add Swagger documentation
  const document = SwaggerModule.createDocument(app, SWAGGER_CONFIG);
  SwaggerModule.setup('api', app, document);

  // Add global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
