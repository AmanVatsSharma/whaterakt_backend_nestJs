/**
* File: src/contact/contact.resolver.ts
* Module: contact
* Purpose: GraphQL resolver for tenant-scoped contact operations.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Delegates all data access to ContactService.
* - Tenant context is required for list/create operations.
*/
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Contact } from './entities/contact.entity';
import { CreateContactInput } from './dto/create-contact.input';
import { UseGuards } from '@nestjs/common';
import { TenantGuard } from '../core/guards/tenant.guard';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { RateLimitGuard } from '../core/guards/rate-limit.guard';
import { ContactService } from './contact.service';
import { Tenant } from '../tenant/entities/tenant.entity';

@Resolver(() => Contact)
@UseGuards(GqlAuthGuard, TenantGuard, RateLimitGuard)
export class ContactResolver {
  constructor(private readonly contactService: ContactService) {}

  @Mutation(() => Contact)
  async createContact(
    @Args('input') input: CreateContactInput,
    @Context() context: { tenant: Tenant }
  ) {
    return this.contactService.createContact(input, context.tenant.id);
  }

  @Query(() => [Contact])
  async contacts(@Context() context: { tenant: Tenant }) {
    return this.contactService.findAll(context?.tenant?.id);
  }
}
