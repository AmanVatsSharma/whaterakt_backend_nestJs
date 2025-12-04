import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../base.entity';
import { TenantOrmEntity } from './tenant.entity';

@Entity({ name: 'User' })
@Index(['email'], { unique: true })
export class UserOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 180 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantOrmEntity;

  @Column({ type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  mfaSecret?: string | null;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  mfaBackupCodes: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
