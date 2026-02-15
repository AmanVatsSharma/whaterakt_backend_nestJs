/**
* File: src/automations/automations.service.ts
* Module: automations
* Purpose: Automation evaluation service for inbound events.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Fetches enabled rules from TypeORM and evaluates simple keyword triggers.
* - Keep logic lightweight; heavy orchestration should move to queue workers.
*/
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AutomationOrmEntity } from '../database/entities';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async handleInboundKeyword(tenantId: string, from: string, text: string) {
    const automations = await this.dataSource.getRepository(AutomationOrmEntity).find({
      where: { tenantId, enabled: true, type: 'KEYWORD_REPLY' },
    });
    for (const a of automations) {
      try {
        const def = a.definition as any;
        const trigger = def?.trigger?.toLowerCase?.();
        if (trigger && text?.toLowerCase?.().includes(trigger)) {
          // TODO: enqueue reply via message queue
        }
      } catch {}
    }
  }

  async listAutomations(tenantId: string) {
    if (!tenantId) {
      return [];
    }
    const automations = await this.dataSource.getRepository(AutomationOrmEntity).find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return automations.map((automation) => ({
      id: automation.id,
      type: automation.type,
      enabled: automation.enabled,
      trigger: String((automation.definition as Record<string, unknown> | null)?.trigger || ''),
      definition: automation.definition || null,
      createdAt: automation.createdAt?.toISOString?.() || null,
    }));
  }

  async scheduleDripSequences() {
    // Placeholder for cron-based drip sequence scheduler
  }
}
