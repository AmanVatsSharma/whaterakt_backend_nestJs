import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TemplateService } from './template.service';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';

@Resolver()
@UseGuards(GqlAuthGuard, TenantGuard)
export class TemplateResolver {
  constructor(private readonly templates: TemplateService) {}

  @Mutation(() => Boolean)
  async syncTemplates(@Context() context: { tenant: { id: string } }) {
    await this.templates.syncTemplates(context.tenant.id);
    return true;
  }
}
