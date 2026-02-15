/**
* File: src/analytics/analytics.resolver.ts
* Module: analytics
* Purpose: GraphQL analytics resolver for tenant-level and campaign-level KPIs.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Reads aggregate counters via TypeORM repositories.
* - Guarded by auth + tenant guards for strict isolation.
*/
import { Context, Field, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import {
  CampaignOrmEntity,
  ContactOrmEntity,
  ConversationOrmEntity,
  MessageDirection,
  MessageOrmEntity,
  MessageStatus,
} from '../database/entities';
import { WhatsAppOnboardingService } from '../modules/whatsapp-onboarding';

@ObjectType()
class TenantStats {
  @Field()
  totalContacts: number;

  @Field()
  totalConversations: number;

  @Field()
  messagesSent: number;

  @Field()
  messagesInbound: number;

  @Field()
  totalCampaigns: number;

  @Field()
  campaignMessagesSent: number;

  @Field()
  campaignMessagesFailed: number;

  @Field()
  campaignReplyRate: number;
}

@ObjectType()
class CampaignKpi {
  @Field()
  campaignId: string;

  @Field()
  campaignName: string;

  @Field()
  outboundSent: number;

  @Field()
  outboundFailed: number;

  @Field()
  inboundReplies: number;

  @Field()
  replyRate: number;
}

@ObjectType()
class WhatsAppOnboardingBucket {
  @Field()
  status: string;

  @Field()
  count: number;
}

@ObjectType()
class WhatsAppOnboardingFunnel {
  @Field()
  total: number;

  @Field(() => [WhatsAppOnboardingBucket])
  buckets: WhatsAppOnboardingBucket[];
}

@Resolver(() => TenantStats)
@UseGuards(GqlAuthGuard, TenantGuard)
export class AnalyticsResolver {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly onboardingService: WhatsAppOnboardingService,
  ) {}

  @Query(() => TenantStats)
  async tenantStats(@Context() context: { tenant: any }): Promise<TenantStats> {
    const tenantId = context?.tenant?.id;
    const contactRepository = this.dataSource.getRepository(ContactOrmEntity);
    const conversationRepository = this.dataSource.getRepository(ConversationOrmEntity);
    const messageRepository = this.dataSource.getRepository(MessageOrmEntity);
    const campaignRepository = this.dataSource.getRepository(CampaignOrmEntity);

    const [totalContacts, totalConversations, messagesSent, messagesInbound, campaigns] = await Promise.all([
      contactRepository.count({ where: { tenantId } }),
      conversationRepository.count({ where: { tenantId } }),
      messageRepository.count({ where: { tenantId, direction: MessageDirection.OUTBOUND } }),
      messageRepository.count({ where: { tenantId, direction: MessageDirection.INBOUND } }),
      campaignRepository.find({ where: { tenantId }, select: { id: true } }),
    ]);
    const campaignIds = campaigns.map((campaign) => campaign.id);
    const totalCampaigns = campaignIds.length;
    const [campaignMessagesSent, campaignMessagesFailed, campaignInboundReplies] =
      campaignIds.length > 0
        ? await Promise.all([
            messageRepository.count({
              where: {
                tenantId,
                campaignId: In(campaignIds),
                direction: MessageDirection.OUTBOUND,
                status: MessageStatus.SENT,
              },
            }),
            messageRepository.count({
              where: {
                tenantId,
                campaignId: In(campaignIds),
                direction: MessageDirection.OUTBOUND,
                status: MessageStatus.FAILED,
              },
            }),
            messageRepository.count({
              where: {
                tenantId,
                campaignId: In(campaignIds),
                direction: MessageDirection.INBOUND,
              },
            }),
          ])
        : [0, 0, 0];
    const campaignReplyRate = campaignMessagesSent
      ? Number(((campaignInboundReplies / campaignMessagesSent) * 100).toFixed(2))
      : 0;
    return {
      totalContacts,
      totalConversations,
      messagesSent,
      messagesInbound,
      totalCampaigns,
      campaignMessagesSent,
      campaignMessagesFailed,
      campaignReplyRate,
    };
  }

  @Query(() => [CampaignKpi])
  async campaignKpis(@Context() context: { tenant: any }): Promise<CampaignKpi[]> {
    const tenantId = context?.tenant?.id;
    const campaignRepository = this.dataSource.getRepository(CampaignOrmEntity);
    const messageRepository = this.dataSource.getRepository(MessageOrmEntity);
    const campaigns = await campaignRepository.find({
      where: { tenantId },
      select: { id: true, name: true },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    if (!campaigns.length) {
      return [];
    }

    const campaignIds = campaigns.map((campaign) => campaign.id);
    const messages = await messageRepository.find({
      where: { tenantId, campaignId: In(campaignIds) },
      select: { campaignId: true, direction: true, status: true },
      take: 20_000,
    });

    const counts = new Map<
      string,
      { outboundSent: number; outboundFailed: number; inboundReplies: number }
    >();

    for (const message of messages) {
      const campaignId = message.campaignId || '';
      if (!campaignId) {
        continue;
      }
      const current = counts.get(campaignId) || {
        outboundSent: 0,
        outboundFailed: 0,
        inboundReplies: 0,
      };
      if (message.direction === MessageDirection.OUTBOUND) {
        if (message.status === MessageStatus.FAILED) {
          current.outboundFailed += 1;
        } else if (message.status === MessageStatus.SENT) {
          current.outboundSent += 1;
        }
      } else if (message.direction === MessageDirection.INBOUND) {
        current.inboundReplies += 1;
      }
      counts.set(campaignId, current);
    }

    return campaigns.map((campaign) => {
      const metric = counts.get(campaign.id) || {
        outboundSent: 0,
        outboundFailed: 0,
        inboundReplies: 0,
      };
      const replyRate = metric.outboundSent
        ? Number(((metric.inboundReplies / metric.outboundSent) * 100).toFixed(2))
        : 0;
      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        outboundSent: metric.outboundSent,
        outboundFailed: metric.outboundFailed,
        inboundReplies: metric.inboundReplies,
        replyRate,
      };
    });
  }

  @Query(() => WhatsAppOnboardingFunnel)
  async whatsappOnboardingFunnel(
    @Context() context: { tenant: any },
  ): Promise<WhatsAppOnboardingFunnel> {
    const tenantId = context?.tenant?.id;
    const funnel = await this.onboardingService.getOnboardingFunnel(tenantId);
    return {
      total: funnel.total,
      buckets: Object.entries(funnel.byStatus).map(([status, count]) => ({
        status,
        count,
      })),
    };
  }
}
