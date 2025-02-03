import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { TenantGuard } from '../core/guards/tenant.guard';
import { Tenant } from '../tenant/entities/tenant.entity';
import { SendMessageInput } from './dto/send-message.input';

@Resolver()
@UseGuards(TenantGuard)
export class WhatsAppResolver {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Mutation(() => Boolean)
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @Context() context: { tenant: Tenant }
  ) {
    await this.whatsappService.sendMessage(input);
    return true;
  }
} 