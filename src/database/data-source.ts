/**
 * File: src/database/data-source.ts
 * Module: database
 * Purpose: TypeORM CLI datasource for migration generate/run/revert commands.
 * Author: BharatERP
 * created: 2026-02-15
 */

import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from './entities';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for TypeORM migration CLI');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [...DATABASE_ENTITIES],
  migrations: [
    join(process.cwd(), 'src', 'database', 'migrations', '*.ts'),
    join(process.cwd(), 'dist', 'database', 'migrations', '*.js'),
  ],
  logging: process.env.TYPEORM_LOGGING === 'true',
  synchronize:
    process.env.TYPEORM_SYNCHRONIZE === 'true' &&
    process.env.NODE_ENV !== 'production',
});

export default AppDataSource;
