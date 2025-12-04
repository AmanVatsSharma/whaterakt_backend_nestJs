import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: 'Token verification input to finalize MFA enrollment' })
export class MfaEnrollmentVerifyInput {
  @Field({ description: 'User identifier associated with the enrollment' })
  userId: string;

  @Field({ description: 'One valid TOTP token to confirm setup' })
  token: string;
}
