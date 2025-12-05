import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../database/base.entity';
import { RolePermissionEntity } from './role-permission.entity';

@Entity({ name: 'Permission' })
@Index(['resource', 'action'], { unique: true })
export class PermissionEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 120 })
  resource: string;

  @Column({ type: 'varchar', length: 120 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => RolePermissionEntity, (rp) => rp.permission)
  rolePermissions?: RolePermissionEntity[];
}
