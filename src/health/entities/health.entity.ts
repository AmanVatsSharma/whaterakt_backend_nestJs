import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType({ description: 'Service health summary' })
export class Health {
  @Field({ description: 'UP/DOWN' })
  status: string;

  @Field({ description: 'ISO timestamp' })
  timestamp: string;
} 