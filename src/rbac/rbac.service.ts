import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { UserRoleEntity } from './entities/user-role.entity';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(RoleEntity) private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity) private readonly permissionRepo: Repository<PermissionEntity>,
    @InjectRepository(UserRoleEntity) private readonly userRoleRepo: Repository<UserRoleEntity>,
  ) {}

  /**
   * Assigns a role to a user within a tenant boundary.
   */
  async assignRole(tenantId: string, userId: string, roleName: string) {
    this.logger.log(`Assigning role ${roleName} to user ${userId} in tenant ${tenantId}`);
    const role = await this.roleRepo.findOne({ where: { tenantId, name: roleName } });
    if (!role) {
      throw new Error(`Role ${roleName} not found for tenant ${tenantId}`);
    }

    const assignment = this.userRoleRepo.create({
      userId,
      roleId: role.id,
    });
    return this.userRoleRepo.save(assignment);
  }

  /**
   * Evaluates whether a user has access to a resource/action combo.
   * Future work: integrate attribute checks (campaign ownership, feature flags).
   */
  async hasAccess(userId: string, resource: string, action: string) {
    this.logger.log(`Evaluating RBAC for user=${userId} resource=${resource} action=${action}`);

    const permission = await this.permissionRepo.findOne({ where: { resource, action } });
    if (!permission) {
      return false;
    }

    const assignment = await this.userRoleRepo
      .createQueryBuilder('userRole')
      .innerJoin('userRole.role', 'role')
      .innerJoin('role.rolePermissions', 'rolePermission')
      .where('userRole.userId = :userId', { userId })
      .andWhere('rolePermission.permissionId = :permissionId', { permissionId: permission.id })
      .getOne();

    return Boolean(assignment);
  }
}
