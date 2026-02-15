/**
* File: src/campaign/campaign.service.ts
* Module: campaign
* Purpose: Campaign creation and listing service.
* Author: Aman Sharma / Novologic/ Codex
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
import { DataSource, Repository } from 'typeorm';
import { CampaignOrmEntity } from '../database/entities';

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
    const campaignRepository = this.dataSource.getRepository(CampaignOrmEntity);
    const initialStatus = input.scheduledAt
      ? CampaignStatus.SCHEDULED
      : CampaignStatus.DRAFT;
    const campaign = await campaignRepository.save(
      campaignRepository.create({
        ...input,
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
    if (status === CampaignStatus.DRAFT || status === CampaignStatus.FAILED) {
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
}
