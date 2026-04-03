/**
* File: src/contact/entities/audience-segment.entity.ts
* Module: contact
* Purpose: GraphQL audience segment summary object.
* Author: BharatERP
* created: 2026-02-16
*/
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Audience segment descriptor with contact count' })
export class AudienceSegment {
  @Field({ description: 'Unique segment identifier' })
  id: string;

  @Field({ description: 'Display name of the segment' })
  name: string;

  @Field({ description: 'Short segment description' })
  description: string;

  @Field(() => Int, { description: 'Contact count in this segment' })
  count: number;
}
