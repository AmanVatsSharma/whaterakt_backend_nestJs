import { SetMetadata } from '@nestjs/common';
import { RBAC_META_KEY } from './rbac.guard';

export const RequirePermissions = (...permissions: { resource: string; action: string }[]) =>
  SetMetadata(RBAC_META_KEY, permissions);
