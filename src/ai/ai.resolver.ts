import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { TenantGuard } from '../core/guards/tenant.guard';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';

@Resolver()
@UseGuards(GqlAuthGuard, TenantGuard)
export class AiResolver {
  constructor(private readonly ai: AIService) {}

  @Query(() => [String])
  async aiQuickReplies(@Args('context') context: string) {
    // Generate 3 short options using the AI and simple heuristics
    const seed = await this.ai.generateReplySuggestion(context);
    const options = new Set<string>();
    options.add(seed);
    options.add('Yes, please');
    options.add('No, thanks');
    return Array.from(options).slice(0, 3);
  }
}
