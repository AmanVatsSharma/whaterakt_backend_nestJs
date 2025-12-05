import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantService } from '../tenant/tenant.service';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcryptjs';
import { MetricsService } from '../metrics/metrics.service';
import { MfaService } from './mfa.service';
import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';
import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload, RegisteredUserPayload, MfaEnrollmentPayload, MfaStatusPayload } from './entities/auth.entity';
import { MfaVerifyInput } from './dto/mfa-verify.input';
import { MfaEnrollmentVerifyInput } from './dto/mfa-enroll-verify.input';
import { ConfigService } from '@nestjs/config';
import { UserWriteRepository } from '../database/repositories/user-write.repository';
import { RbacService } from '../rbac/rbac.service';

type ChallengeRecord = {
  userId: string;
  tenantId: string;
  email: string;
  expiresAt: number;
};

type AuthUser = {
  id: string;
  email: string;
  password: string;
  tenantId: string;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaBackupCodes: string[];
  phone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class AuthService {
  private readonly CHALLENGE_TTL_MS = 1000 * 60 * 5;
  private readonly inMemoryChallenges = new Map<string, ChallengeRecord>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tenantService: TenantService,
    private readonly metrics: MetricsService,
    private readonly mfaService: MfaService,
    private readonly configService: ConfigService,
    private readonly userWriteRepository: UserWriteRepository,
    private readonly rbacService: RbacService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis | null
  ) {}

  /**
   * Registers a tenant owner without issuing a session.
   */
  async registerTenantOwner(input: SignupInput): Promise<RegisteredUserPayload> {
    console.log('[AuthService] registerTenantOwner start', { email: input.email });
    const user = await this.createTenantOwner(input.email, input.password, input.tenantName);
    this.metrics.incrementAuthEvent('register');
    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
    };
  }

  /**
   * Registers and logs in the user in a single mutation.
   * TODO: Plug OTP validation before allowing auto-login once SMS/email OTP providers are wired.
   */
  async registerAndLogin(input: SignupInput): Promise<AuthPayload> {
    console.log('[AuthService] registerAndLogin requested', { email: input.email });
    const user = await this.createTenantOwner(input.email, input.password, input.tenantName);
    this.metrics.incrementAuthEvent('register');
    this.metrics.incrementAuthEvent('login');
    return this.buildAuthPayload(user);
  }

  /**
   * Standard username/password login with optional MFA challenge issuance.
   */
  async loginWithPassword(input: LoginInput): Promise<AuthPayload> {
    console.log('[AuthService] loginWithPassword attempt', { email: input.email });
    const userRecord = await this.prisma.user.findUnique({ where: { email: input.email } });
    const user = userRecord ? this.normalizeUser(userRecord) : null;
    if (!user) {
      console.warn('[AuthService] loginWithPassword user not found', { email: input.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) {
      console.warn('[AuthService] loginWithPassword invalid password', { email: input.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled) {
      const challenge = await this.createMfaChallenge(user);
      this.metrics.incrementAuthEvent('mfa_challenge');
      return {
        mfaRequired: true,
        challengeId: challenge.id,
        challengeExpiresAt: new Date(challenge.expiresAt).toISOString(),
      };
    }

    this.metrics.incrementAuthEvent('login');
    return this.buildAuthPayload(user);
  }

  /**
   * Begins MFA enrollment and persists encrypted secrets plus hashed backup codes.
   */
  async beginMfaEnrollment(userId: string): Promise<MfaEnrollmentPayload> {
    console.log('[AuthService] beginMfaEnrollment called', { userId });
    const userRecord = await this.prisma.user.findUnique({ where: { id: userId } });
    const user = userRecord ? this.normalizeUser(userRecord) : null;
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const tenant = await this.tenantService.findById(user.tenantId);
    const artifacts = await this.mfaService.generateArtifacts(user.email, tenant?.name);
    const hashedBackupCodes = await this.hashBackupCodes(artifacts.backupCodes);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: artifacts.encryptedSecret,
        mfaBackupCodes: hashedBackupCodes,
        mfaEnabled: false,
      },
    });
    await this.mirrorUser(this.normalizeUser(updated));

    return {
      otpauthUrl: artifacts.keyUri,
      qrCodeDataUrl: artifacts.qrCodeDataUrl,
      backupCodes: artifacts.backupCodes,
    };
  }

  /**
   * Verifies an enrollment token to mark MFA as enabled for a user.
   */
  async verifyMfaEnrollment(input: MfaEnrollmentVerifyInput): Promise<MfaStatusPayload> {
    console.log('[AuthService] verifyMfaEnrollment called', { userId: input.userId });
    const userRecord = await this.prisma.user.findUnique({ where: { id: input.userId } });
    const user = userRecord ? this.normalizeUser(userRecord) : null;
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('User must generate secrets before verification');
    }

    await this.validateMfaToken(user, input.token);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true },
    });
    this.metrics.incrementAuthEvent('mfa_verified');

    await this.mirrorUser(this.normalizeUser(updated));
    return { userId: user.id, mfaEnabled: true };
  }

  /**
   * Completes an MFA login challenge using either TOTP or a backup code.
   */
  async completeMfaChallenge(input: MfaVerifyInput): Promise<AuthPayload> {
    console.log('[AuthService] completeMfaChallenge invoked', { challengeId: input.challengeId });
    if (!input.token && !input.backupCode) {
      throw new BadRequestException('Provide either a TOTP token or backup code');
    }

    const challenge = await this.consumeChallenge(input.challengeId);
    if (!challenge) {
      throw new BadRequestException('Challenge expired or invalid');
    }

    const userRecord = await this.prisma.user.findUnique({ where: { id: challenge.userId } });
    const user = userRecord ? this.normalizeUser(userRecord) : null;
    if (!user) {
      throw new BadRequestException('User no longer exists');
    }

    if (input.backupCode) {
      await this.validateBackupCode(user, input.backupCode);
    } else if (input.token) {
      await this.validateMfaToken(user, input.token);
    }

    this.metrics.incrementAuthEvent('mfa_verified');
    return this.buildAuthPayload(user);
  }

  /**
   * Provides a PNG buffer of the stored MFA QR (controller uses this to stream binary).
   */
  async getQrCodeForUser(userId: string): Promise<Buffer | null> {
    console.log('[AuthService] getQrCodeForUser called', { userId });
    const userRecord = await this.prisma.user.findUnique({ where: { id: userId } });
    const user = userRecord ? this.normalizeUser(userRecord) : null;
    if (!user || !user.mfaSecret) {
      return null;
    }

    const tenant = await this.tenantService.findById(user.tenantId);
    const result = await this.mfaService.renderQrFromSecret(user.email, user.mfaSecret, tenant?.name);
    return result.qrBuffer;
  }

  /**
   * Shared helper that creates the tenant + user row transactionally.
   */
  private async createTenantOwner(email: string, password: string, tenantName: string): Promise<AuthUser> {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new BadRequestException('Email already registered');
    }

    const tenant = await this.tenantService.createTenant({ name: tenantName });
    const hashed = await bcrypt.hash(password, 12);

    const created = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        tenantId: tenant.id,
      },
    });
    const normalized = this.normalizeUser(created);
    await this.mirrorUser(normalized);
    await this.assignOwnerRole(normalized);
    return normalized;
  }

  /**
   * Builds a JWT + tenant payload consumed by resolvers.
   */
  private async buildAuthPayload(user: AuthUser): Promise<AuthPayload> {
    const tenant = await this.tenantService.findById(user.tenantId);
    const payload = {
      email: user.email,
      sub: user.id,
      tenantId: user.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      tenant,
      mfaRequired: false,
    };
  }

  /**
   * Stores a challenge in Redis when available, falling back to memory if needed.
   */
  private async createMfaChallenge(user: AuthUser) {
    const challengeId = randomUUID();
    const record: ChallengeRecord = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      expiresAt: Date.now() + this.CHALLENGE_TTL_MS,
    };

    await this.persistChallenge(challengeId, record);
    return { id: challengeId, expiresAt: record.expiresAt };
  }

  private async persistChallenge(challengeId: string, record: ChallengeRecord) {
    if (this.redis) {
      await this.redis.set(
        this.challengeKey(challengeId),
        JSON.stringify(record),
        'PX',
        this.CHALLENGE_TTL_MS,
      );
      return;
    }

    this.inMemoryChallenges.set(challengeId, record);
    setTimeout(() => this.inMemoryChallenges.delete(challengeId), this.CHALLENGE_TTL_MS);
  }

  private async consumeChallenge(challengeId: string): Promise<ChallengeRecord | null> {
    if (this.redis) {
      const raw = await this.redis.get(this.challengeKey(challengeId));
      if (!raw) {
        return null;
      }
      await this.redis.del(this.challengeKey(challengeId));
      const record = JSON.parse(raw) as ChallengeRecord;
      if (Date.now() > record.expiresAt) {
        return null;
      }
      return record;
    }

    const record = this.inMemoryChallenges.get(challengeId);
    this.inMemoryChallenges.delete(challengeId);
    if (!record || Date.now() > record.expiresAt) {
      return null;
    }
    return record;
  }

  private challengeKey(id: string) {
    return `auth:mfa:challenge:${id}`;
  }

  private async hashBackupCodes(codes: string[]) {
    return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
  }

  private async validateBackupCode(user: AuthUser, providedCode: string) {
    const hashes = user.mfaBackupCodes || [];
    for (let i = 0; i < hashes.length; i++) {
      const matches = await bcrypt.compare(providedCode, hashes[i]);
      if (matches) {
        const remaining = hashes.filter((_, idx) => idx !== i);
        const updated = await this.prisma.user.update({
          where: { id: user.id },
          data: { mfaBackupCodes: remaining },
        });
        await this.mirrorUser(this.normalizeUser(updated));
        return;
      }
    }
    throw new BadRequestException('Backup code invalid or already used');
  }

  private async validateMfaToken(user: AuthUser, token?: string) {
    if (!user.mfaSecret) {
      throw new BadRequestException('User missing MFA secret');
    }

    if (!token) {
      throw new BadRequestException('MFA token required');
    }

    const secret = this.mfaService.decryptSecret(user.mfaSecret);
    const isValid = this.mfaService.verifyToken(token, secret);
    if (!isValid) {
      throw new BadRequestException('Invalid MFA token');
    }
  }

  private isDualWriteEnabled() {
    return this.configService.get('TYPEORM_DUAL_WRITE_ENABLED') === 'true';
  }

  private async mirrorUser(user: AuthUser) {
    if (!this.isDualWriteEnabled()) {
      return;
    }
    try {
      await this.userWriteRepository.upsertFromPrisma({
        id: user.id,
        email: user.email,
        password: user.password,
        tenantId: user.tenantId,
        phone: user.phone ?? null,
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret,
        mfaBackupCodes: user.mfaBackupCodes,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error('[AuthService] Failed to dual-write user', { userId: user.id, error });
      this.metrics.incrementDualWriteFailure('user');
    }
  }

  private async assignOwnerRole(user: AuthUser) {
    if (!this.isDualWriteEnabled()) {
      return;
    }
    try {
      await this.rbacService.assignRole(user.tenantId, user.id, 'Owner');
    } catch (error) {
      console.error('[AuthService] Failed to assign Owner role', { userId: user.id, error });
      this.metrics.incrementDualWriteFailure('user');
    }
  }

  private normalizeUser(record: any): AuthUser {
    return {
      id: record.id,
      email: record.email,
      password: record.password,
      tenantId: record.tenantId,
      mfaEnabled: Boolean(record.mfaEnabled),
      mfaSecret: record.mfaSecret ?? null,
      mfaBackupCodes: record.mfaBackupCodes ?? [],
      phone: record.phone ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
