import { Resolver, Query, Context, ObjectType, Field } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';

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
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => TenantStats)
  async tenantStats(@Context() context: { tenant: any }): Promise<TenantStats> {
    const tenantId = context?.tenant?.id;
    const [totalContacts, totalConversations, messagesSent, messagesInbound] = await Promise.all([
      this.prisma.contact.count({ where: { tenantId } }),
      this.prisma.conversation.count({ where: { tenantId } }),
      this.prisma.message.count({ where: { tenantId, direction: 'OUTBOUND' } }),
      this.prisma.message.count({ where: { tenantId, direction: 'INBOUND' } }),
    ]);
    return { totalContacts, totalConversations, messagesSent, messagesInbound };
  }
}
