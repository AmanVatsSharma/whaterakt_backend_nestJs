import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

@InputType({ description: 'Signup and create a new tenant' })
export class SignupInput {
  @Field({ description: 'Email address' })
  @IsEmail()
  email: string;

  @Field({ description: 'Password' })
  @IsString()
  @MinLength(8)
  password: string;

  @Field({ description: 'Tenant (workspace) name to create' })
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @Field({ nullable: true, description: 'Optional OTP required when direct register-and-login hardening is enabled' })
  @IsOptional()
  @IsString()
  otpCode?: string;
}
