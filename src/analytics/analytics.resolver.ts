/**
* File: src/analytics/analytics.resolver.ts
* Module: analytics
* Purpose: GraphQL analytics resolver for tenant-level counters.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Reads counts via TypeORM repositories.
* - Guarded by auth + tenant guards for strict isolation.
*/
import { Context, Field, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ContactOrmEntity, ConversationOrmEntity, MessageDirection, MessageOrmEntity } from '../database/entities';

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
}

@Resolver(() => TenantStats)
@UseGuards(GqlAuthGuard, TenantGuard)
export class AnalyticsResolver {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Query(() => TenantStats)
  async tenantStats(@Context() context: { tenant: any }): Promise<TenantStats> {
    const tenantId = context?.tenant?.id;
    const contactRepository = this.dataSource.getRepository(ContactOrmEntity);
    const conversationRepository = this.dataSource.getRepository(ConversationOrmEntity);
    const messageRepository = this.dataSource.getRepository(MessageOrmEntity);

    const [totalContacts, totalConversations, messagesSent, messagesInbound] = await Promise.all([
      contactRepository.count({ where: { tenantId } }),
      conversationRepository.count({ where: { tenantId } }),
      messageRepository.count({ where: { tenantId, direction: MessageDirection.OUTBOUND } }),
      messageRepository.count({ where: { tenantId, direction: MessageDirection.INBOUND } }),
    ]);
    return { totalContacts, totalConversations, messagesSent, messagesInbound };
  }
}
