/**
* File: src/database/database.module.ts
* Module: database
* Purpose: Global TypeORM module wiring for the backend.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Exposes DataSource/EntityManager to all feature modules.
* - Keeps DB bootstrap centralized and framework-native.
*/
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmConfig } from './database.config';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmConfig(config),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
