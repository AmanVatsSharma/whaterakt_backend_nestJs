/**
* File: src/analytics/analytics.module.ts
* Module: analytics
* Purpose: Analytics module exposing tenant stats queries.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Resolver reads aggregated counts from TypeORM repositories.
* - Tenant guard enforces workspace-level visibility.
*/
import { Module } from '@nestjs/common';
import { AnalyticsResolver } from './analytics.resolver';

@Module({
  providers: [AnalyticsResolver],
})
export class AnalyticsModule {}
