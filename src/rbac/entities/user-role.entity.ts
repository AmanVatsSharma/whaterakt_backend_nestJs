import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../database/base.entity';
import { RoleEntity } from './role.entity';
import { UserOrmEntity } from '../../database/entities/user.entity';

@Entity({ name: 'UserRole' })
@Unique(['userId', 'roleId'])
export class UserRoleEntity extends BaseOrmEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;

  @ManyToOne(() => RoleEntity, (role) => role.userAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: RoleEntity;

  @Column({ type: 'jsonb', nullable: true })
  constraints?: Record<string, any>;
}
