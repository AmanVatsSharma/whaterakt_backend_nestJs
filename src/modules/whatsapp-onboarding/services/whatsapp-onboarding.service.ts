/**
 * File: src/modules/whatsapp-onboarding/services/whatsapp-onboarding.service.ts
 * Module: whatsapp-onboarding
 * Purpose: Managed onboarding, number assignment, and send-readiness logic.
 * Author: Aman Sharma / Vedpragya/ Codex
 * Last-updated: 2026-02-15
 * Notes:
 * - Provides DB-backed tenant<->phone_number_id mapping for WhatsApp flows.
 * - Exposes operator actions with assignment audit persistence.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';
import {
  TemplateOrmEntity,
  TemplateStatus,
  TenantOrmEntity,
  WhatsAppAssignmentAuditAction,
  WhatsAppAssignmentAuditOrmEntity,
  WhatsAppChannelOrmEntity,
  WhatsAppChannelStatus,
  WhatsAppManagedNumberOrmEntity,
  WhatsAppManagedNumberStatus,
} from '../../../database/entities';
import { AssignWhatsAppNumberDto } from '../dtos/assign-whatsapp-number.dto';
import { CreateWhatsAppManagedNumberDto } from '../dtos/create-whatsapp-managed-number.dto';
import { SetWhatsAppChannelStatusDto } from '../dtos/set-whatsapp-channel-status.dto';
import { UpsertWhatsAppOnboardingDto } from '../dtos/upsert-whatsapp-onboarding.dto';
import {
  OnboardingChecklistItem,
  WhatsAppOnboardingStatusEntity,
} from '../entities/whatsapp-onboarding-status.entity';

@Injectable()
export class WhatsAppOnboardingService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getTenantStatus(tenantId: string): Promise<WhatsAppOnboardingStatusEntity> {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const channel = await this.getOrCreateChannel(tenantId);
    const approvedTemplates = await this.dataSource.getRepository(TemplateOrmEntity).count({
      where: { tenantId, status: TemplateStatus.APPROVED },
    });
    const checklist = this.buildChecklist(channel, approvedTemplates);
    const blockers = checklist
      .filter((item) => !item.done && item.blocker)
      .map((item) => item.blocker as string);

    return {
      tenantId,
      status: channel.status,
      businessLegalName: channel.businessLegalName ?? null,
      contactEmail: channel.contactEmail ?? null,
      contactPhone: channel.contactPhone ?? null,
      website: channel.website ?? null,
      expectedDailyVolume: channel.expectedDailyVolume ?? null,
      reviewNotes: channel.reviewNotes ?? null,
      phoneNumberId: channel.phoneNumberId ?? null,
      phoneNumberE164: channel.phoneNumberE164 ?? null,
      wabaId: channel.wabaId ?? null,
      webhookVerifiedAt: channel.webhookVerifiedAt?.toISOString() ?? null,
      activatedAt: channel.activatedAt?.toISOString() ?? null,
      suspendedAt: channel.suspendedAt?.toISOString() ?? null,
      onboardingSlaTargetAt: channel.onboardingSlaTargetAt?.toISOString() ?? null,
      approvedTemplates,
      checklist,
      blockers,
    };
  }

  async submitTenantRequest(
    tenantId: string,
    input: UpsertWhatsAppOnboardingDto,
  ): Promise<WhatsAppOnboardingStatusEntity> {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const repository = this.dataSource.getRepository(WhatsAppChannelOrmEntity);
    const existing = await this.getOrCreateChannel(tenantId);
    const nextStatus =
      existing.status === WhatsAppChannelStatus.NEW
        ? WhatsAppChannelStatus.DOCS_PENDING
        : existing.status;

    await repository.save(
      repository.create({
        ...existing,
        tenantId,
        status: nextStatus,
        businessLegalName: input.businessLegalName ?? existing.businessLegalName,
        contactEmail: input.contactEmail ?? existing.contactEmail,
        contactPhone: input.contactPhone ?? existing.contactPhone,
        website: input.website ?? existing.website,
        expectedDailyVolume: input.expectedDailyVolume ?? existing.expectedDailyVolume,
        reviewNotes: input.reviewNotes ?? existing.reviewNotes,
        onboardingSlaTargetAt:
          nextStatus === WhatsAppChannelStatus.DOCS_PENDING
            ? this.nextSlaTarget()
            : existing.onboardingSlaTargetAt,
      }),
    );

    await this.recordAudit({
      tenantId,
      action: WhatsAppAssignmentAuditAction.ONBOARDING_UPDATED,
      reason: 'Tenant submitted onboarding details',
      metadata: {
        hasBusinessLegalName: Boolean(input.businessLegalName),
        hasContactEmail: Boolean(input.contactEmail),
      },
    });

    return this.getTenantStatus(tenantId);
  }

  async listManagedNumbers(status?: string) {
    const repository = this.dataSource.getRepository(WhatsAppManagedNumberOrmEntity);
    const where = status
      ? { status: status as WhatsAppManagedNumberStatus }
      : undefined;
    const rows = await repository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 1000,
    });
    return rows.map((row) => ({
      id: row.id,
      phoneNumberId: row.phoneNumberId,
      displayPhoneNumber: row.displayPhoneNumber,
      status: row.status,
      assignedTenantId: row.assignedTenantId ?? null,
      wabaId: row.wabaId ?? null,
      qualityRating: row.qualityRating ?? null,
      assignedAt: row.assignedAt?.toISOString() ?? null,
      releasedAt: row.releasedAt?.toISOString() ?? null,
    }));
  }

  async listChannels(status?: string) {
    const repository = this.dataSource.getRepository(WhatsAppChannelOrmEntity);
    const where = status
      ? { status: status as WhatsAppChannelStatus }
      : undefined;
    const rows = await repository.find({
      where,
      order: { updatedAt: 'DESC' },
      take: 1000,
    });
    return rows.map((row) => ({
      tenantId: row.tenantId,
      status: row.status,
      phoneNumberId: row.phoneNumberId ?? null,
      phoneNumberE164: row.phoneNumberE164 ?? null,
      businessLegalName: row.businessLegalName ?? null,
      webhookVerifiedAt: row.webhookVerifiedAt?.toISOString() ?? null,
      activatedAt: row.activatedAt?.toISOString() ?? null,
      suspendedAt: row.suspendedAt?.toISOString() ?? null,
      onboardingSlaTargetAt: row.onboardingSlaTargetAt?.toISOString() ?? null,
      updatedAt: row.updatedAt?.toISOString() ?? null,
    }));
  }

  async upsertManagedNumber(
    input: CreateWhatsAppManagedNumberDto,
    operatorId?: string,
  ) {
    if (!input?.phoneNumberId || !input?.displayPhoneNumber) {
      throw new BadRequestException('phoneNumberId and displayPhoneNumber are required');
    }

    const repository = this.dataSource.getRepository(WhatsAppManagedNumberOrmEntity);
    const existing = await repository.findOne({
      where: { phoneNumberId: input.phoneNumberId },
    });
    const status = input.status || existing?.status || WhatsAppManagedNumberStatus.AVAILABLE;
    const releasedAt =
      status === WhatsAppManagedNumberStatus.AVAILABLE ? new Date() : existing?.releasedAt;

    const saved = await repository.save(
      repository.create({
        ...existing,
        phoneNumberId: input.phoneNumberId,
        displayPhoneNumber: input.displayPhoneNumber,
        status,
        wabaId: input.wabaId ?? existing?.wabaId ?? null,
        businessAccountId: input.businessAccountId ?? existing?.businessAccountId ?? null,
        qualityRating: input.qualityRating ?? existing?.qualityRating ?? null,
        assignedTenantId:
          status === WhatsAppManagedNumberStatus.AVAILABLE
            ? null
            : existing?.assignedTenantId ?? null,
        assignedAt:
          status === WhatsAppManagedNumberStatus.AVAILABLE
            ? null
            : existing?.assignedAt ?? null,
        releasedAt,
      }),
    );

    await this.recordAudit({
      tenantId: saved.assignedTenantId ?? null,
      managedNumberId: saved.id,
      phoneNumberId: saved.phoneNumberId,
      action: WhatsAppAssignmentAuditAction.STATUS_UPDATED,
      operatorId,
      reason: 'Managed number inventory upsert',
      metadata: { status: saved.status },
    });

    return saved;
  }

  async assignManagedNumber(
    input: AssignWhatsAppNumberDto,
    operatorId?: string,
  ): Promise<WhatsAppOnboardingStatusEntity> {
    if (!input.tenantId || !input.phoneNumberId) {
      throw new BadRequestException('tenantId and phoneNumberId are required');
    }
    await this.assertTenantExists(input.tenantId);

    await this.dataSource.transaction(async (manager) => {
      const numberRepository = manager.getRepository(WhatsAppManagedNumberOrmEntity);
      const channelRepository = manager.getRepository(WhatsAppChannelOrmEntity);

      const managedNumber = await numberRepository.findOne({
        where: { phoneNumberId: input.phoneNumberId },
      });
      if (!managedNumber) {
        throw new NotFoundException('Managed number not found');
      }
      if (managedNumber.status === WhatsAppManagedNumberStatus.SUSPENDED) {
        throw new BadRequestException('Managed number is suspended');
      }

      const previousTenantId = managedNumber.assignedTenantId;
      if (
        previousTenantId &&
        previousTenantId !== input.tenantId &&
        !input.forceReassign
      ) {
        throw new BadRequestException(
          'Managed number is already assigned. Use forceReassign=true',
        );
      }

      if (previousTenantId && previousTenantId !== input.tenantId) {
        const previousChannel = await channelRepository.findOne({
          where: { tenantId: previousTenantId },
        });
        if (previousChannel) {
          await channelRepository.save(
            channelRepository.create({
              ...previousChannel,
              status: WhatsAppChannelStatus.VERIFIED,
              phoneNumberId: null,
              phoneNumberE164: null,
              activatedAt: null,
              suspendedAt: null,
              reviewNotes: 'Managed number reassigned',
            }),
          );
        }
        await this.recordAuditWithManager(manager, {
          tenantId: previousTenantId,
          managedNumberId: managedNumber.id,
          phoneNumberId: managedNumber.phoneNumberId,
          action: WhatsAppAssignmentAuditAction.RELEASED,
          operatorId,
          reason: input.reason || 'Managed number reassigned to another tenant',
        });
      }

      const channel = await this.getOrCreateChannelWithManager(manager, input.tenantId);
      const nextStatus =
        input.activateNow || channel.status === WhatsAppChannelStatus.ACTIVE
          ? WhatsAppChannelStatus.ACTIVE
          : WhatsAppChannelStatus.NUMBER_ASSIGNED;
      const now = new Date();

      await numberRepository.save(
        numberRepository.create({
          ...managedNumber,
          status: WhatsAppManagedNumberStatus.ASSIGNED,
          assignedTenantId: input.tenantId,
          assignedAt: now,
          releasedAt: null,
        }),
      );

      await channelRepository.save(
        channelRepository.create({
          ...channel,
          status: nextStatus,
          phoneNumberId: managedNumber.phoneNumberId,
          phoneNumberE164: managedNumber.displayPhoneNumber,
          wabaId: managedNumber.wabaId ?? channel.wabaId ?? null,
          businessAccountId:
            managedNumber.businessAccountId ?? channel.businessAccountId ?? null,
          suspendedAt: null,
          activatedAt:
            nextStatus === WhatsAppChannelStatus.ACTIVE
              ? channel.activatedAt ?? now
              : channel.activatedAt,
          reviewNotes: input.reason ?? channel.reviewNotes,
        }),
      );

      await this.recordAuditWithManager(manager, {
        tenantId: input.tenantId,
        managedNumberId: managedNumber.id,
        phoneNumberId: managedNumber.phoneNumberId,
        action:
          previousTenantId && previousTenantId !== input.tenantId
            ? WhatsAppAssignmentAuditAction.REASSIGNED
            : WhatsAppAssignmentAuditAction.ASSIGNED,
        operatorId,
        reason: input.reason || 'Managed number assigned to tenant',
        metadata: {
          activateNow: Boolean(input.activateNow),
          previousTenantId: previousTenantId || null,
        },
      });
    });

    return this.getTenantStatus(input.tenantId);
  }

  async updateChannelStatus(
    input: SetWhatsAppChannelStatusDto,
    operatorId?: string,
  ): Promise<WhatsAppOnboardingStatusEntity> {
    if (!input?.tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    await this.dataSource.transaction(async (manager) => {
      const channelRepository = manager.getRepository(WhatsAppChannelOrmEntity);
      const numberRepository = manager.getRepository(WhatsAppManagedNumberOrmEntity);
      const channel = await this.getOrCreateChannelWithManager(manager, input.tenantId);
      if (input.status === WhatsAppChannelStatus.ACTIVE && !channel.phoneNumberId) {
        throw new BadRequestException('Cannot activate channel without phone number assignment');
      }

      const now = new Date();
      const updated = channelRepository.create({
        ...channel,
        status: input.status,
        reviewNotes: input.reviewNotes ?? channel.reviewNotes,
        displayNameStatus: input.displayNameStatus ?? channel.displayNameStatus,
        qualityRating: input.qualityRating ?? channel.qualityRating,
        lastReviewAt: now,
        activatedAt:
          input.status === WhatsAppChannelStatus.ACTIVE
            ? channel.activatedAt ?? now
            : channel.activatedAt,
        suspendedAt:
          input.status === WhatsAppChannelStatus.SUSPENDED ? now : channel.suspendedAt,
      });
      await channelRepository.save(updated);

      if (channel.phoneNumberId) {
        const managedNumber = await numberRepository.findOne({
          where: { phoneNumberId: channel.phoneNumberId },
        });
        if (managedNumber) {
          const numberStatus =
            input.status === WhatsAppChannelStatus.SUSPENDED
              ? WhatsAppManagedNumberStatus.SUSPENDED
              : WhatsAppManagedNumberStatus.ASSIGNED;
          await numberRepository.save(
            numberRepository.create({
              ...managedNumber,
              status: numberStatus,
              qualityRating: input.qualityRating ?? managedNumber.qualityRating,
            }),
          );
        }
      }

      const action =
        input.status === WhatsAppChannelStatus.SUSPENDED
          ? WhatsAppAssignmentAuditAction.SUSPENDED
          : input.status === WhatsAppChannelStatus.ACTIVE
            ? WhatsAppAssignmentAuditAction.ACTIVATED
            : WhatsAppAssignmentAuditAction.STATUS_UPDATED;
      await this.recordAuditWithManager(manager, {
        tenantId: input.tenantId,
        phoneNumberId: channel.phoneNumberId,
        action,
        operatorId,
        reason: input.reason || `Channel status updated to ${input.status}`,
      });
    });

    return this.getTenantStatus(input.tenantId);
  }

  async markWebhookVerified(phoneNumberId?: string) {
    if (!phoneNumberId) {
      return;
    }
    const repository = this.dataSource.getRepository(WhatsAppChannelOrmEntity);
    const channel = await repository.findOne({ where: { phoneNumberId } });
    if (!channel) {
      return;
    }
    const now = new Date();
    const nextStatus =
      channel.status === WhatsAppChannelStatus.NUMBER_ASSIGNED
        ? WhatsAppChannelStatus.ACTIVE
        : channel.status;
    await repository.save(
      repository.create({
        ...channel,
        status: nextStatus,
        webhookVerifiedAt: now,
        activatedAt:
          nextStatus === WhatsAppChannelStatus.ACTIVE
            ? channel.activatedAt ?? now
            : channel.activatedAt,
      }),
    );
  }

  async resolveTenantByPhoneNumberId(phoneNumberId?: string): Promise<string | undefined> {
    if (!phoneNumberId) {
      return undefined;
    }
    const channel = await this.dataSource.getRepository(WhatsAppChannelOrmEntity).findOne({
      where: { phoneNumberId },
      order: { updatedAt: 'DESC' },
    });
    if (channel?.tenantId) {
      return channel.tenantId;
    }
    const managed = await this.dataSource.getRepository(WhatsAppManagedNumberOrmEntity).findOne({
      where: { phoneNumberId, status: WhatsAppManagedNumberStatus.ASSIGNED },
    });
    return managed?.assignedTenantId || undefined;
  }

  async resolvePhoneNumberIdByTenant(tenantId?: string): Promise<string | undefined> {
    if (!tenantId) {
      return undefined;
    }
    const channel = await this.dataSource.getRepository(WhatsAppChannelOrmEntity).findOne({
      where: {
        tenantId,
        status: In([
          WhatsAppChannelStatus.NUMBER_ASSIGNED,
          WhatsAppChannelStatus.ACTIVE,
          WhatsAppChannelStatus.SUSPENDED,
        ]),
      },
      order: { updatedAt: 'DESC' },
    });
    if (channel?.phoneNumberId) {
      return channel.phoneNumberId;
    }
    const managed = await this.dataSource.getRepository(WhatsAppManagedNumberOrmEntity).findOne({
      where: {
        assignedTenantId: tenantId,
        status: WhatsAppManagedNumberStatus.ASSIGNED,
      },
      order: { updatedAt: 'DESC' },
    });
    return managed?.phoneNumberId || undefined;
  }

  async isTenantSendReady(tenantId?: string) {
    if (!tenantId) {
      return { ready: false, reason: 'missing_tenant' };
    }
    const channel = await this.dataSource.getRepository(WhatsAppChannelOrmEntity).findOne({
      where: { tenantId },
    });
    if (!channel || !channel.phoneNumberId) {
      return { ready: false, reason: 'number_not_assigned' };
    }
    if (channel.status === WhatsAppChannelStatus.SUSPENDED) {
      return { ready: false, reason: 'channel_suspended' };
    }
    if (channel.status !== WhatsAppChannelStatus.ACTIVE) {
      return { ready: false, reason: 'channel_not_active' };
    }
    if (!channel.webhookVerifiedAt) {
      return { ready: false, reason: 'webhook_not_verified' };
    }
    return { ready: true, reason: 'ok', phoneNumberId: channel.phoneNumberId };
  }

  async getOnboardingFunnel(tenantId?: string) {
    const queryBuilder = this.dataSource
      .getRepository(WhatsAppChannelOrmEntity)
      .createQueryBuilder('channel')
      .select('channel.status', 'status')
      .addSelect('COUNT(*)', 'count');
    if (tenantId) {
      queryBuilder.where('channel.tenantId = :tenantId', { tenantId });
    }
    const rows = await queryBuilder
      .groupBy('channel.status')
      .getRawMany<{ status: string; count: string }>();

    const byStatus = Object.values(WhatsAppChannelStatus).reduce<Record<string, number>>(
      (accumulator, status) => {
        accumulator[status] = 0;
        return accumulator;
      },
      {},
    );
    for (const row of rows) {
      byStatus[row.status] = Number(row.count || 0);
    }
    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
    return { total, byStatus };
  }

  private async assertTenantExists(tenantId: string) {
    const exists = await this.dataSource.getRepository(TenantOrmEntity).exist({
      where: { id: tenantId },
    });
    if (!exists) {
      throw new BadRequestException('tenant not found');
    }
  }

  private async getOrCreateChannel(tenantId: string) {
    const repository = this.dataSource.getRepository(WhatsAppChannelOrmEntity);
    const existing = await repository.findOne({ where: { tenantId } });
    if (existing) {
      return existing;
    }
    return repository.save(
      repository.create({
        tenantId,
        status: WhatsAppChannelStatus.NEW,
        onboardingSlaTargetAt: this.nextSlaTarget(),
      }),
    );
  }

  private async getOrCreateChannelWithManager(
    manager: EntityManager,
    tenantId: string,
  ) {
    const repository = manager.getRepository(WhatsAppChannelOrmEntity);
    const existing = await repository.findOne({ where: { tenantId } });
    if (existing) {
      return existing;
    }
    return repository.save(
      repository.create({
        tenantId,
        status: WhatsAppChannelStatus.NEW,
        onboardingSlaTargetAt: this.nextSlaTarget(),
      }),
    );
  }

  private buildChecklist(
    channel: WhatsAppChannelOrmEntity,
    approvedTemplates: number,
  ): OnboardingChecklistItem[] {
    return [
      {
        key: 'business_profile',
        label: 'Business profile submitted',
        done: Boolean(channel.businessLegalName && channel.contactEmail),
        blocker: 'Complete business legal name and contact email',
      },
      {
        key: 'review',
        label: 'Operational review completed',
        done: ![
          WhatsAppChannelStatus.NEW,
          WhatsAppChannelStatus.DOCS_PENDING,
        ].includes(channel.status),
        blocker: 'Awaiting onboarding review by operations',
      },
      {
        key: 'number',
        label: 'Managed number assigned',
        done: Boolean(channel.phoneNumberId),
        blocker: 'No managed WhatsApp number assigned',
      },
      {
        key: 'webhook',
        label: 'Webhook event verified',
        done: Boolean(channel.webhookVerifiedAt),
        blocker: 'Webhook has not received and verified events yet',
      },
      {
        key: 'templates',
        label: 'At least one approved template available',
        done: approvedTemplates > 0,
        blocker: 'No approved message templates found',
      },
      {
        key: 'active',
        label: 'Channel is active',
        done: channel.status === WhatsAppChannelStatus.ACTIVE,
        blocker: 'Channel is not active for outbound messaging',
      },
    ];
  }

  private nextSlaTarget() {
    const raw = Number(process.env.WHATSAPP_ONBOARDING_REVIEW_SLA_HOURS || 48);
    const boundedHours = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 24 * 14) : 48;
    return new Date(Date.now() + boundedHours * 60 * 60 * 1000);
  }

  private async recordAudit(
    input: Partial<WhatsAppAssignmentAuditOrmEntity>,
  ) {
    await this.recordAuditWithManager(this.dataSource.manager, input);
  }

  private async recordAuditWithManager(
    manager: EntityManager,
    input: Partial<WhatsAppAssignmentAuditOrmEntity>,
  ) {
    const repository = manager.getRepository(WhatsAppAssignmentAuditOrmEntity);
    await repository.save(repository.create(input));
  }
}
