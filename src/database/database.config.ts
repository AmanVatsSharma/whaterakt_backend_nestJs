import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DataSourceOptions } from 'typeorm';
import { TenantOrmEntity } from './entities/tenant.entity';
import { UserOrmEntity } from './entities/user.entity';

const logger = new Logger('TypeOrmConfig');

/**
 * Centralizes TypeORM configuration so multiple modules (DatabaseModule,
 * CLI scripts, workers) reuse the exact same connection recipe.
 */
export const buildTypeOrmConfig = (config: ConfigService): DataSourceOptions => {
  const url = config.get<string>('DATABASE_URL');
  if (!url) {
    throw new Error('DATABASE_URL is required to bootstrap TypeORM');
  }

  const loggingFlag = config.get<string>('TYPEORM_LOGGING') === 'true';
  logger.log(`Bootstrapping TypeORM (logging=${loggingFlag})`);

  return {
    type: 'postgres',
    url,
    synchronize: false,
    logging: loggingFlag,
    entities: [TenantOrmEntity, UserOrmEntity],
    migrationsRun: false,
  };
};
