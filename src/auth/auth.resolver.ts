/**
* File: src/auth/auth.resolver.ts
* Module: auth
* Purpose: GraphQL resolver entrypoints for authentication and MFA flows.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Delegates business logic to AuthService.
* - Rate limiting is enforced on public auth mutations.
*/
import { Args, Mutation, Resolver } from '@nestjs/graphql';
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
    return this.authService.registerTenantOwner(input);
  }

  @Mutation(() => AuthPayload)
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Register and immediately log in (direct onboarding)' })
  @ApiOkResponse({ description: 'Returns tokens unless MFA pending' })
  async registerAndLogin(@Args('input') input: SignupInput) {
    return this.authService.registerAndLogin(input);
  }

  @Mutation(() => AuthPayload)
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Returns JWT + tenant or MFA challenge' })
  async login(@Args('input') input: LoginInput) {
    return this.authService.loginWithPassword(input);
  }

  @Mutation(() => AuthPayload)
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Complete MFA login challenge' })
  @ApiOkResponse({ description: 'Issues JWT after MFA success' })
  async completeMfaLogin(@Args('input') input: MfaVerifyInput) {
    return this.authService.completeMfaChallenge(input);
  }

  @Mutation(() => MfaEnrollmentPayload)
  @ApiOperation({ summary: 'Begin MFA enrollment' })
  @ApiOkResponse({ description: 'Returns otpauth URL + QR + backup codes' })
  async beginMfaEnrollment(@Args('input') input: MfaEnrollmentInput) {
    return this.authService.beginMfaEnrollment(input.userId);
  }

  @Mutation(() => MfaStatusPayload)
  @ApiOperation({ summary: 'Verify MFA enrollment token' })
  @ApiOkResponse({ description: 'Returns MFA status' })
  async verifyMfaEnrollment(@Args('input') input: MfaEnrollmentVerifyInput) {
    return this.authService.verifyMfaEnrollment(input);
  }
}
