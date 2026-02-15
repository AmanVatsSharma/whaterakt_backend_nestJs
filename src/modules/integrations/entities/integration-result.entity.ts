/**
 * File: src/modules/integrations/entities/integration-result.entity.ts
 * Module: integrations
 * Purpose: Shared response shape for integration operations.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Keeps response payload structure explicit and reusable.
 * - Used by controller/service contract only.
 */

export interface IntegrationResult {
  ok: boolean;
  message: string;
  normalizedUrl?: string;
}

