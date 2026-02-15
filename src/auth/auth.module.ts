/**
* File: src/auth/auth.module.ts
* Module: auth
* Purpose: Authentication module wiring JWT, MFA, and auth resolvers.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses TypeORM-backed services for user/tenant authentication.
* - Exposes JWT strategy for guards used across modules.
*/
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { TenantModule } from '../tenant/tenant.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AuthController } from './auth.controller';
import { MfaService } from './mfa.service';
import { DatabaseModule } from '../database/database.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    TenantModule,
    MetricsModule,
    DatabaseModule,
    RbacModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthResolver, MfaService],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
