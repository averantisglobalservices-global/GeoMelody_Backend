import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '@geomelody/database';

import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  // ==========================================================
  // LIST
  // ==========================================================

  async findAll() {
    return this.databaseService.role.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==========================================================
  // DETAILS
  // ==========================================================

  async findOne(id: string) {
    const role =
      await this.databaseService.role.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

    if (!role) {
      throw new NotFoundException(
        'Role not found',
      );
    }

    return role;
  }

  // ==========================================================
  // CREATE
  // ==========================================================

  async create(dto: CreateRoleDto) {
    const code = dto.code
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');

    const existingRole =
      await this.databaseService.role.findUnique({
        where: {
          code,
        },
      });

    if (existingRole) {
      throw new ConflictException(
        'Role code already exists',
      );
    }

    return this.databaseService.role.create({
      data: {
        name: dto.name.trim(),
        code,
        description: dto.description?.trim(),
        isAdmin: dto.isAdmin ?? false,
        status: 1,
        isSystem: false,
      },
    });
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  async update(
    id: string,
    dto: UpdateRoleDto,
  ) {
    const role =
      await this.databaseService.role.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!role) {
      throw new NotFoundException(
        'Role not found',
      );
    }

    // System roles cannot change name.
    if (
      role.isSystem &&
      dto.name !== undefined &&
      dto.name.trim() !== role.name
    ) {
      throw new ForbiddenException(
        'System role name cannot be changed',
      );
    }

    return this.databaseService.role.update({
      where: {
        id: role.id,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name.trim(),
        }),

        ...(dto.description !== undefined && {
          description: dto.description.trim(),
        }),

        ...(dto.isAdmin !== undefined && {
          isAdmin: dto.isAdmin,
        }),
      },
    });
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async updateStatus(
    id: string,
    status: number,
  ) {
    const role =
      await this.databaseService.role.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!role) {
      throw new NotFoundException(
        'Role not found',
      );
    }

    // Never deactivate Super Administrator.
    if (
      role.code === 'SUPER_ADMINISTRATOR' &&
      status === 0
    ) {
      throw new ForbiddenException(
        'Super Administrator role cannot be deactivated',
      );
    }

    return this.databaseService.role.update({
      where: {
        id: role.id,
      },
      data: {
        status,
      },
    });
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async remove(id: string) {
    const role =
      await this.databaseService.role.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

    if (!role) {
      throw new NotFoundException(
        'Role not found',
      );
    }

    // System roles cannot be deleted.
    if (role.isSystem) {
      throw new ForbiddenException(
        'System role cannot be deleted',
      );
    }

    // Do not delete a role assigned to users.
    if (role._count.users > 0) {
      throw new ConflictException(
        'Role is assigned to users and cannot be deleted',
      );
    }

    // Soft delete.
    return this.databaseService.role.update({
      where: {
        id: role.id,
      },
      data: {
        deletedAt: new Date(),
        status: 0,
      },
    });
  }
}