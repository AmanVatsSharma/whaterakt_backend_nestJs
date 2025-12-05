import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../database/base.entity';
import { TenantOrmEntity } from '../../database/entities/tenant.entity';
import { RolePermissionEntity } from './role-permission.entity';
import { UserRoleEntity } from './user-role.entity';

@Entity({ name: 'Role' })
@Index(['tenantId', 'name'], { unique: true })
export class RoleEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantOrmEntity;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => RolePermissionEntity, (rp) => rp.role)
  rolePermissions?: RolePermissionEntity[];

  @OneToMany(() => UserRoleEntity, (ur) => ur.role)
  userAssignments?: UserRoleEntity[];
}
