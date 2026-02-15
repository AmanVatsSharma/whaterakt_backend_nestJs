/**
* File: src/health/database.health.ts
* Module: health
* Purpose: TypeORM database health checker.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses a lightweight SELECT 1 probe on the active DataSource.
* - Returns a standard health payload with up/down status.
*/
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async isHealthy(key: string): Promise<Record<string, any>> {
    try {
      await this.dataSource.query('SELECT 1');
      return { [key]: { status: 'up' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { [key]: { status: 'down', error: message } };
    }
  }
}
