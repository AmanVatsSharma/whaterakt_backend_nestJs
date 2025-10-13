import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_CONFIG } from './core/swagger/config';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { validateConfig } from './core/config/config.schema';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    // Validate configuration first
    const config = await validateConfig(process.env);
    logger.log('Configuration validated successfully');

    const app = await NestFactory.create(AppModule);

    // Capture raw body for webhook signature verification
    app.use('/webhooks/whatsapp', json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf?.toString('utf8');
      }
    }));
    // Security headers
    app.use(helmet());
    // Validation across GraphQL/REST inputs
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }));
    
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

    const requestedPort = Number(config.PORT) || 3000;
    try {
      await app.listen(requestedPort);
      logger.log(`Application is running on: http://localhost:${requestedPort}`);
    } catch (listenError) {
      if ((listenError as any).code === 'EADDRINUSE') {
        const fallbackPort = 3000;
        if (requestedPort !== fallbackPort) {
          logger.warn(`Port ${requestedPort} in use. Falling back to ${fallbackPort}`);
          await app.listen(fallbackPort);
          logger.log(`Application is running on: http://localhost:${fallbackPort}`);
        } else {
          logger.warn(`Port ${fallbackPort} in use. Falling back to an ephemeral port`);
          await app.listen(0);
          const address = app.getHttpServer().address();
          const actualPort = typeof address === 'string' ? address : address?.port;
          logger.log(`Application is running on dynamic port: http://localhost:${actualPort}`);
        }
      } else {
        throw listenError;
      }
    }
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
