import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateContactInput {
  @Field()
  phone: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  userId: string;
} 