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
import { Injectable } from '@nestjs/common';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { CampaignStatus } from './enums/campaign-status.enum';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CampaignOrmEntity } from '../database/entities';

@Injectable()
export class CampaignService {
  constructor(
    @InjectQueue('campaigns') private readonly campaignsQueue: Queue,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createCampaign(input: CreateCampaignInput, tenantId: string) {
    const campaignRepository = this.dataSource.getRepository(CampaignOrmEntity);
    const campaign = await campaignRepository.save(
      campaignRepository.create({
        ...input,
        status: CampaignStatus.DRAFT,
        tenantId,
      }),
    );

    const delay = input.scheduledAt
      ? Math.max(0, new Date(input.scheduledAt).getTime() - Date.now())
      : 0;
    await this.campaignsQueue.add(
      'dispatch',
      {
        tenantId,
        campaignId: campaign.id,
      },
      { delay },
    );

    return campaign;
  }

  async findAll(tenantId: string) {
    return this.dataSource.getRepository(CampaignOrmEntity).find({
      where: { tenantId },
      relations: { messages: true },
    });
  }
}
