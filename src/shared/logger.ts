/**
 * File: src/shared/logger.ts
 * Module: shared
 * Purpose: Central Pino logger instance with env-aware transport.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Pretty logs in development, JSON logs in production.
 * - Use child loggers for context-scoped tracing.
 */

import pino, { Logger as PinoLogger, LoggerOptions } from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const appPinoLogger: PinoLogger = isProduction
  ? pino(loggerOptions)
  : pino(
      loggerOptions,
      pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    );

