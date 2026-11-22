import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
  Permissions,
  PermissionsGuard,
} from '@geomelody/auth';

import { AdminUsersService } from '../services/admin-users.service';

import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { UpdateAdminUserStatusDto } from '../dto/update-admin-user-status.dto';
import { UpdateAdminUserRoleDto } from '../dto/update-admin-user-role.dto';
import { AdminUsersQueryDto } from '../dto/admin-users-query.dto';

@Controller('api/v1/admin/users')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
  ) {}

  @Get()
  @Permissions('USER_VIEW')
  async findAll(
    @Query() query: AdminUsersQueryDto,
  ) {
    return this.adminUsersService.findAll(query);
  }

  @Get(':id')
  @Permissions('USER_VIEW')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.adminUsersService.findOne(id);
  }

  @Post()
  @Permissions('USER_CREATE')
  async create(
    @Body() dto: CreateAdminUserDto,
  ) {
    return this.adminUsersService.create(dto);
  }

  @Patch(':id')
  @Permissions('USER_UPDATE')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminUsersService.update(
      id,
      dto,
    );
  }

  @Patch(':id/status')
  @Permissions('USER_STATUS_UPDATE')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserStatusDto,
  ) {
    return this.adminUsersService.updateStatus(
      id,
      dto,
    );
  }

  @Patch(':id/role')
  @Permissions('USER_ROLE_UPDATE')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserRoleDto,
  ) {
    return this.adminUsersService.updateRole(
      id,
      dto,
    );
  }

  

  @Delete(':id')
  @Permissions('USER_DELETE')
  async remove(
    @Param('id') id: string,
  ) {
    return this.adminUsersService.remove(id);
  }
}