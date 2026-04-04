import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Tenant } from './entities/tenant.entity';
import { TenantService } from './tenant.service';
import { Logger, UseGuards } from '@nestjs/common';
import { CreateTenantInput } from './dto/create-tenant.input';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';

@Resolver(() => Tenant)
@UseGuards(GqlAuthGuard, TenantGuard, RbacGuard)
export class TenantResolver {
  private readonly logger = new Logger(TenantResolver.name);
  constructor(private readonly tenantService: TenantService) {}

  @RequirePermissions({ resource: 'tenant', action: 'manage' })
  @Mutation(() => Tenant)
  async createTenant(@Args('input') input: CreateTenantInput) {
    this.logger.log(`Creating tenant with input: ${JSON.stringify(input)}`);
    return this.tenantService.createTenant(input);
  }

  @RequirePermissions({ resource: 'tenant', action: 'manage' })
  @Query(() => Tenant)
  async tenant(@Args('id') id: string) {
    this.logger.log(`Fetching tenant with id: ${id}`);
    return this.tenantService.findById(id);
  }
} 