import { ObjectType, Field } from '@nestjs/graphql';
import { Tenant } from '../../tenant/entities/tenant.entity';

@ObjectType({ description: 'Result of authentication operations' })
export class AuthPayload {
  @Field({ description: 'JWT access token' })
  access_token: string;

  @Field(() => Tenant, { description: 'Tenant (workspace) associated with the user' })
  tenant: Tenant;
} 