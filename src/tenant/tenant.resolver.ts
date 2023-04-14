import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Tenant } from './entities/tenant.entity';
import { TenantService } from './tenant.service';
import { Logger } from '@nestjs/common';
import { CreateTenantInput } from './dto/create-tenant.input';

@Resolver(() => Tenant)
export class TenantResolver {
  private readonly logger = new Logger(TenantResolver.name);
  constructor(private readonly tenantService: TenantService) {}

  @Mutation(() => Tenant)
  async createTenant(@Args('input') input: CreateTenantInput) {
    this.logger.log(`Creating tenant with input: ${JSON.stringify(input)}`);
    return this.tenantService.createTenant(input);
  }

  @Query(() => Tenant)
  async tenant(@Args('id') id: string) {
    this.logger.log(`Fetching tenant with id: ${id}`);
    return this.tenantService.findById(id);
  }
} 