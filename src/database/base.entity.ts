/**
* File: src/database/base.entity.ts
* Module: database
* Purpose: Shared TypeORM base entity for IDs and audit timestamps.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Extended by persistence entities that use UUID primary keys.
* - Keeps timestamp columns consistent across modules.
*/
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
