/**
* File: src/core/filters/all-exceptions.filter.ts
* Module: core
* Purpose: Global HTTP exception response formatter.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Keeps tenant id in error responses for traceability.
* - Avoids ORM-specific request typing.
*/
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from 'src/common/errors';
import { LoggerService } from 'src/shared/logger.service';
import { requestContext } from '../logging/request-context';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new LoggerService();

  constructor() {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { tenant?: { id?: string } }>();
    const requestId = requestContext.getStore()?.requestId;

    const { statusCode, code, message, details } = this.mapException(exception);

    this.logger.error(message, exception.stack, AllExceptionsFilter.name);

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      tenant: request.tenant?.id,
      requestId,
      details,
    });
  }

  private mapException(exception: Error) {
    if (exception instanceof AppError) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse() as
        | string
        | { message?: string | string[]; error?: string };
      const message =
        typeof payload === 'string'
          ? payload
          : Array.isArray(payload?.message)
            ? payload.message.join(', ')
            : payload?.message || exception.message;
      return {
        statusCode: exception.getStatus(),
        code: 'HTTP_EXCEPTION',
        message,
        details: typeof payload === 'object' ? payload : undefined,
      };
    }

    return {
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: exception.message || 'Internal server error',
      details: undefined,
    };
  }
}