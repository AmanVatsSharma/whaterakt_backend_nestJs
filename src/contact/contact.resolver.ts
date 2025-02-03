import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma.service';
import { Contact } from './entities/contact.entity';
import { CreateContactInput } from './dto/create-contact.input';
import { UseGuards } from '@nestjs/common';
import { TenantGuard } from '../core/guards/tenant.guard';
import { TenantAwareService } from '../core/services/tenant-aware.service';
import { ContactService } from './contact.service';
import { Tenant } from '../tenant/entities/tenant.entity';

@Resolver(() => Contact)
@UseGuards(TenantGuard)
export class ContactResolver {
  constructor(
    private readonly contactService: ContactService,
    private readonly prisma: PrismaService
  ) {}

  @Mutation(() => Contact)
  async createContact(
    @Args('input') input: CreateContactInput,
    @Context() context: { tenant: Tenant }
  ) {
    return this.contactService
      .setTenantId(context.tenant.id)
      .createContact(input);
  }

  @Query(() => [Contact])
  async contacts() {
    return this.prisma.contact.findMany({
      include: { groups: true },
    });
  }
}
