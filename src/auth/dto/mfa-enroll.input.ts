import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: 'Identify which user should enroll into MFA' })
export class MfaEnrollmentInput {
  @Field({ description: 'Target user identifier' })
  userId: string;
}
