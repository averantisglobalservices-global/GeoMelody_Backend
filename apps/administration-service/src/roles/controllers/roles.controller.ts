import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
} from '@geomelody/auth';

import { RolesService } from '../services/roles.service';

import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UpdateRoleStatusDto } from '../dto/update-role-status.dto';

@Controller('api/v1/admin/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
  ) {}

  @Get()
  @Permissions('ROLE_VIEW')
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Permissions('ROLE_VIEW')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @Permissions('ROLE_CREATE')
  async create(
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  @Permissions('ROLE_UPDATE')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, dto);
  }

  @Patch(':id/status')
  @Permissions('ROLE_STATUS_UPDATE')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRoleStatusDto,
  ) {
    return this.rolesService.updateStatus(
      id,
      dto.status,
    );
  }

  @Delete(':id')
  @Permissions('ROLE_DELETE')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}