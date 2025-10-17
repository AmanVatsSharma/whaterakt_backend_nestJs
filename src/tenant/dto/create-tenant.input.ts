import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType({ description: 'Create a tenant (workspace)' })
export class CreateTenantInput {
  @Field({ description: 'Tenant name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true, description: 'Optional description' })
  @IsString()
  description?: string;
} 