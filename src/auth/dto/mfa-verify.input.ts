import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: 'Input used to finish MFA login challenges' })
export class MfaVerifyInput {
  @Field({ description: 'Challenge identifier issued during password login' })
  challengeId: string;

  @Field({ nullable: true, description: 'Time-based OTP from authenticator' })
  token?: string;

  @Field({ nullable: true, description: 'One-time backup code fallback' })
  backupCode?: string;
}
