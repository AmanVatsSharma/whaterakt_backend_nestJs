import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Health {
  @Field()
  status: string;

  @Field()
  timestamp: string;
} 