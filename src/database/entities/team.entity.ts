/**
* File: src/database/entities/team.entity.ts
* Module: database
* Purpose: Team workspace model for tenant-level onboarding flows.
* Author: Aman Sharma / Vedpragya/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Team names are unique inside a tenant.
* - Related invites/members support onboarding lifecycle operations.
*/
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { TeamInviteOrmEntity } from './team-invite.entity';
import { TeamMemberOrmEntity } from './team-member.entity';

@Entity({ name: 'Team' })
@Index(['tenantId', 'name'], { unique: true })
export class TeamOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => TeamInviteOrmEntity, (invite) => invite.team)
  invites?: TeamInviteOrmEntity[];

  @OneToMany(() => TeamMemberOrmEntity, (member) => member.team)
  members?: TeamMemberOrmEntity[];
}
