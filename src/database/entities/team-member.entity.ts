/**
* File: src/database/entities/team-member.entity.ts
* Module: database
* Purpose: Team membership model linking users to teams.
* Author: Aman Sharma / Novologic/ Codex
* Last-updated: 2026-02-15
* Notes:
* - Unique by team + user to prevent duplicate memberships.
* - Role/status fields support onboarding and access transitions.
*/
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { TeamOrmEntity } from './team.entity';
import { UserOrmEntity } from './user.entity';

@Entity({ name: 'TeamMember' })
@Unique(['teamId', 'userId'])
export class TeamMemberOrmEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  teamId: string;

  @ManyToOne(() => TeamOrmEntity, (team) => team.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: TeamOrmEntity;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;

  @Column({ type: 'varchar', length: 40 })
  role: string;

  @Column({ type: 'varchar', length: 40, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  joinedAt?: Date | null;
}
