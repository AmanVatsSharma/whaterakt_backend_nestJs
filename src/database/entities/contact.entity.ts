/**
* File: src/database/entities/contact.entity.ts
* Module: database
* Purpose: Contact persistence model for tenant-scoped recipients.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Enforces tenant + phone uniqueness for webhook upsert flows.
* - Connects contacts with groups, tags, conversations, and consent logs.
*/
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ContactTagOrmEntity } from './contact-tag.entity';
import { ConversationOrmEntity } from './conversation.entity';
import { GroupOrmEntity } from './group.entity';
import { TenantOrmEntity } from './tenant.entity';
import { UserOrmEntity } from './user.entity';

@Entity({ name: 'Contact' })
@Index(['tenantId', 'phone'], { unique: true })
export class ContactOrmEntity {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  firstName?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  lastName?: string | null;

  @Column({ type: 'boolean', default: true })
  subscribed: boolean;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.contacts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.contacts, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: TenantOrmEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToMany(() => GroupOrmEntity, (group) => group.contacts)
  @JoinTable({
    name: '_ContactToGroup',
    joinColumn: { name: 'A', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'B', referencedColumnName: 'id' },
  })
  groups?: GroupOrmEntity[];

  @OneToMany(() => ContactTagOrmEntity, (contactTag) => contactTag.contact)
  tags?: ContactTagOrmEntity[];

  @OneToMany(() => ConversationOrmEntity, (conversation) => conversation.contact)
  conversations?: ConversationOrmEntity[];
}
