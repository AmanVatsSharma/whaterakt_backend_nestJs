import { ObjectType, Field } from '@nestjs/graphql';
import { Tenant } from '../../tenant/entities/tenant.entity';

@ObjectType({ description: 'Result of authentication operations' })
export class AuthPayload {
  @Field({ nullable: true, description: 'JWT access token' })
  access_token?: string;

  @Field(() => Tenant, { nullable: true, description: 'Tenant (workspace) associated with the user' })
  tenant?: Tenant;

  @Field({ nullable: true, description: 'Indicates if MFA must be completed' })
  mfaRequired?: boolean;

  @Field({ nullable: true, description: 'Challenge identifier used for MFA completion' })
  challengeId?: string;

  @Field({ nullable: true, description: 'ISO timestamp describing when the challenge expires' })
  challengeExpiresAt?: string;
}

@ObjectType({ description: 'Response returned after creating a tenant owner' })
export class RegisteredUserPayload {
  @Field({ description: 'Newly created user identifier' })
  userId: string;

  @Field({ description: 'User email address' })
  email: string;

  @Field({ description: 'Tenant identifier associated with the new workspace' })
  tenantId: string;
}

@ObjectType({ description: 'Artifacts required for MFA enrollment' })
export class MfaEnrollmentPayload {
  @Field({ description: 'otpauth URI compatible with authenticator apps' })
  otpauthUrl: string;

  @Field({ description: 'QR code as a base64 data URL' })
  qrCodeDataUrl: string;

  @Field(() => [String], { description: 'Backup codes shown once to the end-user' })
  backupCodes: string[];
}

@ObjectType({ description: 'Describes the latest MFA status for a user' })
export class MfaStatusPayload {
  @Field({ description: 'User identifier' })
  userId: string;

  @Field({ description: 'Flag indicating MFA enablement' })
  mfaEnabled: boolean;
}