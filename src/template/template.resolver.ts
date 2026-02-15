import { Resolver, Mutation, Context, Query, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TemplateService } from './template.service';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';

@ObjectType()
class TemplateListItem {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  content?: string | null;

  @Field({ nullable: true })
  category?: string | null;

  @Field({ nullable: true })
  status?: string | null;

  @Field({ nullable: true })
  createdAt?: string | null;
}

@Resolver()
@UseGuards(GqlAuthGuard, TenantGuard)
export class TemplateResolver {
  constructor(private readonly templateService: TemplateService) {}

  @Query(() => [TemplateListItem])
  async templates(@Context() context: { tenant: { id: string } }) {
    return this.templateService.listTemplates(context.tenant.id);
  }

  @Mutation(() => Boolean)
  async syncTemplates(@Context() context: { tenant: { id: string } }) {
    await this.templateService.syncTemplates(context.tenant.id);
    return true;
  }
}
