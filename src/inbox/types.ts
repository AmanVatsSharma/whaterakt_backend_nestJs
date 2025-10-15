import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Conversation {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  contactId?: string;

  @Field()
  status: 'OPEN' | 'PENDING' | 'CLOSED';

  @Field({ nullable: true })
  assignedUserId?: string;
}

@ObjectType()
export class ConversationNote {
  @Field(() => ID)
  id: string;

  @Field()
  conversationId: string;

  @Field()
  content: string;
}

@ObjectType()
export class Tag {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}
