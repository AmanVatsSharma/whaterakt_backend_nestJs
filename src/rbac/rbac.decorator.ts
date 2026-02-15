import { SetMetadata } from '@nestjs/common';
import { RBAC_META_KEY } from './rbac.guard';

export interface RbacPermissionRequirement {
  resource: string;
  action: string;
  requiredPlan?: string;
}

export const RequirePermissions = (...permissions: RbacPermissionRequirement[]) =>
  SetMetadata(RBAC_META_KEY, permissions);
