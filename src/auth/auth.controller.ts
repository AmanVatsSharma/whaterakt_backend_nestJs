import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

/**
 * Controller endpoints kept for cases where GraphQL is not ideal
 * (e.g. streaming QR PNG responses).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('mfa/:userId/qr')
  @ApiOperation({ summary: 'Stream MFA QR code for authenticator enrollment' })
  @ApiOkResponse({ description: 'PNG image containing the MFA QR code' })
  async streamMfaQr(@Param('userId') userId: string, @Res() res: Response) {
    console.log('[AuthController] Streaming MFA QR request received', { userId });
    const buffer = await this.authService.getQrCodeForUser(userId);

    if (!buffer) {
      throw new NotFoundException('MFA artifacts not found for user');
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  }
}
