import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: 'Login request with email/password' })
export class LoginInput {
  @Field({ description: 'Email address' })
  email: string;

  @Field({ description: 'Password' })
  password: string;
} 