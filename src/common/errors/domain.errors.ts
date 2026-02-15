/**
 * File: src/common/errors/domain.errors.ts
 * Module: common-errors
 * Purpose: Domain-specific AppError subclasses used across services.
 * Author: Aman Sharma / Novologic/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Includes requested trading-domain error placeholders for compatibility.
 * - Add new errors here to keep centralized mapping.
 */

import { AppError } from './app.error';

export class OrderValidationError extends AppError {
  constructor(message = 'Order validation failed', details?: Record<string, unknown>) {
    super('ORDER_VALIDATION_ERROR', message, 400, details);
  }
}

export class InsufficientMarginError extends AppError {
  constructor(message = 'Insufficient margin', details?: Record<string, unknown>) {
    super('INSUFFICIENT_MARGIN', message, 400, details);
  }
}

export class ExchangeDownError extends AppError {
  constructor(message = 'Exchange is temporarily unavailable', details?: Record<string, unknown>) {
    super('EXCHANGE_DOWN', message, 503, details);
  }
}

export class DuplicateOrderError extends AppError {
  constructor(message = 'Duplicate order detected', details?: Record<string, unknown>) {
    super('DUPLICATE_ORDER', message, 409, details);
  }
}

export class TeamInviteExpiredError extends AppError {
  constructor(message = 'Team invite expired', details?: Record<string, unknown>) {
    super('TEAM_INVITE_EXPIRED', message, 410, details);
  }
}

