import { ObjectType, Field } from '@nestjs/graphql';
import { Tenant } from '../../tenant/entities/tenant.entity';

@ObjectType()
export class AuthPayload {
  @Field()
  access_token: string;

  @Field(() => Tenant)
  tenant: Tenant;
} 