import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { ArtistProfileService } from '../../services/artist-profile.service';

import { UpdateArtistIdentityDto } from '../../dto/update-artist-identity.dto';
import { UpdateArtistGenresDto } from '../../dto/update-artist-genres.dto';
import { UpdateArtistRolesDto } from '../../dto/update-artist-roles.dto';
import { UpdateArtistInstrumentsDto } from '../../dto/update-artist-instruments.dto';
import { UpdateArtistSocialDto } from '../../dto/update-artist-social.dto';

import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@geomelody/auth';

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email?: string;
    role?: string;
  };
};

type ArtistVisualFiles = {
  artistCoverPicture?: Express.Multer.File[];
  profilePicture?: Express.Multer.File[];
  artistLogo?: Express.Multer.File[];
};

@Controller('artist/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ARTIST')
export class ArtistProfileController {
  constructor(
    private readonly artistProfileService: ArtistProfileService,
  ) {}

  /** Get complete artist profile. */
  @Get()
  async getProfile(@Req() request: AuthenticatedRequest) {
    return this.artistProfileService.getProfile(request.user.sub);
  }

  /** Update artist type, stage name and bio. */
  @Patch('identity')
  async updateArtistIdentity(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateArtistIdentityDto,
  ) {
    return this.artistProfileService.updateArtistIdentity(
      request.user.sub,
      dto,
    );
  }

  /** Update "I Like to Sing" genres. */
  @Patch('genres')
  async updateGenres(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateArtistGenresDto,
  ) {
    return this.artistProfileService.updateGenres(
      request.user.sub,
      dto.genreIds,
    );
  }

  /** Update "I am also" roles (Solo Artist only). */
  @Patch('roles')
  async updateArtistRoles(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateArtistRolesDto,
  ) {
    return this.artistProfileService.updateArtistRoles(
      request.user.sub,
      dto.artistRoleIds,
    );
  }

  /** Update "I Like to Play" instruments (Solo Artist only). */
  @Patch('instruments')
  async updateInstruments(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateArtistInstrumentsDto,
  ) {
    return this.artistProfileService.updateInstruments(
      request.user.sub,
      dto.instrumentIds,
    );
  }

  /**
   * Update Band Members (Music Band only).
   *
   * multipart/form-data:
   * members = JSON string array. Existing members may include id.
   * memberPicture_0 = picture for members[0]
   * memberPicture_1 = picture for members[1]
   * ...
   */
  @Patch('band-members')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage(),
      limits: {
        files: 20,
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  async updateBandMembers(
    @Req() request: AuthenticatedRequest,
    @Body('members') members: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.artistProfileService.updateBandMembersWithPictures(
      request.user.sub,
      members,
      files ?? [],
    );
  }

  /**
   * Update Visual Identity.
   *
   * multipart/form-data fields:
   * artistCoverPicture, profilePicture, artistLogo
   */
  @Patch('visual')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'artistCoverPicture', maxCount: 1 },
        { name: 'profilePicture', maxCount: 1 },
        { name: 'artistLogo', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          files: 3,
          fileSize: 2 * 1024 * 1024,
        },
      },
    ),
  )
  async updateVisualIdentity(
    @Req() request: AuthenticatedRequest,
    @UploadedFiles() files: ArtistVisualFiles,
  ) {
    return this.artistProfileService.updateVisualIdentity(
      request.user.sub,
      files,
    );
  }

  /** Update social presence. */
 
@Patch('social')
@UseInterceptors(
  AnyFilesInterceptor({
    storage: memoryStorage(),
    limits: {
      files: 20,
      fileSize: 2 * 1024 * 1024,
    },
  }),
)
async updateSocialProfile(
  @Req() request: AuthenticatedRequest,
  @Body() body: any,
  @UploadedFiles() files: Express.Multer.File[],
) {
  return this.artistProfileService.updateSocialProfileWithPictures(
    request.user.sub,
    body,
    files ?? [],
  );
}

}
