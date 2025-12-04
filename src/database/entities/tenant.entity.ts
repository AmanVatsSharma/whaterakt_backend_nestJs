import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { UserOrmEntity } from './user.entity';

/**
 * Mirrors the Prisma Tenant model but is optimized for the TypeORM flow.
 * Having this entity early lets us dual-write during the migration window.
 */
@Entity({ name: 'Tenant' })
@Index(['name'], { unique: true })
export class TenantOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 64, default: 'standard' })
  plan: string;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 64, default: 'global' })
  region: string;

  @Column({ type: 'jsonb', nullable: true })
  featureFlags?: Record<string, boolean>;

  @OneToMany(() => UserOrmEntity, (user) => user.tenant)
  users?: UserOrmEntity[];
}
