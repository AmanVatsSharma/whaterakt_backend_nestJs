/**
* File: src/database/entities/consent-log.entity.ts
* Module: database
* Purpose: Compliance audit model for opt-in/opt-out events.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Stores keyword-driven consent changes from webhook traffic.
* - Keeps nullable contact reference for partial webhook payloads.
*/
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ContactOrmEntity } from './contact.entity';
import { TenantOrmEntity } from './tenant.entity';

@Entity({ name: 'ConsentLog' })
export class ConsentLogOrmEntity {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.consentLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  contactId?: string | null;

  @ManyToOne(() => ContactOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contactId' })
  contact?: ContactOrmEntity | null;

  @Column({ type: 'varchar', length: 40 })
  type: string;

  @Column({ type: 'varchar', length: 40 })
  channel: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
