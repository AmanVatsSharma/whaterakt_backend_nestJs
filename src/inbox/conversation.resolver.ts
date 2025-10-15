import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';
import { ConversationService } from './conversation.service';
import { Tenant } from '../tenant/entities/tenant.entity';

@Resolver()
@UseGuards(GqlAuthGuard, TenantGuard)
export class ConversationResolver {
  constructor(private readonly conversations: ConversationService) {}

  @Mutation(() => Boolean)
  async assignConversation(@Args('conversationId') conversationId: string, @Args('userId') userId: string) {
    await this.conversations.assign(conversationId, userId);
    return true;
  }

  @Mutation(() => Boolean)
  async setConversationStatus(@Args('conversationId') conversationId: string, @Args('status') status: 'OPEN' | 'PENDING' | 'CLOSED') {
    await this.conversations.setStatus(conversationId, status);
    return true;
  }

  @Mutation(() => Boolean)
  async addConversationNote(@Args('conversationId') conversationId: string, @Args('content') content: string, @Context() context: { tenant: Tenant, req: any }) {
    const userId = context?.req?.user?.sub;
    await this.conversations.addNote(conversationId, userId, content);
    return true;
  }

  @Mutation(() => Boolean)
  async tagConversation(@Args('conversationId') conversationId: string, @Args('tag') tag: string, @Context() context: { tenant: Tenant }) {
    await this.conversations.tag(conversationId, context.tenant.id, tag);
    return true;
  }
}
