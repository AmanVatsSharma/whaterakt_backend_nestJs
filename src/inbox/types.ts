import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: 'A conversation between a contact and your team' })
export class Conversation {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true, description: 'Linked contact ID' })
  contactId?: string;

  @Field({ description: 'Status of the conversation' })
  status: 'OPEN' | 'PENDING' | 'CLOSED';

  @Field({ nullable: true, description: 'Assigned agent user ID' })
  assignedUserId?: string;
}

@ObjectType({ description: 'An internal note attached to a conversation' })
export class ConversationNote {
  @Field(() => ID)
  id: string;

  @Field({ description: 'Conversation ID this note belongs to' })
  conversationId: string;

  @Field({ description: 'Note content' })
  content: string;
}

@ObjectType({ description: 'A user-defined tag' })
export class Tag {
  @Field(() => ID)
  id: string;

  @Field({ description: 'Display name of the tag' })
  name: string;
}
