/**
* File: src/auth/auth.service.ts
* Module: auth
* Purpose: Authentication and MFA service using TypeORM persistence.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Signup flow uses a transaction for tenant + user creation consistency.
* - MFA challenge storage prefers Redis and falls back to in-memory cache.
*/
import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Redis } from 'ioredis';
import { DataSource } from 'typeorm';
import { MetricsService } from '../metrics/metrics.service';
import { seedRbacDefaults } from '../rbac/rbac.seed';
import { RbacService } from '../rbac/rbac.service';
import { TenantService } from '../tenant/tenant.service';
import { TenantOrmEntity, UserOrmEntity } from '../database/entities';
import { LoginInput } from './dto/login.input';
import { MfaEnrollmentVerifyInput } from './dto/mfa-enroll-verify.input';
import { MfaVerifyInput } from './dto/mfa-verify.input';
import { SignupInput } from './dto/signup.input';
import { AuthPayload, MfaEnrollmentPayload, MfaStatusPayload, RegisteredUserPayload } from './entities/auth.entity';
import { MfaService } from './mfa.service';

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
  private readonly logger = new Logger(AuthService.name);
  private readonly CHALLENGE_TTL_MS = 1000 * 60 * 5;
  private readonly inMemoryChallenges = new Map<string, ChallengeRecord>();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private jwtService: JwtService,
    private tenantService: TenantService,
    private readonly metrics: MetricsService,
    private readonly mfaService: MfaService,
    private readonly rbacService: RbacService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis | null
  ) {}

  /**
   * Registers a tenant owner without issuing a session.
   */
  async registerTenantOwner(input: SignupInput): Promise<RegisteredUserPayload> {
    this.logger.log(`registerTenantOwner start for ${input.email}`);
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
    this.logger.log(`registerAndLogin requested for ${input.email}`);
    const user = await this.createTenantOwner(input.email, input.password, input.tenantName);
    this.metrics.incrementAuthEvent('register');
    this.metrics.incrementAuthEvent('login');
    return this.buildAuthPayload(user);
  }

  /**
   * Standard username/password login with optional MFA challenge issuance.
   */
  async loginWithPassword(input: LoginInput): Promise<AuthPayload> {
    this.logger.log(`loginWithPassword attempt for ${input.email}`);
    const userRecord = await this.dataSource.getRepository(UserOrmEntity).findOne({
      where: { email: input.email },
    });
    const user = userRecord ? this.normalizeUser(userRecord) : null;
    if (!user) {
      this.logger.warn(`loginWithPassword user not found for ${input.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) {
      this.logger.warn(`loginWithPassword invalid password for ${input.email}`);
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
    this.logger.log(`beginMfaEnrollment called for ${userId}`);
    const userRepository = this.dataSource.getRepository(UserOrmEntity);
    const userRecord = await userRepository.findOne({ where: { id: userId } });
    const user = userRecord ? this.normalizeUser(userRecord) : null;
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const tenant = await this.tenantService.findById(user.tenantId);
    const artifacts = await this.mfaService.generateArtifacts(user.email, tenant?.name);
    const hashedBackupCodes = await this.hashBackupCodes(artifacts.backupCodes);

    await userRepository.update(
      { id: userId },
      {
        mfaSecret: artifacts.encryptedSecret,
        mfaBackupCodes: hashedBackupCodes,
        mfaEnabled: false,
      },
    );

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
    this.logger.log(`verifyMfaEnrollment called for ${input.userId}`);
    const userRepository = this.dataSource.getRepository(UserOrmEntity);
    const userRecord = await userRepository.findOne({ where: { id: input.userId } });
    const user = userRecord ? this.normalizeUser(userRecord) : null;
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('User must generate secrets before verification');
    }

    await this.validateMfaToken(user, input.token);
    await userRepository.update({ id: user.id }, { mfaEnabled: true });
    this.metrics.incrementAuthEvent('mfa_verified');
    return { userId: user.id, mfaEnabled: true };
  }

  /**
   * Completes an MFA login challenge using either TOTP or a backup code.
   */
  async completeMfaChallenge(input: MfaVerifyInput): Promise<AuthPayload> {
    this.logger.log(`completeMfaChallenge invoked for ${input.challengeId}`);
    if (!input.token && !input.backupCode) {
      throw new BadRequestException('Provide either a TOTP token or backup code');
    }

    const challenge = await this.consumeChallenge(input.challengeId);
    if (!challenge) {
      throw new BadRequestException('Challenge expired or invalid');
    }

    const userRecord = await this.dataSource.getRepository(UserOrmEntity).findOne({
      where: { id: challenge.userId },
    });
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
    this.logger.log(`getQrCodeForUser called for ${userId}`);
    const userRecord = await this.dataSource.getRepository(UserOrmEntity).findOne({
      where: { id: userId },
    });
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
    const userRepository = this.dataSource.getRepository(UserOrmEntity);
    const exists = await userRepository.findOne({ where: { email } });
    if (exists) {
      throw new BadRequestException('Email already registered');
    }

    const hashed = await bcrypt.hash(password, 12);
    const created = await this.dataSource.transaction(async (manager) => {
      const tenantRepository = manager.getRepository(TenantOrmEntity);
      const transactionUserRepository = manager.getRepository(UserOrmEntity);

      const tenant = await tenantRepository.save(
        tenantRepository.create({
          name: tenantName,
          description: null,
        }),
      );

      const user = await transactionUserRepository.save(
        transactionUserRepository.create({
          email,
          password: hashed,
          tenantId: tenant.id,
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: [],
        }),
      );

      return this.normalizeUser(user);
    });

    await seedRbacDefaults(this.dataSource, created.tenantId);
    await this.assignOwnerRole(created);
    return created;
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
      tenant: tenant ? (tenant as any) : undefined,
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
        await this.dataSource.getRepository(UserOrmEntity).update(
          { id: user.id },
          { mfaBackupCodes: remaining },
        );
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

  private async assignOwnerRole(user: AuthUser) {
    try {
      await this.rbacService.assignRole(user.tenantId, user.id, 'Owner');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to assign Owner role to ${user.id}: ${message}`);
    }
  }

  private normalizeUser(record: UserOrmEntity): AuthUser {
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
