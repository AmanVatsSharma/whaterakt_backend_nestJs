import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_CONFIG } from './core/swagger/config';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { validateConfig } from './core/config/config.schema';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { requestContext } from './core/logging/request-context';
import { appPinoLogger } from './shared/logger';
import { LoggerService } from './shared/logger.service';

async function bootstrap() {
  const bootstrapLogger = new LoggerService();
  bootstrapLogger.setContext('Bootstrap');
  
  try {
    // Validate configuration first
    const config = await validateConfig(process.env);
    bootstrapLogger.log('Configuration validated successfully');

    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(bootstrapLogger);

    // Capture raw body for webhook signature verification
    app.use('/webhooks/whatsapp', json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf?.toString('utf8');
      }
    }));
    app.use('/shopify/webhook/orders', json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf?.toString('utf8');
      }
    }));
    // Structured logging with request ids
    app.use(pinoHttp({
      logger: appPinoLogger,
      customProps: () => ({ requestId: requestContext.getStore()?.requestId }),
      customSuccessMessage: (_req, res) => `HTTP ${res.statusCode}`,
    } as any));

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
      origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true
    });

    const requestedPort = Number(config.PORT) || 3000;
    try {
      await app.listen(requestedPort);
      bootstrapLogger.log(`Application is running on: http://localhost:${requestedPort}`);
    } catch (listenError) {
      if ((listenError as any).code === 'EADDRINUSE') {
        const fallbackPort = 3000;
        if (requestedPort !== fallbackPort) {
          bootstrapLogger.warn(`Port ${requestedPort} in use. Falling back to ${fallbackPort}`);
          await app.listen(fallbackPort);
          bootstrapLogger.log(`Application is running on: http://localhost:${fallbackPort}`);
        } else {
          bootstrapLogger.warn(`Port ${fallbackPort} in use. Falling back to an ephemeral port`);
          await app.listen(0);
          const address = app.getHttpServer().address();
          const actualPort = typeof address === 'string' ? address : address?.port;
          bootstrapLogger.log(`Application is running on dynamic port: http://localhost:${actualPort}`);
        }
      } else {
        throw listenError;
      }
    }
  } catch (error) {
    bootstrapLogger.error(`Failed to start application: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
