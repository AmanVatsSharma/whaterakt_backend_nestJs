/**
* File: src/template/template.resolver.ts
* Module: template
* Purpose: GraphQL resolver for template CRUD and sync lifecycle operations.
* Author: BharatERP
* created: 2026-02-16
*/
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { TemplateService } from './template.service';
import { GqlAuthGuard } from '../core/guards/gql-auth.guard';
import { TenantGuard } from '../core/guards/tenant.guard';

type ResolverContext = {
  tenant: { id: string };
  req?: { user?: { sub?: string; userId?: string } };
};

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

@InputType()
class CreateTemplateInput {
  @Field()
  name: string;

  @Field()
  content: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  status?: string;
}

@InputType()
class UpdateTemplateInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  status?: string;
}

@Resolver()
@UseGuards(GqlAuthGuard, TenantGuard)
export class TemplateResolver {
  constructor(private readonly templateService: TemplateService) {}

  @Query(() => [TemplateListItem])
  async templates(@Context() context: ResolverContext) {
    return this.templateService.listTemplates(context.tenant.id);
  }

  @Mutation(() => Boolean)
  async syncTemplates(@Context() context: ResolverContext) {
    await this.templateService.syncTemplates(context.tenant.id);
    return true;
  }

  @Mutation(() => TemplateListItem)
  async createTemplate(
    @Context() context: ResolverContext,
    @Args('input') input: CreateTemplateInput,
  ) {
    const userId = context.req?.user?.sub || context.req?.user?.userId || null;
    return this.templateService.createTemplate(context.tenant.id, userId, input);
  }

  @Mutation(() => TemplateListItem)
  async updateTemplate(
    @Context() context: ResolverContext,
    @Args('templateId') templateId: string,
    @Args('input') input: UpdateTemplateInput,
  ) {
    return this.templateService.updateTemplate(context.tenant.id, templateId, input);
  }

  @Mutation(() => TemplateListItem)
  async setTemplateStatus(
    @Context() context: ResolverContext,
    @Args('templateId') templateId: string,
    @Args('status') status: string,
  ) {
    return this.templateService.setTemplateStatus(context.tenant.id, templateId, status);
  }

  @Mutation(() => Boolean)
  async deleteTemplate(
    @Context() context: ResolverContext,
    @Args('templateId') templateId: string,
  ) {
    return this.templateService.deleteTemplate(context.tenant.id, templateId);
  }
}
