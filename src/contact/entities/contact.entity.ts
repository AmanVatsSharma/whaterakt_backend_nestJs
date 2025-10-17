import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: 'A contact (recipient) in your tenant' })
export class Contact {
  @Field(() => ID, { description: 'Unique contact identifier' })
  id: string;

  @Field({ description: 'Phone number in E.164 format' })
  phone: string;

  @Field({ nullable: true, description: 'First name' })
  firstName?: string;

  @Field({ nullable: true, description: 'Last name' })
  lastName?: string;

  @Field({ description: 'Owner user ID' })
  userId: string;

  @Field({ description: 'Creation timestamp' })
  createdAt: Date;
} 