import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '@geomelody/database';

import argon2 from 'argon2';

import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { UpdateAdminUserStatusDto } from '../dto/update-admin-user-status.dto';
import { UpdateAdminUserRoleDto } from '../dto/update-admin-user-role.dto';
import { AdminUsersQueryDto } from '../dto/admin-users-query.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  // ==========================================================
  // LIST ADMIN USERS
  // ==========================================================

  async findAll(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,

      role: {
        isAdmin: true,
        deletedAt: null,
        ...(query.roleId && {
          id: query.roleId,
        }),
      },

      ...(query.status !== undefined && {
        status: query.status,
      }),

      ...(query.search && {
        OR: [
          {
            email: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          },
          {
            firstName: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          },
          {
            lastName: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [users, total] =
      await this.databaseService.$transaction([
        this.databaseService.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            emailVerified: true,
            lastLoginAt: true,
            lastLoginIp: true,
            createdAt: true,
            updatedAt: true,

            role: {
              select: {
                id: true,
                code: true,
                name: true,
                isAdmin: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),

        this.databaseService.user.count({
          where,
        }),
      ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==========================================================
  // DETAILS
  // ==========================================================

  async findOne(id: string) {
    const user =
      await this.databaseService.user.findFirst({
        where: {
          id,
          deletedAt: null,
          role: {
            isAdmin: true,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          emailVerified: true,
          lastLoginAt: true,
          lastLoginIp: true,
          createdAt: true,
          updatedAt: true,

          role: {
            select: {
              id: true,
              code: true,
              name: true,
              isAdmin: true,
              status: true,
            },
          },

          loginHistory: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Admin user not found',
      );
    }

    return user;
  }

  // ==========================================================
  // CREATE
  // ==========================================================

  async create(dto: CreateAdminUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser =
      await this.databaseService.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    const role =
      await this.databaseService.role.findFirst({
        where: {
          id: dto.roleId,
          status: 1,
          isAdmin: true,
          deletedAt: null,
        },
      });

    if (!role) {
      throw new ConflictException(
        'Selected role is not an active admin role',
      );
    }

    const passwordHash =
      await argon2.hash(dto.password);

    return this.databaseService.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        roleId: role.id,
        status: 1,
        emailVerified:
          dto.emailVerified ?? false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        emailVerified: true,
        createdAt: true,

        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  async update(
    id: string,
    dto: UpdateAdminUserDto,
  ) {
    const user =
      await this.databaseService.user.findFirst({
        where: {
          id,
          deletedAt: null,
          role: {
            isAdmin: true,
            deletedAt: null,
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Admin user not found',
      );
    }

    if (dto.email) {
      const email =
        dto.email.trim().toLowerCase();

      const duplicate =
        await this.databaseService.user.findFirst({
          where: {
            email,
            NOT: {
              id,
            },
          },
        });

      if (duplicate) {
        throw new ConflictException(
          'Email already exists',
        );
      }
    }

    return this.databaseService.user.update({
      where: {
        id,
      },
      data: {
        ...(dto.email && {
          email: dto.email.trim().toLowerCase(),
        }),

        ...(dto.firstName !== undefined && {
          firstName: dto.firstName.trim(),
        }),

        ...(dto.lastName !== undefined && {
          lastName: dto.lastName.trim(),
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,

        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async updateStatus(
    id: string,
    dto: UpdateAdminUserStatusDto,
  ) {
    const user =
      await this.databaseService.user.findFirst({
        where: {
          id,
          deletedAt: null,
          role: {
            isAdmin: true,
            deletedAt: null,
          },
        },
        include: {
          role: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Admin user not found',
      );
    }

    // Never deactivate the Super Administrator role
    // through the user status endpoint.
    if (
      user.role.code === 'SUPER_ADMINISTRATOR' &&
      dto.status === 0
    ) {
      throw new ForbiddenException(
        'Super Administrator cannot be deactivated',
      );
    }

    return this.databaseService.user.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
      },
      select: {
        id: true,
        email: true,
        status: true,

        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  // ==========================================================
  // CHANGE ROLE
  // ==========================================================

  async updateRole(
    id: string,
    dto: UpdateAdminUserRoleDto,
  ) {
    const user =
      await this.databaseService.user.findFirst({
        where: {
          id,
          deletedAt: null,
          role: {
            isAdmin: true,
            deletedAt: null,
          },
        },
        include: {
          role: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Admin user not found',
      );
    }

    const newRole =
      await this.databaseService.role.findFirst({
        where: {
          id: dto.roleId,
          status: 1,
          isAdmin: true,
          deletedAt: null,
        },
      });

    if (!newRole) {
      throw new ConflictException(
        'Selected role is not an active admin role',
      );
    }

    // Protect the Super Administrator identity.
    if (
      user.role.code === 'SUPER_ADMINISTRATOR' &&
      newRole.code !== 'SUPER_ADMINISTRATOR'
    ) {
      throw new ForbiddenException(
        'Super Administrator role cannot be changed',
      );
    }

    return this.databaseService.user.update({
      where: {
        id,
      },
      data: {
        roleId: newRole.id,
      },
      select: {
        id: true,
        email: true,
        status: true,

        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  // ==========================================================
  // SOFT DELETE
  // ==========================================================

  async remove(id: string) {
    const user =
      await this.databaseService.user.findFirst({
        where: {
          id,
          deletedAt: null,
          role: {
            isAdmin: true,
            deletedAt: null,
          },
        },
        include: {
          role: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Admin user not found',
      );
    }

    if (
      user.role.code === 'SUPER_ADMINISTRATOR'
    ) {
      throw new ForbiddenException(
        'Super Administrator cannot be deleted',
      );
    }

    return this.databaseService.user.update({
      where: {
        id,
      },
      data: {
        status: 0,
        deletedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        status: true,
        deletedAt: true,
      },
    });
  }
}