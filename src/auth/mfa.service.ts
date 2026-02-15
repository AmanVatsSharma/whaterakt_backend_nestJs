import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { LoggerService } from 'src/shared/logger.service';

/**
 * Handles multi-factor authentication lifecycle utilities such as secret generation,
 * encryption, QR rendering, and token verification.
 */
@Injectable()
export class MfaService {
  private readonly issuer = 'WhatsAppMarketing';
  private readonly encryptionKey: Buffer;
  private readonly logger = new LoggerService();

  constructor() {
    const rawKey = process.env.MFA_SECRET_KEY || process.env.JWT_SECRET || 'change-me-now';
    this.encryptionKey = createHash('sha256').update(rawKey).digest();
    this.logger.setContext(MfaService.name);
  }

  /**
   * Generates MFA enrollment artifacts: secret, QR, and backup codes.
   */
  async generateArtifacts(email: string, tenantLabel?: string) {
    this.logger.debug?.('[MfaService] Generating MFA artifacts', MfaService.name);
    try {
      const secret = authenticator.generateSecret();
      const keyUri = authenticator.keyuri(email, this.buildIssuerLabel(tenantLabel), secret);
      const qrCodeDataUrl = await QRCode.toDataURL(keyUri);
      const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      const backupCodes = this.generateBackupCodes();
      const encryptedSecret = this.encryptSecret(secret);

      return {
        secret,
        encryptedSecret,
        keyUri,
        qrCodeDataUrl,
        qrBuffer,
        backupCodes,
      };
    } catch (error) {
      this.logger.error('[MfaService] Failed to generate MFA artifacts', String(error));
      throw new InternalServerErrorException('Unable to prepare MFA enrollment assets');
    }
  }

  /**
   * Renders a QR code from an already stored/encrypted secret.
   */
  async renderQrFromSecret(email: string, encryptedSecret: string, tenantLabel?: string) {
    this.logger.debug?.('[MfaService] Rendering QR from stored secret', MfaService.name);
    const secret = this.decryptSecret(encryptedSecret);
    const keyUri = authenticator.keyuri(email, this.buildIssuerLabel(tenantLabel), secret);
    const qrCodeDataUrl = await QRCode.toDataURL(keyUri);
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    return { keyUri, qrCodeDataUrl, qrBuffer };
  }

  /**
   * Simple utility that checks a TOTP token against a secret.
   */
  verifyToken(token: string, secret: string) {
    return authenticator.check(token, secret);
  }

  /**
   * Encrypts MFA secrets with AES-256-GCM for storage.
   */
  encryptSecret(secret: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${encrypted.toString('base64')}.${authTag.toString('base64')}`;
  }

  /**
   * Decrypts previously stored MFA secrets.
   */
  decryptSecret(payload: string) {
    try {
      const [ivB64, encryptedB64, tagB64] = payload.split('.');
      const iv = Buffer.from(ivB64, 'base64');
      const encrypted = Buffer.from(encryptedB64, 'base64');
      const tag = Buffer.from(tagB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('[MfaService] Unable to decrypt MFA secret', String(error));
      throw new InternalServerErrorException('Invalid MFA secret payload');
    }
  }

  /**
   * Issues backup codes that can be used if the authenticator device is unavailable.
   */
  private generateBackupCodes() {
    return Array.from({ length: 8 }, () => randomBytes(4).toString('hex').toUpperCase());
  }

  private buildIssuerLabel(tenantLabel?: string) {
    return tenantLabel ? `${this.issuer}:${tenantLabel}` : this.issuer;
  }
}
