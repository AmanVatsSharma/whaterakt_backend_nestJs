import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { tenant?: Tenant }>();

    const statusCode = exception['status'] || 500;
    const message = exception.message || 'Internal server error';

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      tenant: request.tenant?.id
    });
  }
} 