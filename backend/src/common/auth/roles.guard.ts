import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '../domain';
import { AuthenticatedUser } from './authenticated-user.interface';
import { ROLES_METADATA_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Insufficient role permissions. Required one of: ${requiredRoles.join(', ')}.`,
      );
    }

    return true;
  }
}
