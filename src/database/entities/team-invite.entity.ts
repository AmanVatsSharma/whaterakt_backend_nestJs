/**
* File: src/database/entities/team-invite.entity.ts
* Module: database
* Purpose: Invitation model for team onboarding.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Token is unique and used as invite acceptance lookup key.
* - Status tracks pending/accepted/expired invite lifecycle.
*/
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { TeamOrmEntity } from './team.entity';

@Entity({ name: 'TeamInvite' })
@Index(['token'], { unique: true })
export class TeamInviteOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  teamId: string;

  @ManyToOne(() => TeamOrmEntity, (team) => team.invites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: TeamOrmEntity;

  @Column({ type: 'varchar', length: 191 })
  email: string;

  @Column({ type: 'varchar', length: 40 })
  role: string;

  @Column({ type: 'varchar', length: 64 })
  token: string;

  @Column({ type: 'uuid', nullable: true })
  invitedByUserId?: string | null;

  @Column({ type: 'varchar', length: 40, default: 'PENDING' })
  status: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt?: Date | null;
}
