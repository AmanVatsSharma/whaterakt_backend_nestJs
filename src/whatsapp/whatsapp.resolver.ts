import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { TenantGuard } from '../core/guards/tenant.guard';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { RateLimitGuard } from '../core/guards/rate-limit.guard';
import { Tenant } from '../tenant/entities/tenant.entity';
import { SendMessageInput } from './dto/send-message.input';

@Resolver()
@UseGuards(GqlAuthGuard, TenantGuard, RateLimitGuard)
export class WhatsAppResolver {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly adapter: WhatsAppAdapter,
  ) {}

  @Mutation(() => Boolean)
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @Context() context: { tenant: Tenant }
  ) {
    await this.whatsappService.sendMessage(input);
    return true;
  }
} 