/**
 * File: src/common/errors/app.error.ts
 * Module: common-errors
 * Purpose: Base error type with status code + machine-readable code.
 * Author: Aman Sharma / Novologic/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Extend this class for all domain-specific errors.
 * - Exception filter maps these to consistent HTTP payloads.
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

