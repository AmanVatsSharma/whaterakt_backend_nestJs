/**
 * File: src/modules/integrations/dtos/validate-webhook.dto.ts
 * Module: integrations
 * Purpose: DTO for webhook validation requests.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - DTO is intentionally minimal for BFF compatibility.
 * - Extend this with class-validator constraints as needed.
 */

export class ValidateWebhookDto {
  url!: string;
}

