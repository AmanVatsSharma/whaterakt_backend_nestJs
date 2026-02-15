/**
 * File: src/automations/automations.resolver.ts
 * Module: automations
 * Purpose: GraphQL query resolver for automation listing.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { Context, Field, ObjectType, Query, Resolver } from '@nestjs/graphql';
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
}

@Resolver(() => AutomationListItem)
@UseGuards(GqlAuthGuard, TenantGuard)
export class AutomationsResolver {
  constructor(private readonly automationsService: AutomationsService) {}

  @Query(() => [AutomationListItem])
  async automations(@Context() context: { tenant: { id: string } }) {
    return this.automationsService.listAutomations(context?.tenant?.id);
  }
}
