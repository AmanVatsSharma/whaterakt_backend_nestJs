/**
* File: src/database/database.config.ts
* Module: database
* Purpose: Shared TypeORM connection configuration.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses migration-first schema changes; synchronize stays off by default.
* - Uses a single entity registry to avoid partial metadata bootstraps.
*/
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { DATABASE_ENTITIES } from './entities';

const logger = new Logger('TypeOrmConfig');

export const buildTypeOrmConfig = (config: ConfigService): DataSourceOptions => {
  const url = config.get<string>('DATABASE_URL');
  if (!url) {
    throw new Error('DATABASE_URL is required to bootstrap TypeORM');
  }

  const loggingFlag = config.get<string>('TYPEORM_LOGGING') === 'true';
  const synchronizeFlag =
    config.get<string>('TYPEORM_SYNCHRONIZE') === 'true' &&
    process.env.NODE_ENV !== 'production';
  const migrationsRunRaw = config.get<string>('TYPEORM_MIGRATIONS_RUN');
  const migrationsRunFlag =
    migrationsRunRaw !== undefined
      ? migrationsRunRaw === 'true'
      : process.env.NODE_ENV === 'production';
  logger.log(
    `Bootstrapping TypeORM (logging=${loggingFlag}, synchronize=${synchronizeFlag}, migrationsRun=${migrationsRunFlag})`
  );

  return {
    type: 'postgres',
    url,
    synchronize: synchronizeFlag,
    logging: loggingFlag,
    entities: [...DATABASE_ENTITIES],
    migrations: [
      join(process.cwd(), 'src', 'database', 'migrations', '*.ts'),
      join(process.cwd(), 'dist', 'database', 'migrations', '*.js'),
    ],
    migrationsRun: migrationsRunFlag,
  };
};
