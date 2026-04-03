/**
 * File: src/automations/automations.resolver.ts
 * Module: automations
 * Purpose: GraphQL query resolver for automation listing.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { Args, Context, Field, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';
import { AutomationsService } from './automations.service';

@ObjectType()
class AutomationListItem {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field()
  enabled: boolean;

  @Field({ nullable: true })
  trigger?: string | null;

  @Field({ nullable: true })
  createdAt?: string | null;

  @Field({ nullable: true })
  definitionJson?: string | null;

  @Field(() => Int)
  stepsCount: number;

  @Field(() => Int)
  conditionsCount: number;
}

@ObjectType()
class AutomationExecutionLogItem {
  @Field()
  id: string;

  @Field({ nullable: true })
  automationId?: string | null;

  @Field()
  automationType: string;

  @Field()
  triggerSource: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  recipient?: string | null;

  @Field({ nullable: true })
  messagePreview?: string | null;

  @Field({ nullable: true })
  detailsJson?: string | null;

  @Field({ nullable: true })
  createdAt?: string | null;
}

@Resolver(() => AutomationListItem)
@UseGuards(GqlAuthGuard, TenantGuard)
export class AutomationsResolver {
  constructor(private readonly automationsService: AutomationsService) {}

  @Query(() => [AutomationListItem])
  async automations(@Context() context: { tenant: { id: string } }) {
    return this.automationsService.listAutomations(context?.tenant?.id);
  }

  @Query(() => [AutomationExecutionLogItem])
  async automationExecutionLogs(
    @Args('automationId', { nullable: true }) automationId: string | null,
    @Context() context: { tenant: { id: string } },
  ) {
    return this.automationsService.listExecutionLogs(
      context?.tenant?.id,
      automationId || undefined,
    );
  }

  @Mutation(() => AutomationListItem)
  async createAutomation(
    @Args('type') type: string,
    @Args('trigger', { nullable: true }) trigger: string | null,
    @Args('enabled', { nullable: true }) enabled: boolean | null,
    @Args('definitionJson', { nullable: true }) definitionJson: string | null,
    @Context() context: { tenant: { id: string } },
  ) {
    return this.automationsService.createAutomation(context?.tenant?.id, {
      type,
      trigger,
      enabled: enabled ?? undefined,
      definition: this.parseDefinition(definitionJson),
    });
  }

  @Mutation(() => AutomationListItem)
  async updateAutomation(
    @Args('automationId') automationId: string,
    @Args('type', { nullable: true }) type: string | null,
    @Args('trigger', { nullable: true }) trigger: string | null,
    @Args('enabled', { nullable: true }) enabled: boolean | null,
    @Args('definitionJson', { nullable: true }) definitionJson: string | null,
    @Context() context: { tenant: { id: string } },
  ) {
    return this.automationsService.updateAutomation(context?.tenant?.id, automationId, {
      type: type ?? undefined,
      trigger,
      enabled: enabled ?? undefined,
      definition: this.parseDefinition(definitionJson),
    });
  }

  @Mutation(() => AutomationListItem)
  async setAutomationEnabled(
    @Args('automationId') automationId: string,
    @Args('enabled') enabled: boolean,
    @Context() context: { tenant: { id: string } },
  ) {
    return this.automationsService.setAutomationEnabled(
      context?.tenant?.id,
      automationId,
      enabled,
    );
  }

  @Mutation(() => Boolean)
  async deleteAutomation(
    @Args('automationId') automationId: string,
    @Context() context: { tenant: { id: string } },
  ) {
    await this.automationsService.deleteAutomation(context?.tenant?.id, automationId);
    return true;
  }

  private parseDefinition(definitionJson?: string | null) {
    if (!definitionJson) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(definitionJson);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
}
