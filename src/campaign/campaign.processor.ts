/**
* File: src/campaign/campaign.processor.ts
* Module: campaign
* Purpose: Bull processor for campaign dispatch fan-out.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Pulls subscribed contacts from TypeORM and enqueues message jobs.
* - Applies simple rate-window throttling between batches.
*/
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import {
  CampaignOrmEntity,
  ContactOrmEntity,
} from '../database/entities';
import { CampaignStatus } from './enums/campaign-status.enum';

@Processor('campaigns')
export class CampaignProcessor {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectQueue('messages') private readonly messageQueue: Queue,
  ) {}

  @Process('dispatch')
  async handleDispatch(job: Job<{ tenantId: string; campaignId: string }>) {
    const { tenantId, campaignId } = job.data;
    const campaignRepository = this.dataSource.getRepository(CampaignOrmEntity);
    const campaign = await campaignRepository.findOne({
      where: { id: campaignId, tenantId },
    });
    if (!campaign) {
      this.logger.warn(
        `Skipping dispatch for missing campaign tenant=${tenantId} campaign=${campaignId}`,
      );
      return { success: false, count: 0, reason: 'campaign_not_found' };
    }
    if (campaign.status === CampaignStatus.PAUSED) {
      this.logger.log(`Skipping paused campaign dispatch ${campaignId}`);
      return { success: true, count: 0, reason: 'campaign_paused' };
    }

    const contactWhere = campaign.audienceContactIds?.length
      ? {
          tenantId,
          subscribed: true,
          id: In(campaign.audienceContactIds),
        }
      : {
          tenantId,
          subscribed: true,
        };
    const contacts = await this.dataSource.getRepository(ContactOrmEntity).find({
      where: contactWhere,
    });
    const perTenantRate = Number(process.env.CAMPAIGN_RATE_PER_MIN || 600); // messages/minute
    const batchSize = Math.max(1, Math.min(100, Math.floor(perTenantRate / 6))); // ~10s windows
    const batches = this.chunk(contacts, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      for (const contact of batch) {
        const payload: any = {
          to: contact.phone,
          type: campaign.templateName ? 'template' : 'text',
        };
        if (campaign.templateName) {
          payload.template = {
            name: campaign.templateName,
            language: { code: 'en_US' },
          };
        } else {
          payload.text = { body: campaign.messageBody || `Campaign ${campaignId}` };
        }
        // attach campaignId for downstream persistence
        payload.campaignId = campaignId;
        await this.messageQueue.add('message', { tenantId, payload, campaignId });
      }
      // Spread batches across time to respect per-tenant rate
      if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 10_000));
    }

    campaign.status = CampaignStatus.SENT;
    await campaignRepository.save(campaign);

    this.logger.log(`Dispatched campaign ${campaignId} for tenant ${tenantId} to ${contacts.length} contacts`);
    return { success: true, count: contacts.length };
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
    return res;
  }
}
