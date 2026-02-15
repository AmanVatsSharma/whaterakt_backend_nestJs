/**
* File: src/database/entities/group.entity.ts
* Module: database
* Purpose: Contact grouping model for reusable audience segments.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Uses the legacy _ContactToGroup join-table naming for compatibility.
* - Group membership is optional and many-to-many.
*/
import { Column, CreateDateColumn, Entity, ManyToMany } from 'typeorm';
import { ContactOrmEntity } from './contact.entity';

@Entity({ name: 'Group' })
export class GroupOrmEntity {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToMany(() => ContactOrmEntity, (contact) => contact.groups)
  contacts?: ContactOrmEntity[];
}
