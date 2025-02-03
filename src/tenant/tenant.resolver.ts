import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Tenant } from './entities/tenant.entity';
import { TenantService } from './tenant.service';
import { CreateTenantInput } from './dto/create-tenant.input';
import { Logger } from '@nestjs/common';

@Resolver(() => Tenant)
export class TenantResolver {
  private readonly logger = new Logger(TenantResolver.name);
  constructor(private readonly tenantService: TenantService) {}

  @Mutation(() => Tenant)
  async createTenant(@Args('input') input: CreateTenantInput) {
    return this.tenantService.createTenant(input);
  }

  @Query(() => Tenant)
  async tenant(@Args('id') id: string) {
    return this.tenantService.findById(id);
  }
} 