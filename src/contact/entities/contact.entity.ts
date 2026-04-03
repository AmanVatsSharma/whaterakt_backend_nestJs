/**
* File: src/contact/entities/contact.entity.ts
* Module: contact
* Purpose: GraphQL contact object type for audience operations.
* Author: BharatERP
* created: 2026-02-16
*/
import { Field, ID, ObjectType } from '@nestjs/graphql';

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

  @Field({ description: 'Whether contact is subscribed for outbound messaging' })
  subscribed: boolean;

  @Field(() => [String], {
    nullable: true,
    description: 'Tags linked to this contact for segmentation',
  })
  tags?: string[];

  @Field({ description: 'Creation timestamp' })
  createdAt: Date;
}