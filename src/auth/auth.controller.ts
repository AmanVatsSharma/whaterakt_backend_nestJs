/**
* File: src/auth/auth.controller.ts
* Module: auth
* Purpose: HTTP endpoints for auth operations not ideal in GraphQL.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Exposes QR streaming endpoint for MFA enrollment UX.
* - Delegates all security/business checks to AuthService.
*/
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RestAuthGuard } from '../core/guards/rest-auth.guard';
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
  @UseGuards(RestAuthGuard)
  @ApiOperation({ summary: 'Stream MFA QR code for authenticator enrollment' })
  @ApiOkResponse({ description: 'PNG image containing the MFA QR code' })
  async streamMfaQr(
    @Param('userId') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authed = (req as Request & {
      user?: { userId?: string; sub?: string };
    }).user;
    const subject = authed?.userId || authed?.sub;
    if (!subject || subject !== userId) {
      throw new ForbiddenException(
        'Cannot access MFA enrollment for another user',
      );
    }

    const buffer = await this.authService.getQrCodeForUser(userId);

    if (!buffer) {
      throw new NotFoundException('MFA artifacts not found for user');
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  }
}
