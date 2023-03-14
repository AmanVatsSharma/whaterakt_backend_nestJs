import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Contact {
  @Field(() => ID)
  id: string;

  @Field()
  phone: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  userId: string;

  @Field()
  createdAt: Date;
} 