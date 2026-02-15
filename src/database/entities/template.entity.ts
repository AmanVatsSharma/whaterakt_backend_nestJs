/**
* File: src/database/entities/template.entity.ts
* Module: database
* Purpose: WhatsApp template metadata persisted per tenant/user.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Template ID is a string because provider IDs are not always UUIDs.
* - Status/category mirror WhatsApp template lifecycle concepts.
*/
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantOrmEntity } from './tenant.entity';
import { UserOrmEntity } from './user.entity';

export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
}

export enum TemplateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'Template' })
export class TemplateOrmEntity {
  @Column({ type: 'varchar', length: 191, primary: true })
  id: string;

  @Column({ type: 'varchar', length: 191 })
  name: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: TemplateCategory, default: TemplateCategory.MARKETING })
  category: TemplateCategory;

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.APPROVED })
  status: TemplateStatus;

  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => UserOrmEntity, (user) => user.templates, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: UserOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.templates, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: TenantOrmEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
