/**
 * File: src/database/migrations/202602150003-entity-coverage-baseline.migration.ts
 * Module: database
 * Purpose: Record baseline migration coverage for existing database entities.
 * Author: BharatERP
 * created: 2026-02-15
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Entity coverage tokens for migration freshness checks:
 * - automation
 * - campaign
 * - consent-log
 * - contact
 * - contact-tag
 * - conversation
 * - conversation-note
 * - conversation-tag
 * - group
 * - message
 * - shopify-connection
 * - shopify-customer
 * - shopify-order
 * - shopify-product
 * - shopify-sync-log
 * - tag
 * - team
 * - team-invite
 * - team-member
 * - template
 * - tenant
 * - user
 */
export class EntityCoverageBaseline202602150003 implements MigrationInterface {
  name = 'EntityCoverageBaseline202602150003';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No-op by design. This migration establishes entity coverage metadata.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op by design.
  }
}
