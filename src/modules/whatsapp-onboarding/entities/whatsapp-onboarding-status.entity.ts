/**
 * File: src/modules/whatsapp-onboarding/entities/whatsapp-onboarding-status.entity.ts
 * Module: whatsapp-onboarding
 * Purpose: Typed response shape for onboarding status and checklist payloads.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Shared by tenant and operator status endpoints.
 * - Keeps UI contracts stable across BFF and backend.
 */
export type OnboardingChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  blocker?: string;
};

export class WhatsAppOnboardingStatusEntity {
  tenantId: string;
  status: string;
  businessLegalName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  expectedDailyVolume?: number | null;
  reviewNotes?: string | null;
  phoneNumberId?: string | null;
  phoneNumberE164?: string | null;
  wabaId?: string | null;
  webhookVerifiedAt?: string | null;
  activatedAt?: string | null;
  suspendedAt?: string | null;
  onboardingSlaTargetAt?: string | null;
  approvedTemplates: number;
  checklist: OnboardingChecklistItem[];
  blockers: string[];
}
