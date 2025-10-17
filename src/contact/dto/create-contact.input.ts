import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: 'Create a contact record in the current tenant' })
export class CreateContactInput {
  @Field({ description: 'Phone number in E.164 format (e.g., +15551234567)' })
  phone: string;

  @Field({ nullable: true, description: 'Optional first name' })
  firstName?: string;

  @Field({ nullable: true, description: 'Optional last name' })
  lastName?: string;

  @Field({ description: 'Owner user ID for this contact' })
  userId: string;

  @Field(() => [String], { nullable: true, description: 'Optional list of tags to attach' })
  tags?: string[];
} 