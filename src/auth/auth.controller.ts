/**
* File: src/auth/auth.controller.ts
* Module: auth
* Purpose: HTTP endpoints for auth operations not ideal in GraphQL.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Exposes QR streaming endpoint for MFA enrollment UX.
* - Delegates all security/business checks to AuthService.
*/
import { Body, Controller, Get, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/**
 * Controller endpoints kept for cases where GraphQL is not ideal
 * (e.g. streaming QR PNG responses).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset token for an email' })
  @ApiOkResponse({ description: 'Always returns generic success payload' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a one-time token' })
  @ApiOkResponse({ description: 'Returns success once password is updated' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPasswordWithToken(body.token, body.password);
  }

  @Get('mfa/:userId/qr')
  @ApiOperation({ summary: 'Stream MFA QR code for authenticator enrollment' })
  @ApiOkResponse({ description: 'PNG image containing the MFA QR code' })
  async streamMfaQr(@Param('userId') userId: string, @Res() res: Response) {
    const buffer = await this.authService.getQrCodeForUser(userId);

    if (!buffer) {
      throw new NotFoundException('MFA artifacts not found for user');
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  }
}
