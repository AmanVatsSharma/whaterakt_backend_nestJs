/**
* File: src/whatsapp/whatsapp.resolver.ts
* Module: whatsapp
* Purpose: GraphQL resolver for outbound WhatsApp sends.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Passes tenant context explicitly to service methods.
* - Keeps resolver focused on auth/guard and argument wiring.
*/
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { TenantGuard } from '../core/guards/tenant.guard';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { RateLimitGuard } from '../core/guards/rate-limit.guard';
import { Tenant } from '../tenant/entities/tenant.entity';
import { SendMessageInput } from './dto/send-message.input';

@Resolver()
@UseGuards(GqlAuthGuard, TenantGuard, RateLimitGuard)
export class WhatsAppResolver {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Mutation(() => Boolean)
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @Context() context: { tenant: Tenant }
  ) {
    const tenantId = context?.tenant?.id;
    await this.whatsappService.sendMessage(input, tenantId);
    return true;
  }
} 