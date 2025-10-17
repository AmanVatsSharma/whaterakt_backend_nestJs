import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: 'Signup and create a new tenant' })
export class SignupInput {
  @Field({ description: 'Email address' })
  email: string;

  @Field({ description: 'Password' })
  password: string;

  @Field({ description: 'Tenant (workspace) name to create' })
  tenantName: string;
}
