/**
* File: src/automations/automations.service.ts
* Module: automations
* Purpose: Automation evaluation service for inbound keyword and drip workflows.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Fetches enabled rules from TypeORM and enqueues outbound replies via queue.
* - Runs a drip scheduler tick to enqueue due steps exactly once.
*/
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectDataSource } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import { Queue } from 'bull';
import { DataSource } from 'typeorm';
import {
  AutomationExecutionLogOrmEntity,
  AutomationOrmEntity,
} from '../database/entities';

type AutomationWorkflowStep = {
  message: string;
  offsetMinutes: number;
};

type AutomationCondition = {
  field: string;
  operator: string;
  value?: string;
};

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
        const conditions = this.resolveConditions(def.conditions);
        const context = { text, from, trigger };
        if (trigger && text?.toLowerCase?.().includes(trigger)) {
          matched += 1;
          if (!this.evaluateConditions(conditions, context)) {
            await this.logExecution({
              tenantId,
              automationId: a.id,
              automationType: a.type,
              triggerSource: 'KEYWORD_REPLY',
              status: 'SKIPPED',
              recipient: from,
              details: { reason: 'conditions_not_met' },
            });
            continue;
          }

          const steps = this.resolveWorkflowSteps(def, this.resolveKeywordReply(def));
          if (!steps.length) {
            await this.logExecution({
              tenantId,
              automationId: a.id,
              automationType: a.type,
              triggerSource: 'KEYWORD_REPLY',
              status: 'SKIPPED',
              recipient: from,
              details: { reason: 'no_steps_configured' },
            });
            continue;
          }

          for (let index = 0; index < steps.length; index += 1) {
            const step = steps[index];
            await this.enqueueTextMessage(
              tenantId,
              from,
              step.message,
              {
                automationId: a.id,
                mode: 'keyword',
                stepIndex: index,
              },
              step.offsetMinutes * 60 * 1000,
            );
            await this.logExecution({
              tenantId,
              automationId: a.id,
              automationType: a.type,
              triggerSource: 'KEYWORD_REPLY',
              status: 'QUEUED',
              recipient: from,
              messagePreview: step.message,
              details: {
                stepIndex: index,
                delayMinutes: step.offsetMinutes,
              },
            });
            queued += 1;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`handleInboundKeyword skipped automation ${a.id}: ${message}`);
        await this.logExecution({
          tenantId,
          automationId: a.id,
          automationType: a.type,
          triggerSource: 'KEYWORD_REPLY',
          status: 'FAILED',
          recipient: from,
          details: { reason: message },
        });
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
    return automations.map((automation) => this.mapAutomation(automation));
  }

  async listExecutionLogs(tenantId: string, automationId?: string) {
    if (!tenantId) {
      return [];
    }
    const where = automationId
      ? { tenantId, automationId }
      : { tenantId };
    const logs = await this.dataSource.getRepository(AutomationExecutionLogOrmEntity).find({
      where,
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return logs.map((log) => ({
      id: log.id,
      automationId: log.automationId || null,
      automationType: log.automationType,
      triggerSource: log.triggerSource,
      status: log.status,
      recipient: log.recipient || null,
      messagePreview: log.messagePreview || null,
      detailsJson: log.details ? JSON.stringify(log.details) : null,
      createdAt: log.createdAt?.toISOString?.() || null,
    }));
  }

  async createAutomation(
    tenantId: string,
    input: {
      type: string;
      enabled?: boolean;
      trigger?: string | null;
      definition?: Record<string, unknown> | null;
    },
  ) {
    if (!tenantId || !input?.type) {
      throw new BadRequestException('tenantId and type are required');
    }
    const repository = this.dataSource.getRepository(AutomationOrmEntity);
    const definition = {
      ...(input.definition || {}),
      ...(input.trigger ? { trigger: input.trigger } : {}),
    };
    const created = await repository.save(
      repository.create({
        tenantId,
        type: input.type,
        enabled: input.enabled ?? true,
        definition,
      }),
    );
    return this.mapAutomation(created);
  }

  async updateAutomation(
    tenantId: string,
    automationId: string,
    input: {
      type?: string;
      enabled?: boolean;
      trigger?: string | null;
      definition?: Record<string, unknown> | null;
    },
  ) {
    const repository = this.dataSource.getRepository(AutomationOrmEntity);
    const automation = await repository.findOne({
      where: { id: automationId, tenantId },
    });
    if (!automation) {
      throw new NotFoundException('Automation not found for tenant');
    }
    if (input.type) {
      automation.type = input.type;
    }
    if (typeof input.enabled === 'boolean') {
      automation.enabled = input.enabled;
    }
    const definition = {
      ...((automation.definition || {}) as Record<string, unknown>),
      ...((input.definition || {}) as Record<string, unknown>),
    };
    if (input.trigger !== undefined) {
      if (input.trigger) {
        definition.trigger = input.trigger;
      } else {
        delete definition.trigger;
      }
    }
    automation.definition = definition;
    const saved = await repository.save(automation);
    return this.mapAutomation(saved);
  }

  async setAutomationEnabled(
    tenantId: string,
    automationId: string,
    enabled: boolean,
  ) {
    return this.updateAutomation(tenantId, automationId, { enabled });
  }

  async deleteAutomation(tenantId: string, automationId: string) {
    const repository = this.dataSource.getRepository(AutomationOrmEntity);
    const automation = await repository.findOne({
      where: { id: automationId, tenantId },
    });
    if (!automation) {
      throw new NotFoundException('Automation not found for tenant');
    }
    await repository.remove(automation);
    return { ok: true };
  }

  async ensureDefaultShopifyJourneys(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const repository = this.dataSource.getRepository(AutomationOrmEntity);
    const existing = await repository.find({
      where: { tenantId, type: 'SHOPIFY_EVENT' },
      take: 200,
    });
    const existingEvents = new Set(
      existing.map((item) =>
        String((item.definition as Record<string, unknown> | null)?.event || '').toUpperCase(),
      ),
    );
    const defaultJourneys = [
      {
        event: 'ORDER_CREATED',
        messageTemplate:
          'Namaste {{firstName}}, your order {{orderNumber}} is confirmed. Track updates in WhatsApp.',
      },
      {
        event: 'ORDER_FULFILLED',
        messageTemplate:
          'Good news {{firstName}}! Order {{orderNumber}} has been shipped. Reply for support anytime.',
      },
      {
        event: 'CUSTOMER_WIN_BACK',
        messageTemplate:
          'We miss you {{firstName}}. Here is a special offer from our store for your next order.',
      },
    ];

    let created = 0;
    for (const journey of defaultJourneys) {
      if (existingEvents.has(journey.event)) {
        continue;
      }
      await repository.save(
        repository.create({
          tenantId,
          type: 'SHOPIFY_EVENT',
          enabled: true,
          definition: {
            event: journey.event,
            messageTemplate: journey.messageTemplate,
          },
        }),
      );
      created += 1;
    }
    return { ok: true, created, total: defaultJourneys.length };
  }

  async handleShopifyEvent(
    tenantId: string,
    event: string,
    context: Record<string, unknown>,
  ) {
    if (!tenantId || !event) {
      return { matched: 0, queued: 0 };
    }
    const targetEvent = event.trim().toUpperCase();
    const recipient = this.resolveEventRecipient(context);
    if (!recipient) {
      return { matched: 0, queued: 0 };
    }
    const repository = this.dataSource.getRepository(AutomationOrmEntity);
    const automations = await repository.find({
      where: {
        tenantId,
        type: 'SHOPIFY_EVENT',
        enabled: true,
      },
      take: 200,
    });
    let matched = 0;
    let queued = 0;
    for (const automation of automations) {
      const definition = (automation.definition || {}) as Record<string, unknown>;
      const definitionEvent = String(definition.event || '').toUpperCase();
      if (definitionEvent !== targetEvent) {
        continue;
      }
      matched += 1;
      const conditions = this.resolveConditions(definition.conditions);
      if (!this.evaluateConditions(conditions, { ...context, event: targetEvent })) {
        await this.logExecution({
          tenantId,
          automationId: automation.id,
          automationType: automation.type,
          triggerSource: targetEvent,
          status: 'SKIPPED',
          recipient,
          details: { reason: 'conditions_not_met' },
        });
        continue;
      }
      const template =
        String(definition.messageTemplate || definition.message || '').trim() ||
        'Your Shopify activity has been updated.';
      const steps = this.resolveWorkflowSteps(definition, template);
      for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        const message = this.renderTemplate(step.message, context);
        await this.enqueueTextMessage(
          tenantId,
          recipient,
          message,
          {
            source: 'shopify',
            event: targetEvent,
            automationId: automation.id,
            stepIndex: index,
          },
          step.offsetMinutes * 60 * 1000,
        );
        await this.logExecution({
          tenantId,
          automationId: automation.id,
          automationType: automation.type,
          triggerSource: targetEvent,
          status: 'QUEUED',
          recipient,
          messagePreview: message,
          details: {
            stepIndex: index,
            delayMinutes: step.offsetMinutes,
          },
        });
        queued += 1;
      }
    }
    return { matched, queued };
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
        await this.logExecution({
          tenantId: automation.tenantId,
          automationId: automation.id,
          automationType: automation.type,
          triggerSource: 'DRIP_SEQUENCE',
          status: 'SKIPPED',
          recipient,
          details: { reason: 'missing_recipient_or_steps' },
        });
        continue;
      }
      const conditions = this.resolveConditions(definition.conditions);
      if (!this.evaluateConditions(conditions, { recipient })) {
        await this.logExecution({
          tenantId: automation.tenantId,
          automationId: automation.id,
          automationType: automation.type,
          triggerSource: 'DRIP_SEQUENCE',
          status: 'SKIPPED',
          recipient,
          details: { reason: 'conditions_not_met' },
        });
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
        await this.logExecution({
          tenantId: automation.tenantId,
          automationId: automation.id,
          automationType: automation.type,
          triggerSource: 'DRIP_SEQUENCE',
          status: 'QUEUED',
          recipient,
          messagePreview: step.message,
          details: {
            stepIndex: index,
            delayMinutes: step.offsetMinutes,
          },
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

  private resolveDripSteps(rawSteps: unknown): AutomationWorkflowStep[] {
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

  private resolveWorkflowSteps(
    definition: Record<string, unknown>,
    fallbackMessage: string,
  ): AutomationWorkflowStep[] {
    const configured = this.resolveDripSteps(definition.steps);
    if (configured.length > 0) {
      return configured;
    }
    const fallback = String(fallbackMessage || '').trim();
    if (!fallback) {
      return [];
    }
    return [{ message: fallback, offsetMinutes: 0 }];
  }

  private resolveConditions(rawConditions: unknown): AutomationCondition[] {
    if (!Array.isArray(rawConditions)) {
      return [];
    }
    return rawConditions
      .map((item) => {
        const condition = (item || {}) as Record<string, unknown>;
        return {
          field: String(condition.field || '').trim(),
          operator: String(condition.operator || 'contains').trim().toLowerCase(),
          value: condition.value !== undefined ? String(condition.value) : undefined,
        };
      })
      .filter((condition) => condition.field.length > 0);
  }

  private evaluateConditions(
    conditions: AutomationCondition[],
    context: Record<string, unknown>,
  ) {
    if (!conditions.length) {
      return true;
    }
    return conditions.every((condition) => {
      const source = String(context[condition.field] ?? '');
      const left = source.toLowerCase();
      const right = String(condition.value ?? '').toLowerCase();

      switch (condition.operator) {
        case 'equals':
          return left === right;
        case 'not_equals':
          return left !== right;
        case 'starts_with':
          return right ? left.startsWith(right) : false;
        case 'ends_with':
          return right ? left.endsWith(right) : false;
        case 'not_contains':
          return right ? !left.includes(right) : true;
        case 'exists':
          return left.length > 0;
        case 'contains':
        default:
          return right ? left.includes(right) : false;
      }
    });
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
    delayMs = 0,
  ) {
    await this.messageQueue.add(
      'message',
      {
        tenantId,
        payload: {
          to,
          type: 'text',
          text: { body: message },
          metadata,
        },
      },
      {
        delay: Math.max(0, Math.floor(delayMs)),
      },
    );
  }

  private async logExecution(input: {
    tenantId: string;
    automationId?: string | null;
    automationType: string;
    triggerSource: string;
    status: string;
    recipient?: string | null;
    messagePreview?: string;
    details?: Record<string, unknown>;
  }) {
    try {
      const repository = this.dataSource.getRepository(AutomationExecutionLogOrmEntity);
      await repository.save(
        repository.create({
          tenantId: input.tenantId,
          automationId: input.automationId || null,
          automationType: input.automationType,
          triggerSource: input.triggerSource,
          status: input.status,
          recipient: input.recipient || null,
          messagePreview: input.messagePreview || null,
          details: input.details || null,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to persist automation execution log: ${message}`);
    }
  }

  private mapAutomation(automation: AutomationOrmEntity) {
    const definition = (automation.definition || {}) as Record<string, unknown>;
    const conditions = this.resolveConditions(definition.conditions);
    const steps = this.resolveWorkflowSteps(definition, this.resolveKeywordReply(definition));
    return {
      id: automation.id,
      type: automation.type,
      enabled: automation.enabled,
      trigger: String(
        definition.trigger ||
          definition.event ||
          '',
      ),
      definitionJson: Object.keys(definition).length
        ? JSON.stringify(definition)
        : null,
      stepsCount: steps.length,
      conditionsCount: conditions.length,
      createdAt: automation.createdAt?.toISOString?.() || null,
    };
  }

  private resolveEventRecipient(context: Record<string, unknown>) {
    const raw =
      context.phone ||
      context.customerPhone ||
      context.shippingPhone ||
      context.to ||
      '';
    return String(raw).trim();
  }

  private renderTemplate(template: string, context: Record<string, unknown>) {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
      const value = context[key];
      if (value === undefined || value === null) {
        return '';
      }
      return String(value);
    });
  }
}
