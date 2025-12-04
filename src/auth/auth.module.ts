import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { PrismaService } from 'src/prisma.service';
import { TenantModule } from '../tenant/tenant.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AuthController } from './auth.controller';
import { MfaService } from './mfa.service';

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
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService, AuthResolver, MfaService],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
