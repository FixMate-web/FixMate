import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../domain';

export const ROLES_METADATA_KEY = 'fixmate_required_roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_METADATA_KEY, roles);
