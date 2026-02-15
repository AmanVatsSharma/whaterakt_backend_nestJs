/**
 * File: src/shared/logger.service.ts
 * Module: shared
 * Purpose: Injectable LoggerService wrapper around Pino with requestId support.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Implements Nest LoggerService contract for app.useLogger.
 * - Reads requestId from AsyncLocalStorage request context.
 */

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { requestContext } from 'src/core/logging/request-context';
import { appPinoLogger } from './logger';

type LogContext = Record<string, unknown> | undefined;

@Injectable()
export class LoggerService implements NestLoggerService {
  private context = 'App';

  setContext(context: string) {
    this.context = context;
  }

  child(context: string) {
    const child = new LoggerService();
    child.setContext(context);
    return child;
  }

  log(message: any, context?: string) {
    this.write('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.write('error', message, context, { trace });
  }

  warn(message: any, context?: string) {
    this.write('warn', message, context);
  }

  debug?(message: any, context?: string) {
    this.write('debug', message, context);
  }

  verbose?(message: any, context?: string) {
    this.write('trace', message, context);
  }

  info(message: string, metadata?: LogContext) {
    this.write('info', message, undefined, metadata);
  }

  private write(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    message: any,
    overrideContext?: string,
    metadata?: LogContext
  ) {
    const store = requestContext.getStore();
    appPinoLogger[level](
      {
        context: overrideContext || this.context,
        requestId: store?.requestId,
        ...(metadata || {}),
      },
      typeof message === 'string' ? message : JSON.stringify(message)
    );
  }
}

