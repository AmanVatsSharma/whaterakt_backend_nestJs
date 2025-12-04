import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayload, RegisteredUserPayload, MfaEnrollmentPayload, MfaStatusPayload } from './entities/auth.entity';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';
import { RateLimitGuard } from '../core/guards/rate-limit.guard';
import { MfaVerifyInput } from './dto/mfa-verify.input';
import { MfaEnrollmentInput } from './dto/mfa-enroll.input';
import { MfaEnrollmentVerifyInput } from './dto/mfa-enroll-verify.input';

@ApiTags('Auth')
@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => RegisteredUserPayload)
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Register tenant owner without logging in' })
  @ApiOkResponse({ description: 'Returns registered user + tenant ids' })
  async registerTenantOwner(@Args('input') input: SignupInput) {
    console.log('[AuthResolver] registerTenantOwner mutation hit', { email: input.email });
    return this.authService.registerTenantOwner(input);
  }

  @Mutation(() => AuthPayload)
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Register and immediately log in (direct onboarding)' })
  @ApiOkResponse({ description: 'Returns tokens unless MFA pending' })
  async registerAndLogin(@Args('input') input: SignupInput) {
    console.log('[AuthResolver] registerAndLogin mutation hit', { email: input.email });
    return this.authService.registerAndLogin(input);
  }

  @Mutation(() => AuthPayload)
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Returns JWT + tenant or MFA challenge' })
  async login(@Args('input') input: LoginInput) {
    console.log('[AuthResolver] login mutation hit', { email: input.email });
    return this.authService.loginWithPassword(input);
  }

  @Mutation(() => AuthPayload)
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Complete MFA login challenge' })
  @ApiOkResponse({ description: 'Issues JWT after MFA success' })
  async completeMfaLogin(@Args('input') input: MfaVerifyInput) {
    console.log('[AuthResolver] completeMfaLogin mutation hit', { challengeId: input.challengeId });
    return this.authService.completeMfaChallenge(input);
  }

  @Mutation(() => MfaEnrollmentPayload)
  @ApiOperation({ summary: 'Begin MFA enrollment' })
  @ApiOkResponse({ description: 'Returns otpauth URL + QR + backup codes' })
  async beginMfaEnrollment(@Args('input') input: MfaEnrollmentInput) {
    console.log('[AuthResolver] beginMfaEnrollment mutation hit', { userId: input.userId });
    return this.authService.beginMfaEnrollment(input.userId);
  }

  @Mutation(() => MfaStatusPayload)
  @ApiOperation({ summary: 'Verify MFA enrollment token' })
  @ApiOkResponse({ description: 'Returns MFA status' })
  async verifyMfaEnrollment(@Args('input') input: MfaEnrollmentVerifyInput) {
    console.log('[AuthResolver] verifyMfaEnrollment mutation hit', { userId: input.userId });
    return this.authService.verifyMfaEnrollment(input);
  }
}
