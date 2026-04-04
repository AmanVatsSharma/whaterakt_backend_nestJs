# Module: ai

**Short:** AI assistance for reply suggestions, generation, and summarization.

**Purpose:** Provide LLM-backed helper outputs through GraphQL and REST adapters.

**Files:**
- ai.module.ts
- ai.resolver.ts
- ai.controller.ts
- ai.service.ts

**Flow diagram:** `flowcharts/ai-flow.svg`

**Dependencies:** HttpService, ConfigService.

**APIs:**
- GraphQL query: `aiQuickReplies`
- REST: `/ai/reply`, `/ai/generate`, `/ai/summarize`

**Env vars:** `AI_PROVIDER`, provider credentials and model vars.

**Tests:** resolver/service unit tests.

**Change-log:**
- 2026-04-04: `POST /ai/reply` accepts optional `conversationId` and passes context into reply generation.
- 2026-02-15: Added REST AI endpoints for frontend BFF integration.
- 2026-02-15: Removed obsolete ORM dependency from AI service surface.

