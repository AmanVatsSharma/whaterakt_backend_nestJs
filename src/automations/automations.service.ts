/**
* File: src/automations/automations.service.ts
* Module: automations
* Purpose: Automation evaluation service for inbound keyword and drip workflows.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Fetches enabled rules from TypeORM and enqueues outbound replies via queue.
* - Runs a drip scheduler tick to enqueue due steps exactly once.
*/
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectDataSource } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import { Queue } from 'bull';
import { DataSource } from 'typeorm';
import { AutomationOrmEntity } from '../database/entities';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);
  private readonly dripReservationTtlSeconds = 60 * 60 * 24 * 90;
  private readonly inMemoryDripReservations = new Map<string, number>();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectQueue('messages') private readonly messageQueue: Queue,
    @Inject('REDIS_CLIENT') private readonly redis: Redis | null,
  ) {}

  async handleInboundKeyword(tenantId: string, from: string, text: string) {
    if (!tenantId || !from || !text) {
      return { matched: 0, queued: 0 };
    }
    const automations = await this.dataSource.getRepository(AutomationOrmEntity).find({
      where: { tenantId, enabled: true, type: 'KEYWORD_REPLY' },
    });
    let matched = 0;
    let queued = 0;
    for (const a of automations) {
      try {
        const def = (a.definition || {}) as Record<string, unknown>;
        const trigger = String(def?.trigger || '').trim().toLowerCase();
        const replyText = this.resolveKeywordReply(def);
        if (trigger && text?.toLowerCase?.().includes(trigger)) {
          matched += 1;
          if (replyText) {
            await this.enqueueTextMessage(tenantId, from, replyText, {
              automationId: a.id,
              mode: 'keyword',
            });
            queued += 1;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`handleInboundKeyword skipped automation ${a.id}: ${message}`);
      }
    }
    return { matched, queued };
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

  @Cron(CronExpression.EVERY_MINUTE)
  async runDripSchedulerTick() {
    try {
      const result = await this.scheduleDripSequences();
      if (result.queued > 0) {
        this.logger.log(
          `runDripSchedulerTick queued=${result.queued} scanned=${result.scanned}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`runDripSchedulerTick failed: ${message}`);
    }
  }

  async scheduleDripSequences(now = new Date()) {
    const automations = await this.dataSource.getRepository(AutomationOrmEntity).find({
      where: { enabled: true, type: 'DRIP_SEQUENCE' },
      order: { createdAt: 'ASC' },
      take: 500,
    });
    let queued = 0;

    for (const automation of automations) {
      const definition = (automation.definition || {}) as Record<string, unknown>;
      const recipient = this.resolveDripRecipient(definition);
      const steps = this.resolveDripSteps(definition.steps);
      const startAt = this.readDate(definition.startAt) || automation.createdAt || now;
      if (!recipient || !steps.length) {
        continue;
      }

      for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        if (!step.message) {
          continue;
        }
        const dueAt = new Date(startAt.getTime() + step.offsetMinutes * 60 * 1000);
        if (dueAt.getTime() > now.getTime()) {
          continue;
        }
        const reservationKey = `automations:drip:${automation.id}:${index}`;
        const reserved = await this.reserveDispatch(reservationKey);
        if (!reserved) {
          continue;
        }
        await this.enqueueTextMessage(automation.tenantId, recipient, step.message, {
          automationId: automation.id,
          mode: 'drip',
          stepIndex: index,
        });
        queued += 1;
      }
    }

    return { scanned: automations.length, queued };
  }

  private resolveKeywordReply(definition: Record<string, unknown>) {
    const replyNode = definition.reply as Record<string, unknown> | undefined;
    const raw =
      definition.replyText ||
      definition.response ||
      definition.message ||
      replyNode?.text ||
      replyNode?.message ||
      '';
    return String(raw).trim();
  }

  private resolveDripRecipient(definition: Record<string, unknown>) {
    const recipient = definition.recipient || definition.to || definition.phone || '';
    return String(recipient).trim();
  }

  private resolveDripSteps(rawSteps: unknown) {
    if (!Array.isArray(rawSteps)) {
      return [];
    }
    return rawSteps
      .map((step, index) => {
        if (typeof step === 'string') {
          return { message: step.trim(), offsetMinutes: index * 60 };
        }
        const node = (step || {}) as Record<string, unknown>;
        const message = String(node.text || node.message || node.body || '').trim();
        const offsetMinutesRaw = Number(
          node.offsetMinutes ?? node.delayMinutes ?? index * 60
        );
        const offsetMinutes = Number.isFinite(offsetMinutesRaw)
          ? Math.max(0, Math.floor(offsetMinutesRaw))
          : index * 60;
        return { message, offsetMinutes };
      })
      .filter((step) => step.message.length > 0);
  }

  private readDate(raw: unknown): Date | null {
    if (!raw) {
      return null;
    }
    const parsed = new Date(String(raw));
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  private async reserveDispatch(key: string) {
    if (this.redis) {
      const result = await this.redis.set(
        key,
        '1',
        'EX',
        this.dripReservationTtlSeconds,
        'NX',
      );
      return result === 'OK';
    }

    const now = Date.now();
    const existingUntil = this.inMemoryDripReservations.get(key);
    if (existingUntil && existingUntil > now) {
      return false;
    }
    this.inMemoryDripReservations.set(
      key,
      now + this.dripReservationTtlSeconds * 1000,
    );
    return true;
  }

  private async enqueueTextMessage(
    tenantId: string,
    to: string,
    message: string,
    metadata: Record<string, unknown>,
  ) {
    await this.messageQueue.add('message', {
      tenantId,
      payload: {
        to,
        type: 'text',
        text: { body: message },
        metadata,
      },
    });
  }
}
