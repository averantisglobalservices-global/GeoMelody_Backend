import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { StorageService } from '@geomelody/storage';

import {
  JwtAuthGuard,
  Permissions,
  PermissionsGuard,           
} from '@geomelody/auth';

//import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { PermissionsGuard } from '../../auth/guards/permissions.guard';
// import { Permissions } from '../../auth/decorators/permissions.decorator';

import { CreateArtistRoleDto } from '../dto/create-artist-role.dto';
import { UpdateArtistRoleDto } from '../dto/update-artist-role.dto';
import { UpdateArtistRoleStatusDto } from '../dto/update-artist-role-status.dto';
import { ArtistRolesService } from '../services/artist-roles.service';

@Controller('api/v1/admin/artist-roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ArtistRolesController {
  constructor(
    private readonly artistRolesService: ArtistRolesService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get all artist roles
   */
  @Get()
  @Permissions('ARTIST_ROLE_VIEW')
  async findAll() {
    const artistRoles =
      await this.artistRolesService.findAll();

    return artistRoles.map((artistRole) => ({
      ...artistRole,
      image: artistRole.image
        ? this.storageService.getUrl(
            artistRole.image,
          )
        : null,
    }));
  }

  /**
   * Get one artist role
   */
  @Get(':id')
  @Permissions('ARTIST_ROLE_VIEW')
  async findOne(
    @Param('id') id: string,
  ) {
    const artistRole =
      await this.artistRolesService.findOne(id);

    return {
      ...artistRole,
      image: artistRole.image
        ? this.storageService.getUrl(
            artistRole.image,
          )
        : null,
    };
  }

  /**
   * Create artist role
   *
   * multipart/form-data:
   * name
   * code
   * sortOrder
   * image
   */
  @Post()
  @Permissions('ARTIST_ROLE_CREATE')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async create(
    @Body() dto: CreateArtistRoleDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageKey: string | undefined;

    /**
     * Upload image through StorageService.
     */
    if (file) {
      imageKey =
        await this.storageService.upload(
          file,
          'artist-roles',
        );
    }

    try {
      const artistRole =
        await this.artistRolesService.create(
          dto,
          imageKey,
        );

      return {
        ...artistRole,
        image: artistRole.image
          ? this.storageService.getUrl(
              artistRole.image,
            )
          : null,
      };
    } catch (error) {
      /**
       * If DB creation fails after the image
       * was uploaded, clean up the new file.
       */
      if (imageKey) {
        await this.storageService.delete(
          imageKey,
        );
      }

      throw error;
    }
  }

  /**
   * Update artist role
   *
   * multipart/form-data:
   * name
   * code
   * sortOrder
   * image
   */
  @Patch(':id')
  @Permissions('ARTIST_ROLE_UPDATE')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArtistRoleDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageKey: string | undefined;

    /**
     * Upload the new image first.
     */
    if (file) {
      imageKey =
        await this.storageService.upload(
          file,
          'artist-roles',
        );
    }

    try {
      const artistRole =
        await this.artistRolesService.update(
          id,
          dto,
          imageKey,
        );

      return {
        ...artistRole,
        image: artistRole.image
          ? this.storageService.getUrl(
              artistRole.image,
            )
          : null,
      };
    } catch (error) {
      /**
       * If DB update fails after uploading the
       * new image, remove the new file.
       */
      if (imageKey) {
        await this.storageService.delete(
          imageKey,
        );
      }

      throw error;
    }
  }

  /**
   * Activate / deactivate artist role
   *
   * status:
   * 1 = active
   * 0 = inactive
   */
  @Patch(':id/status')
  @Permissions('ARTIST_ROLE_STATUS_UPDATE')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateArtistRoleStatusDto,
  ) {
    return this.artistRolesService.updateStatus(
      id,
      dto.status,
    );
  }

  /**
   * Soft delete artist role
   */
  @Delete(':id')
  @Permissions('ARTIST_ROLE_DELETE')
  async remove(
    @Param('id') id: string,
  ) {
    return this.artistRolesService.remove(id);
  }
}