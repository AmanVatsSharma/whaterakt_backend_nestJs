import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';
import { ConversationService } from './conversation.service';
import { Tenant } from '../tenant/entities/tenant.entity';
import { ConversationStatus } from '../database/entities';

@Resolver()
@UseGuards(GqlAuthGuard, TenantGuard)
export class ConversationResolver {
  constructor(private readonly conversations: ConversationService) {}

  @Query(() => Boolean)
  async pingInbox() { return true; }

  @Mutation(() => Boolean)
  async assignConversation(
    @Args('conversationId') conversationId: string,
    @Args('userId') userId: string,
    @Context() context: { tenant: Tenant },
  ) {
    await this.conversations.assign(context.tenant.id, conversationId, userId);
    return true;
  }

  @Mutation(() => Boolean)
  async setConversationStatus(
    @Args('conversationId') conversationId: string,
    @Args('status') status: 'OPEN' | 'PENDING' | 'CLOSED',
    @Context() context: { tenant: Tenant },
  ) {
    await this.conversations.setStatus(
      context.tenant.id,
      conversationId,
      status as ConversationStatus,
    );
    return true;
  }

  @Mutation(() => Boolean)
  async addConversationNote(@Args('conversationId') conversationId: string, @Args('content') content: string, @Context() context: { tenant: Tenant, req: any }) {
    const userId = context?.req?.user?.userId || context?.req?.user?.sub;
    await this.conversations.addNote(context.tenant.id, conversationId, userId, content);
    return true;
  }

  @Mutation(() => Boolean)
  async tagConversation(@Args('conversationId') conversationId: string, @Args('tag') tag: string, @Context() context: { tenant: Tenant }) {
    await this.conversations.tag(context.tenant.id, conversationId, tag);
    return true;
  }
}
