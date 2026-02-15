/**
 * File: src/common/errors/index.ts
 * Module: common-errors
 * Purpose: Barrel export for centralized error classes.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Import from this file to avoid deep relative paths.
 * - Keep all AppError derivatives discoverable.
 */

export * from './app.error';
export * from './domain.errors';

