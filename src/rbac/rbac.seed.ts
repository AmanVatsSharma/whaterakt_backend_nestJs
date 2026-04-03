import { DataSource } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';

export async function seedRbacDefaults(dataSource: DataSource, tenantId: string) {
  const permissionRepo = dataSource.getRepository(PermissionEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);
  const rolePermissionRepo = dataSource.getRepository(RolePermissionEntity);

  const permissionDefinitions = [
    { resource: 'campaign', action: 'publish' },
    { resource: 'campaign', action: 'read' },
    { resource: 'tenant', action: 'manage' },
    { resource: 'operator', action: 'manage' },
    { resource: 'integrations', action: 'manage' },
    { resource: 'onboarding', action: 'manage' },
  ];

  const permissions: PermissionEntity[] = [];
  for (const definition of permissionDefinitions) {
    let permission = await permissionRepo.findOne({ where: definition });
    if (!permission) {
      permission = await permissionRepo.save(permissionRepo.create(definition));
    }
    permissions.push(permission);
  }

  let ownerRole = await roleRepo.findOne({ where: { tenantId, name: 'Owner' } });
  if (!ownerRole) {
    ownerRole = await roleRepo.save(
      roleRepo.create({
        name: 'Owner',
        tenantId,
        description: 'Full access to tenant settings and campaigns',
      }),
    );

    for (const permission of permissions) {
      await rolePermissionRepo.save(
        rolePermissionRepo.create({
          roleId: ownerRole.id,
          permissionId: permission.id,
        }),
      );
    }
  }

  return ownerRole;
}
