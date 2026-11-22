import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { DatabaseService } from '@geomelody/database';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredPermissions ||
      requiredPermissions.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'User context not found',
      );
    }

    if (!user.role) {
      throw new ForbiddenException(
        'User role not found',
      );
    }

    const role =
      await this.databaseService.role.findUnique({
        where: {
          code: user.role,
        },
      });

    if (!role) {
      throw new ForbiddenException(
        'Role not found',
      );
    }

    if (role.status !== 1) {
      throw new ForbiddenException(
        'Role is inactive',
      );
    }

    const rolePermissions =
      await this.databaseService.rolePermission.findMany({
        where: {
          roleId: role.id,
        },
        include: {
          permission: true,
        },
      });

    const userPermissions =
      new Set(
        rolePermissions
          .filter(
            ({ permission }) =>
              permission.status === 1 &&
              permission.deletedAt === null,
          )
          .map(
            ({ permission }) =>
              permission.code,
          ),
      );

    const hasAllPermissions =
      requiredPermissions.every(
        (permission) =>
          userPermissions.has(permission),
      );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'Insufficient permissions',
      );
    }

    return true;
  }
}