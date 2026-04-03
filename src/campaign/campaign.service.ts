/**
* File: src/campaign/campaign.service.ts
* Module: campaign
* Purpose: Campaign creation and listing service.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Persists campaigns via TypeORM and schedules dispatch jobs.
* - Uses tenantId parameters instead of mutable service state.
*/
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { CampaignStatus } from './enums/campaign-status.enum';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CampaignOrmEntity, ContactOrmEntity } from '../database/entities';
import { UpdateCampaignInput } from './dto/update-campaign.input';

@Injectable()
export class CampaignService {
  constructor(
    @InjectQueue('campaigns') private readonly campaignsQueue: Queue,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createCampaign(input: CreateCampaignInput, tenantId: string, fallbackUserId?: string) {
    const userId = input.userId || fallbackUserId;
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    this.assertPayloadIntegrity(input.messageBody, input.templateName);
    const campaignRepository = this.dataSource.getRepository(CampaignOrmEntity);
    const audienceContactIds = await this.normalizeAudienceContactIds(
      tenantId,
      input.audienceContactIds,
    );
    const initialStatus = input.scheduledAt
      ? CampaignStatus.SCHEDULED
      : CampaignStatus.DRAFT;
    const campaign = await campaignRepository.save(
      campaignRepository.create({
        name: input.name,
        type: input.type,
        scheduledAt: input.scheduledAt,
        messageBody: input.messageBody || null,
        templateName: input.templateName || null,
        audienceContactIds,
        userId,
        status: initialStatus,
        tenantId,
      }),
    );

    if (initialStatus === CampaignStatus.SCHEDULED) {
      await this.enqueueCampaignDispatch(tenantId, campaign.id, input.scheduledAt || undefined);
    }

    return campaign;
  }

  async updateCampaign(
    tenantId: string,
    campaignId: string,
    input: UpdateCampaignInput,
  ) {
    const repository = this.dataSource.getRepository(CampaignOrmEntity);
    const campaign = await this.getCampaignOrThrow(repository, tenantId, campaignId);
    const finalMessageBody =
      input.messageBody !== undefined ? input.messageBody : campaign.messageBody || undefined;
    const finalTemplateName =
      input.templateName !== undefined ? input.templateName : campaign.templateName || undefined;
    this.assertPayloadIntegrity(finalMessageBody, finalTemplateName);
    const audienceContactIds = await this.normalizeAudienceContactIds(
      tenantId,
      input.audienceContactIds,
    );

    if (input.name !== undefined) {
      campaign.name = input.name;
    }
    if (input.type !== undefined) {
      campaign.type = input.type;
    }
    if (input.scheduledAt !== undefined) {
      campaign.scheduledAt = input.scheduledAt ?? null;
    }
    if (input.messageBody !== undefined) {
      campaign.messageBody = input.messageBody || null;
    }
    if (input.templateName !== undefined) {
      campaign.templateName = input.templateName || null;
    }
    if (input.audienceContactIds !== undefined) {
      campaign.audienceContactIds = audienceContactIds;
    }

    if (campaign.status === CampaignStatus.SENT && campaign.scheduledAt) {
      campaign.status = CampaignStatus.SCHEDULED;
    }

    return repository.save(campaign);
  }

  async duplicateCampaign(
    tenantId: string,
    campaignId: string,
    fallbackUserId?: string,
    newName?: string,
  ) {
    const repository = this.dataSource.getRepository(CampaignOrmEntity);
    const source = await this.getCampaignOrThrow(repository, tenantId, campaignId);
    const userId = source.userId || fallbackUserId;
    if (!userId) {
      throw new BadRequestException('Unable to resolve campaign owner for duplicate');
    }

    const duplicate = repository.create({
      name: newName?.trim() || `${source.name} Copy`,
      type: source.type,
      status: CampaignStatus.DRAFT,
      scheduledAt: null,
      messageBody: source.messageBody ?? null,
      templateName: source.templateName ?? null,
      audienceContactIds: source.audienceContactIds || [],
      userId,
      tenantId,
    });
    return repository.save(duplicate);
  }

  async findAll(tenantId: string) {
    return this.dataSource.getRepository(CampaignOrmEntity).find({
      where: { tenantId },
      relations: { messages: true },
    });
  }

  async setStatus(
    tenantId: string,
    campaignId: string,
    status: CampaignStatus,
    options?: { scheduledAt?: Date | null },
  ) {
    const repository = this.dataSource.getRepository(CampaignOrmEntity);
    const campaign = await this.getCampaignOrThrow(repository, tenantId, campaignId);

    campaign.status = status;
    if (status === CampaignStatus.SCHEDULED) {
      campaign.scheduledAt = options?.scheduledAt ?? campaign.scheduledAt ?? new Date();
    }
    if (
      status === CampaignStatus.DRAFT ||
      status === CampaignStatus.FAILED ||
      status === CampaignStatus.PAUSED
    ) {
      campaign.scheduledAt = options?.scheduledAt ?? campaign.scheduledAt ?? null;
    }
    const saved = await repository.save(campaign);

    if (status === CampaignStatus.SCHEDULED) {
      await this.enqueueCampaignDispatch(
        tenantId,
        campaign.id,
        saved.scheduledAt || undefined,
      );
    }
    return saved;
  }

  async remove(tenantId: string, campaignId: string) {
    const repository = this.dataSource.getRepository(CampaignOrmEntity);
    const campaign = await this.getCampaignOrThrow(repository, tenantId, campaignId);
    await repository.remove(campaign);
    return { ok: true };
  }

  private async enqueueCampaignDispatch(
    tenantId: string,
    campaignId: string,
    scheduledAt?: Date,
  ) {
    const delay = scheduledAt
      ? Math.max(0, new Date(scheduledAt).getTime() - Date.now())
      : 0;
    await this.campaignsQueue.add(
      'dispatch',
      {
        tenantId,
        campaignId,
      },
      { delay },
    );
  }

  private async getCampaignOrThrow(
    repository: Repository<CampaignOrmEntity>,
    tenantId: string,
    campaignId: string,
  ) {
    const campaign = await repository.findOne({
      where: { id: campaignId, tenantId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found for tenant');
    }
    return campaign;
  }

  private async normalizeAudienceContactIds(
    tenantId: string,
    audienceContactIds?: string[],
  ) {
    if (!audienceContactIds) {
      return [];
    }
    const uniqueIds = Array.from(
      new Set(
        audienceContactIds
          .map((value) => String(value || '').trim())
          .filter(Boolean),
      ),
    );
    if (!uniqueIds.length) {
      return [];
    }
    const matchedCount = await this.dataSource
      .getRepository(ContactOrmEntity)
      .count({
        where: {
          tenantId,
          id: In(uniqueIds),
        },
      });
    if (matchedCount !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more audience contact ids are invalid for tenant',
      );
    }
    return uniqueIds;
  }

  private assertPayloadIntegrity(messageBody?: string, templateName?: string) {
    if (!String(messageBody || '').trim() && !String(templateName || '').trim()) {
      throw new BadRequestException(
        'Either messageBody or templateName is required for campaign dispatch',
      );
    }
  }
}
