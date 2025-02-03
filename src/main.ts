import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_CONFIG } from './core/swagger/config';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { validateConfig } from './core/config/config.schema';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    // Validate configuration first
    const config = await validateConfig(process.env);
    logger.log('Configuration validated successfully');

    const app = await NestFactory.create(AppModule);
    
    // Add Swagger documentation
    const document = SwaggerModule.createDocument(app, SWAGGER_CONFIG);
    SwaggerModule.setup('api', app, document);

    // Add global filters
    app.useGlobalFilters(new AllExceptionsFilter());

    app.enableCors({
      origin: process.env.CORS_ORIGINS?.split(',') || [],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true
    });

    const port = config.PORT || 3000;
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
