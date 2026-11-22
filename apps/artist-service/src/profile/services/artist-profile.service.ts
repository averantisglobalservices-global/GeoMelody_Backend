import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '@geomelody/database';
import { StorageService } from '@geomelody/storage';

import { ArtistType } from '../../../../../generated/prisma/enums';

// import { isUUID } from 'class-validator';
import { isURL, isUUID } from 'class-validator';

type ArtistVisualFiles = {
  artistCoverPicture?: Express.Multer.File[];
  profilePicture?: Express.Multer.File[];
  artistLogo?: Express.Multer.File[];
};

type BandMemberInput = {
  id?: string;
  name: string;
  designation?: string;
};

type ProfileCompletionStep = {
  step: number;
  key: string;
  name: string;
  percentage: number;
  completed: boolean;
};

type ProfileCompletionDetails = {
  percentage: number;
  remainingPercentage: number;
  totalSteps: number;
  completedSteps: number;
  remainingSteps: number;
  steps: ProfileCompletionStep[];
};

@Injectable()
export class ArtistProfileService {
  constructor(
    private readonly database: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * ============================================================
   * GET COMPLETE ARTIST PROFILE
   * ============================================================
   */
  async getProfile(userId: string) {
    const profile = await this.database.artistProfile.findUnique({
      where: {
        userId,
      },

      include: {
        user: {
          include: {
            artistRegistration: {
              include: {
                country: true,
                city: true,
              },
            },
          },
        },

        genres: {
          include: {
            genre: true,
          },
        },

        artistRoles: {
          include: {
            artistRole: true,
          },
        },

        instruments: {
          include: {
            instrument: true,
          },
        },

        bandMembers: true,

        visualIdentity: true,

        socialProfile: {
          include: {
            others: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(
        'Artist profile not found.',
      );
    }

    /*
     * Calculate from the actual profile data instead of blindly
     * trusting the stored percentage.
     */
    const completion =
      this.calculateProfileCompletion(profile);

    /*
     * Keep User.profileCompletionPercentage synchronized.
     */
    const storedCompletion = Number(
      profile.user?.profileCompletionPercentage ?? 25,
    );

    if (storedCompletion !== completion.percentage) {
      await this.database.user.update({
        where: {
          id: userId,
        },
        data: {
          profileCompletionPercentage:
            completion.percentage,
        },
      });
    }

    return this.formatProfile(
      profile,
      completion,
    );
  }

  /**
   * ============================================================
   * UPDATE ARTIST IDENTITY
   *
   * Common for:
   * - SOLO_ARTIST
   * - MUSIC_BAND
   *
   * Fields:
   * - artistType
   * - stageName
   * - bio
   * ============================================================
   */
  async updateArtistIdentity(
    userId: string,
    data: {
      artistType?: ArtistType;
      stageName?: string | null;
      bio?: string | null;
    },
  ) {
    const profile =
      await this.getArtistProfile(userId);

    if (data.artistType !== undefined) {
      if (
        data.artistType !== ArtistType.SOLO_ARTIST &&
        data.artistType !== ArtistType.MUSIC_BAND
      ) {
        throw new BadRequestException(
          'Invalid artist type.',
        );
      }
    }

    await this.database.artistProfile.update({
      where: {
        id: profile.id,
      },

      data: {
        ...(data.artistType !== undefined && {
          artistType: data.artistType,
        }),

        ...(data.stageName !== undefined && {
          stageName:
            data.stageName?.trim() || null,
        }),

        ...(data.bio !== undefined && {
          bio:
            data.bio?.trim() || null,
        }),
      },
    });

    await this.updateProfileCompletion(userId);

    return this.getProfile(userId);
  }

  /**
   * ============================================================
   * UPDATE "I LIKE TO SING"
   *
   * Available for:
   * - SOLO_ARTIST
   * - MUSIC_BAND
   * ============================================================
   */
  async updateGenres(
    userId: string,
    genreIds: string[],
  ) {
    const profile =
      await this.getArtistProfile(userId);

    if (!Array.isArray(genreIds)) {
      throw new BadRequestException(
        'genreIds must be an array.',
      );
    }

    const uniqueGenreIds = [
      ...new Set(genreIds),
    ];

    if (uniqueGenreIds.length === 0) {
      throw new BadRequestException(
        'At least one music genre is required.',
      );
    }

    const genres =
      await this.database.musicGenre.findMany({
        where: {
          id: {
            in: uniqueGenreIds,
          },
          status: 1,
          deletedAt: null,
        },

        select: {
          id: true,
        },
      });

    if (
      genres.length !==
      uniqueGenreIds.length
    ) {
      throw new BadRequestException(
        'One or more selected genres do not exist or are inactive.',
      );
    }

    await this.database.$transaction(async (tx) => {
      await tx.artistProfileGenre.deleteMany({
        where: {
          artistProfileId: profile.id,
        },
      });

      await tx.artistProfileGenre.createMany({
        data: uniqueGenreIds.map((genreId) => ({
          artistProfileId: profile.id,
          genreId,
        })),
      });
    });

    await this.updateProfileCompletion(userId);

    return this.getProfile(userId);
  }

  /**
   * ============================================================
   * UPDATE "I AM ALSO"
   *
   * ONLY FOR SOLO_ARTIST
   * ============================================================
   */
  async updateArtistRoles(
    userId: string,
    artistRoleIds: string[],
  ) {
    const profile =
      await this.getArtistProfile(userId);

    if (
      profile.artistType !==
      ArtistType.SOLO_ARTIST
    ) {
      throw new BadRequestException(
        'Artist roles are only available for Solo Artist profiles.',
      );
    }

    if (!Array.isArray(artistRoleIds)) {
      throw new BadRequestException(
        'artistRoleIds must be an array.',
      );
    }

    const uniqueRoleIds = [
      ...new Set(artistRoleIds),
    ];

    if (uniqueRoleIds.length === 0) {
      throw new BadRequestException(
        'At least one artist role is required.',
      );
    }

    const roles =
      await this.database.artistRole.findMany({
        where: {
          id: {
            in: uniqueRoleIds,
          },
          status: 1,
          deletedAt: null,
        },

        select: {
          id: true,
        },
      });

    if (
      roles.length !==
      uniqueRoleIds.length
    ) {
      throw new BadRequestException(
        'One or more selected artist roles do not exist or are inactive.',
      );
    }

    await this.database.$transaction(async (tx) => {
      await tx.artistProfileRole.deleteMany({
        where: {
          artistProfileId: profile.id,
        },
      });

      await tx.artistProfileRole.createMany({
        data: uniqueRoleIds.map((artistRoleId) => ({
          artistProfileId: profile.id,
          artistRoleId,
        })),
      });
    });

    await this.updateProfileCompletion(userId);

    return this.getProfile(userId);
  }

  /**
   * ============================================================
   * UPDATE "I LIKE TO PLAY"
   *
   * ONLY FOR SOLO_ARTIST
   * ============================================================
   */
  async updateInstruments(
    userId: string,
    instrumentIds: string[],
  ) {
    const profile =
      await this.getArtistProfile(userId);

    if (
      profile.artistType !==
      ArtistType.SOLO_ARTIST
    ) {
      throw new BadRequestException(
        'Instruments are only available for Solo Artist profiles.',
      );
    }

    if (!Array.isArray(instrumentIds)) {
      throw new BadRequestException(
        'instrumentIds must be an array.',
      );
    }

    const uniqueInstrumentIds = [
      ...new Set(instrumentIds),
    ];

    if (
      uniqueInstrumentIds.length === 0
    ) {
      throw new BadRequestException(
        'At least one instrument is required.',
      );
    }

    const instruments =
      await this.database.instrument.findMany({
        where: {
          id: {
            in: uniqueInstrumentIds,
          },
          status: 1,
          deletedAt: null,
        },

        select: {
          id: true,
        },
      });

    if (
      instruments.length !==
      uniqueInstrumentIds.length
    ) {
      throw new BadRequestException(
        'One or more selected instruments do not exist or are inactive.',
      );
    }

    await this.database.$transaction(
      async (tx) => {
        await tx.artistProfileInstrument.deleteMany({
          where: {
            artistProfileId: profile.id,
          },
        });

        await tx.artistProfileInstrument.createMany({
          data: uniqueInstrumentIds.map(
            (instrumentId) => ({
              artistProfileId: profile.id,
              instrumentId,
            }),
          ),
        });
      }
    );

    await this.updateProfileCompletion(userId);

    return this.getProfile(userId);
  }

  /**
   * ============================================================
   * UPDATE BAND MEMBERS WITH OPTIONAL PROFILE PICTURES
   *
   * Multipart form-data fields:
   * - members: JSON string array
   * - memberPicture_0: picture for members[0]
   * - memberPicture_1: picture for members[1]
   *
   * Existing member IDs are preserved. Existing pictures are
   * retained when no replacement file is submitted.
   * The submitted array is the complete member list; omitted
   * existing members are removed.
   * ============================================================
   */
  async updateBandMembersWithPictures(
    userId: string,
    membersJson: string,
    files: Express.Multer.File[],
  ) {
    const profile = await this.getArtistProfile(userId);

    if (profile.artistType !== ArtistType.MUSIC_BAND) {
      throw new BadRequestException(
        'Band members are only available for Music Band profiles.',
      );
    }

    if (typeof membersJson !== 'string' || !membersJson.trim()) {
      throw new BadRequestException(
        'members is required and must contain a JSON array.',
      );
    }

    let parsedMembers: unknown;

    try {
      parsedMembers = JSON.parse(membersJson);
    } catch {
      throw new BadRequestException(
        'members must be valid JSON.',
      );
    }

    if (!Array.isArray(parsedMembers)) {
      throw new BadRequestException(
        'members must be a JSON array.',
      );
    }

    if (parsedMembers.length > 20) {
      throw new BadRequestException(
        'A maximum of 20 band members is allowed.',
      );
    }

    const members: BandMemberInput[] = parsedMembers.map(
      (value: any, index: number) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          throw new BadRequestException(
            `Invalid band member at index ${index}.`,
          );
        }

        const id = typeof value.id === 'string' ? value.id.trim() : undefined;
        const name = typeof value.name === 'string' ? value.name.trim() : '';
        const designation =
          typeof value.designation === 'string'
            ? value.designation.trim() || null
            : null;

        if (!name) {
          throw new BadRequestException(
            `Band member name is required at index ${index}.`,
          );
        }

        // if (value.id !== undefined && (!id || typeof value.id !== 'string')) {
        //   throw new BadRequestException(
        //     `Invalid band member ID at index ${index}.`,
        //   );
        // }

        if (value.id !== undefined && (!id || !isUUID(id))) {
          throw new BadRequestException(
            `Invalid band member ID at index ${index}.`,
          );
        }

        if (
          value.designation !== undefined &&
          value.designation !== null &&
          typeof value.designation !== 'string'
        ) {
          throw new BadRequestException(
            `Band member designation must be a string at index ${index}.`,
          );
        }

        return { id, name, designation: designation ?? undefined };
      },
    );

    const existingMembers = await this.database.bandMember.findMany({
      where: { artistProfileId: profile.id },
    });
    const existingById = new Map(
      existingMembers.map((member) => [member.id, member]),
    );

    const submittedIds = members
      .map((member) => member.id)
      .filter((id): id is string => Boolean(id));

    if (new Set(submittedIds).size !== submittedIds.length) {
      throw new BadRequestException(
        'A band member ID cannot be submitted more than once.',
      );
    }

    for (const id of submittedIds) {
      if (!existingById.has(id)) {
        throw new BadRequestException(
          'One or more band member IDs do not belong to this artist profile.',
        );
      }
    }

    const fileByIndex = new Map<number, Express.Multer.File>();

    for (const file of files ?? []) {
      const match = /^memberPicture_(\d+)$/.exec(file.fieldname);
      if (!match) {
        throw new BadRequestException(
          `Unexpected band member image field: ${file.fieldname}.`,
        );
      }

      const index = Number(match[1]);
      if (index < 0 || index >= members.length) {
        throw new BadRequestException(
          `Band member image index ${index} does not match a submitted member.`,
        );
      }

      if (fileByIndex.has(index)) {
        throw new BadRequestException(
          `Only one picture is allowed for band member index ${index}.`,
        );
      }

      if (!file.mimetype?.startsWith('image/')) {
        throw new BadRequestException(
          `The file for band member index ${index} must be an image.`,
        );
      }

      fileByIndex.set(index, file);
    }

    const uploadedStorageKeys: string[] = [];
    const oldStorageKeysToDelete: string[] = [];
    let databaseUpdated = false;

    try {
      const preparedMembers = [] as Array<{
        id?: string;
        name: string;
        designation: string | null;
        profilePicture: string | null;
      }>;

      for (let index = 0; index < members.length; index += 1) {
        const member = members[index];
        const existing = member.id
          ? existingById.get(member.id)
          : undefined;
        const pictureFile = fileByIndex.get(index);

        let profilePicture = existing?.profilePicture ?? null;

        if (pictureFile) {
          const storageKey = await this.storageService.upload(
            pictureFile,
            'artist-profile/band-members',
          );
          uploadedStorageKeys.push(storageKey);

          if (existing?.profilePicture) {
            oldStorageKeysToDelete.push(existing.profilePicture);
          }

          profilePicture = storageKey;
        }

        preparedMembers.push({
          id: member.id,
          name: member.name,
          designation: member.designation ?? null,
          profilePicture,
        });
      }

      const removedMembers = existingMembers.filter(
        (member) => !submittedIds.includes(member.id),
      );

      for (const member of removedMembers) {
        if (member.profilePicture) {
          oldStorageKeysToDelete.push(member.profilePicture);
        }
      }

      await this.database.$transaction(async (tx) => {
        for (const member of preparedMembers) {
          if (member.id) {
            await tx.bandMember.update({
              where: { id: member.id },
              data: {
                name: member.name,
                designation: member.designation,
                profilePicture: member.profilePicture,
              },
            });
          } else {
            await tx.bandMember.create({
              data: {
                artistProfileId: profile.id,
                name: member.name,
                designation: member.designation,
                profilePicture: member.profilePicture,
              },
            });
          }
        }

        if (removedMembers.length > 0) {
          await tx.bandMember.deleteMany({
            where: {
              artistProfileId: profile.id,
              id: { in: removedMembers.map((member) => member.id) },
            },
          });
        }
      });

      databaseUpdated = true;
    } catch (error) {
      if (!databaseUpdated) {
        for (const storageKey of uploadedStorageKeys) {
          await this.safeDeleteStorageFile(storageKey);
        }
      }
      throw error;
    }

    for (const storageKey of oldStorageKeysToDelete) {
      await this.safeDeleteStorageFile(storageKey);
    }

    await this.updateProfileCompletion(userId);
    return this.getProfile(userId);
  }

  /**
   * ============================================================
   * UPDATE VISUAL IDENTITY
   *
   * Storage folders:
   *
   * artist-profile/cover
   * artist-profile/profile
   * artist-profile/logo
   *
   * Database stores storage keys.
   * API returns public URLs.
   * ============================================================
   */
  async updateVisualIdentity(
    userId: string,
    files: ArtistVisualFiles,
  ) {
    const profile =
      await this.getArtistProfile(userId);

    const existing =
      await this.database.artistProfileVisual.findUnique({
        where: {
          artistProfileId: profile.id,
        },
      });

    const updateData: {
      artistCoverPicture?: string;
      profilePicture?: string;
      artistLogo?: string;
    } = {};

    const uploadedFiles: string[] = [];

    let databaseUpdated = false;

    try {
      /*
       * COVER
       */
      const coverFile =
        files.artistCoverPicture?.[0];

      if (coverFile) {
        const storageKey =
          await this.storageService.upload(
            coverFile,
            'artist-profile/cover',
          );

        updateData.artistCoverPicture =
          storageKey;

        uploadedFiles.push(storageKey);
      }

      /*
       * PROFILE PICTURE
       */
      const profileFile =
        files.profilePicture?.[0];

      if (profileFile) {
        const storageKey =
          await this.storageService.upload(
            profileFile,
            'artist-profile/profile',
          );

        updateData.profilePicture =
          storageKey;

        uploadedFiles.push(storageKey);
      }

      /*
       * ARTIST LOGO
       */
      const logoFile =
        files.artistLogo?.[0];

      if (logoFile) {
        const storageKey =
          await this.storageService.upload(
            logoFile,
            'artist-profile/logo',
          );

        updateData.artistLogo =
          storageKey;

        uploadedFiles.push(storageKey);
      }

      if (
        Object.keys(updateData).length === 0
      ) {
        throw new BadRequestException(
          'At least one visual identity file is required.',
        );
      }

      /*
       * Update database first.
       */
      await this.database.artistProfileVisual.upsert({
        where: {
          artistProfileId: profile.id,
        },

        create: {
          artistProfileId: profile.id,
          ...updateData,
        },

        update: {
          ...updateData,
        },
      });

      databaseUpdated = true;

      /*
       * Only delete replaced files after the DB has
       * successfully stored the new keys.
       */
      if (
        updateData.artistCoverPicture &&
        existing?.artistCoverPicture
      ) {
        await this.safeDeleteStorageFile(
          existing.artistCoverPicture,
        );
      }

      if (
        updateData.profilePicture &&
        existing?.profilePicture
      ) {
        await this.safeDeleteStorageFile(
          existing.profilePicture,
        );
      }

      if (
        updateData.artistLogo &&
        existing?.artistLogo
      ) {
        await this.safeDeleteStorageFile(
          existing.artistLogo,
        );
      }
    } catch (error) {
      /*
       * Only remove newly uploaded files if the DB
       * was NOT successfully updated.
       *
       * If DB update succeeded and old-file deletion
       * failed, deleting the new files would leave the
       * database pointing to missing files.
       */
      if (!databaseUpdated) {
        for (const storageKey of uploadedFiles) {
          try {
            await this.storageService.delete(
              storageKey,
            );
          } catch {
            // Do not hide the original error.
          }
        }
      }

      throw error;
    }

    await this.updateProfileCompletion(userId);

    return this.getProfile(userId);
  }

  /**
   * ============================================================
   * UPDATE SOCIAL PROFILE
   * ============================================================
   *
   * "others.logo" currently comes from the DTO as a string.
   * Therefore this method does not upload social logos.
   *
   * If later the DTO becomes multipart, we can use:
   * social/logos
   * ============================================================
   */
  async updateSocialProfile(
    userId: string,
    data: {
      facebook?: string | null;
      instagram?: string | null;
      tiktok?: string | null;
      youtube?: string | null;

      others?: Array<{
        name: string;
        logo?: string | null;
        url: string;
      }>;
    },
  ) {
    const profile =
      await this.getArtistProfile(userId);

    if (
      data.others !== undefined &&
      !Array.isArray(data.others)
    ) {
      throw new BadRequestException(
        'others must be an array.',
      );
    }

    await this.database.$transaction(
      async (tx) => {
        const socialProfile =
          await tx.artistSocialProfile.upsert({
            where: {
              artistProfileId: profile.id,
            },

            create: {
              artistProfileId: profile.id,

              facebook:
                this.cleanString(
                  data.facebook,
                ),

              instagram:
                this.cleanString(
                  data.instagram,
                ),

              tiktok:
                this.cleanString(
                  data.tiktok,
                ),

              youtube:
                this.cleanString(
                  data.youtube,
                ),
            },

            update: {
              ...(data.facebook !== undefined && {
                facebook:
                  this.cleanString(
                    data.facebook,
                  ),
              }),

              ...(data.instagram !== undefined && {
                instagram:
                  this.cleanString(
                    data.instagram,
                  ),
              }),

              ...(data.tiktok !== undefined && {
                tiktok:
                  this.cleanString(
                    data.tiktok,
                  ),
              }),

              ...(data.youtube !== undefined && {
                youtube:
                  this.cleanString(
                    data.youtube,
                  ),
              }),
            },
          });

        /*
         * Replace "others" only when the client supplied
         * the others array.
         */
        if (
          data.others !== undefined
        ) {
          await tx.artistSocialProfileOther.deleteMany({
            where: {
              socialProfileId:
                socialProfile.id,
            },
          });

          if (
            data.others.length > 0
          ) {
            const others =
              data.others.map(
                (item, index) => {
                  const name =
                    item.name?.trim();

                  const url =
                    item.url?.trim();

                  if (!name) {
                    throw new BadRequestException(
                      `Social profile name is required at index ${index}.`,
                    );
                  }

                  if (!url) {
                    throw new BadRequestException(
                      `Social profile URL is required at index ${index}.`,
                    );
                  }

                  return {
                    socialProfileId:
                      socialProfile.id,

                    name,

                    logo:
                      item.logo?.trim() ||
                      null,

                    url,
                  };
                },
              );

            await tx.artistSocialProfileOther.createMany({
              data: others,
            });
          }
        }
      }
    );

    await this.updateProfileCompletion(userId);

    return this.getProfile(userId);
  }

  

async updateSocialProfileWithPictures(
  userId: string,
  data: any,
  files: Express.Multer.File[],
) {
  const profile = await this.getArtistProfile(userId);

  // Parse custom platforms from multipart JSON.
  let others: Array<{
    id?: string;
    name: string;
    url: string;
  }> | undefined;

  if (data.others !== undefined) {
    try {
      others =
        typeof data.others === 'string'
          ? JSON.parse(data.others)
          : data.others;
    } catch {
      throw new BadRequestException(
        'others must contain valid JSON.',
      );
    }

    if (!Array.isArray(others)) {
      throw new BadRequestException(
        'others must be an array.',
      );
    }

    if (others.length > 20) {
      throw new BadRequestException(
        'A maximum of 20 custom social platforms is allowed.',
      );
    }

    const seenIds = new Set<string>();

    others = others.map((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new BadRequestException(
          `Invalid social platform at index ${index}.`,
        );
      }

      const name =
        typeof item.name === 'string'
          ? item.name.trim()
          : '';

      const url =
        typeof item.url === 'string'
          ? item.url.trim()
          : '';

      if (!name || name.length > 100) {
        throw new BadRequestException(
          `Invalid platform name at index ${index}.`,
        );
      }

      if (!url || !isURL(url, { require_protocol: true })) {
        throw new BadRequestException(
          `Invalid platform URL at index ${index}.`,
        );
      }

      let id: string | undefined;

      if (item.id !== undefined) {
        if (
          typeof item.id !== 'string' ||
          !isUUID(item.id)
        ) {
          throw new BadRequestException(
            `Invalid platform ID at index ${index}.`,
          );
        }

        id = item.id;

        if (seenIds.has(id)) {
          throw new BadRequestException(
            'A platform ID cannot be submitted more than once.',
          );
        }

        seenIds.add(id);
      }

      return { id, name, url };
    });
  }

  // Find or create the social profile.
  const existingSocial =
    await this.database.artistSocialProfile.findUnique({
      where: {
        artistProfileId: profile.id,
      },
      include: {
        others: true,
      },
    });

  const socialProfile =
    existingSocial ??
    await this.database.artistSocialProfile.create({
      data: {
        artistProfileId: profile.id,
      },
      include: {
        others: true,
      },
    });

  const existingById = new Map(
    socialProfile.others.map((item) => [
      item.id,
      item,
    ]),
  );

  // Validate submitted IDs belong to this artist.
  for (const item of others ?? []) {
    if (item.id && !existingById.has(item.id)) {
      throw new BadRequestException(
        'One or more platform IDs do not belong to this artist.',
      );
    }
  }

  // Map uploaded logos by array index.
  const fileByIndex = new Map<
    number,
    Express.Multer.File
  >();

  for (const file of files ?? []) {
    const match = /^otherLogo_(\d+)$/.exec(
      file.fieldname,
    );

    if (!match) {
      throw new BadRequestException(
        `Unexpected social logo field: ${file.fieldname}.`,
      );
    }

    const index = Number(match[1]);

    if (!others || index >= others.length) {
      throw new BadRequestException(
        `Social logo index ${index} does not match a submitted platform.`,
      );
    }

    if (fileByIndex.has(index)) {
      throw new BadRequestException(
        `Only one logo is allowed for platform index ${index}.`,
      );
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException(
        `Platform logo at index ${index} must be an image.`,
      );
    }

    fileByIndex.set(index, file);
  }

  const uploadedKeys: string[] = [];
  const oldKeysToDelete: string[] = [];

  try {
    const preparedOthers = [];

    for (let index = 0; index < (others?.length ?? 0); index++) {
      const item = others![index];

      const existing = item.id
        ? existingById.get(item.id)
        : undefined;

      let logo = existing?.logo ?? null;

      const logoFile = fileByIndex.get(index);

      if (logoFile) {
        logo = await this.storageService.upload(
          logoFile,
          'artist-profile/social/logos',
        );

        uploadedKeys.push(logo);

        if (existing?.logo) {
          oldKeysToDelete.push(existing.logo);
        }
      }

      preparedOthers.push({
        id: item.id,
        name: item.name,
        url: item.url,
        logo,
      });
    }

    // Identify removed platforms and their old logos.
    const submittedIds = (others ?? [])
      .map((item) => item.id)
      .filter((id): id is string => !!id);

    const removedOthers = others !== undefined
      ? socialProfile.others.filter(
          (item) => !submittedIds.includes(item.id),
        )
      : [];

    for (const item of removedOthers) {
      if (item.logo) {
        oldKeysToDelete.push(item.logo);
      }
    }

    // Update the database transactionally.
    await this.database.$transaction(async (tx) => {
      await tx.artistSocialProfile.update({
        where: {
          id: socialProfile.id,
        },
        data: {
          ...(data.facebook !== undefined && {
            facebook: this.cleanString(data.facebook),
          }),
          ...(data.instagram !== undefined && {
            instagram: this.cleanString(data.instagram),
          }),
          ...(data.tiktok !== undefined && {
            tiktok: this.cleanString(data.tiktok),
          }),
          ...(data.youtube !== undefined && {
            youtube: this.cleanString(data.youtube),
          }),
        },
      });

      if (others !== undefined) {
        for (const item of preparedOthers) {
          if (item.id) {
            await tx.artistSocialProfileOther.update({
              where: {
                id: item.id,
              },
              data: {
                name: item.name,
                url: item.url,
                logo: item.logo,
              },
            });
          } else {
            await tx.artistSocialProfileOther.create({
              data: {
                socialProfileId: socialProfile.id,
                name: item.name,
                url: item.url,
                logo: item.logo,
              },
            });
          }
        }

        if (removedOthers.length > 0) {
          await tx.artistSocialProfileOther.deleteMany({
            where: {
              socialProfileId: socialProfile.id,
              id: {
                in: removedOthers.map((item) => item.id),
              },
            },
          });
        }
      }
    });
  } catch (error) {
    // Remove newly uploaded files if database update fails.
    for (const key of uploadedKeys) {
      await this.safeDeleteStorageFile(key);
    }

    throw error;
  }

  // Delete old images only after successful database update.
  for (const key of oldKeysToDelete) {
    await this.safeDeleteStorageFile(key);
  }

  await this.updateProfileCompletion(userId);

  return this.getProfile(userId);
}


  /**
   * ============================================================
   * PROFILE COMPLETION
   * ============================================================
   *
   * SOLO_ARTIST
   *
   * 1. Registration       25%
   * 2. Artist Identity    25%
   * 3. Visual Identity    25%
   * 4. Social Profile     25%
   *
   * MUSIC_BAND
   *
   * 1. Registration       25%
   * 2. Band Identity      12.5%
   * 3. Band Members       12.5%
   * 4. Visual Identity    25%
   * 5. Social Profile     25%
   *
   * ============================================================
   */
  private async updateProfileCompletion(
    userId: string,
  ) {
    const profile =
      await this.database.artistProfile.findUnique({
        where: {
          userId,
        },

        include: {
          genres: true,

          artistRoles: true,

          instruments: true,

          bandMembers: true,

          visualIdentity: true,

          socialProfile: {
            include: {
              others: true,
            },
          },
        },
      });

    if (!profile) {
      throw new NotFoundException(
        'Artist profile not found.',
      );
    }

    const completion =
      this.calculateProfileCompletion(
        profile,
      );

    await this.database.user.update({
      where: {
        id: userId,
      },

      data: {
        profileCompletionPercentage:
          completion.percentage,
      },
    });

    return completion;
  }

  /**
   * ============================================================
   * CALCULATE PROFILE COMPLETION
   * ============================================================
   */
  private calculateProfileCompletion(
    profile: any,
  ): ProfileCompletionDetails {
    const steps: ProfileCompletionStep[] = [];

    /*
     * Registration
     *
     * ArtistProfile exists only after successful artist
     * registration/completion, therefore this contributes 25%.
     */
    steps.push({
      step: 1,
      key: 'registration',
      name: 'Registration',
      percentage: 25,
      completed: true,
    });

    /*
     * Artist type is selected later on the Artist Identity screen.
     * Until it is selected, only registration is counted.
     */
    if (!profile.artistType) {
      return {
        percentage: 25,
        remainingPercentage: 75,
        totalSteps: 1,
        completedSteps: 1,
        remainingSteps: 0,
        steps,
      };
    }

    /*
     * ==========================================================
     * SOLO ARTIST
     * ==========================================================
     */
    if (
      profile.artistType ===
      ArtistType.SOLO_ARTIST
    ) {
      const artistIdentityComplete =
        !!profile.stageName?.trim() &&
        !!profile.bio?.trim() &&
        profile.genres?.length > 0 &&
        profile.artistRoles?.length > 0 &&
        profile.instruments?.length > 0;

      const visualIdentityComplete =
        !!profile.visualIdentity
          ?.artistCoverPicture &&
        !!profile.visualIdentity
          ?.profilePicture &&
        !!profile.visualIdentity
          ?.artistLogo;

      const socialProfileComplete =
        this.isSocialProfileComplete(
          profile.socialProfile,
        );

      steps.push({
        step: 2,
        key: 'artist_identity',
        name: 'Artist Identity',
        percentage: 25,
        completed:
          artistIdentityComplete,
      });

      steps.push({
        step: 3,
        key: 'visual_identity',
        name: 'Visual Identity',
        percentage: 25,
        completed:
          visualIdentityComplete,
      });

      steps.push({
        step: 4,
        key: 'social_profile',
        name: 'Social Profile',
        percentage: 25,
        completed:
          socialProfileComplete,
      });
    }

    /*
     * ==========================================================
     * MUSIC BAND
     * ==========================================================
     */
    if (
      profile.artistType ===
      ArtistType.MUSIC_BAND
    ) {
      const bandIdentityComplete =
        !!profile.stageName?.trim() &&
        !!profile.bio?.trim() &&
        profile.genres?.length > 0;

      const bandMembersComplete =
        profile.bandMembers?.length > 0;

      const visualIdentityComplete =
        !!profile.visualIdentity
          ?.artistCoverPicture &&
        !!profile.visualIdentity
          ?.profilePicture &&
        !!profile.visualIdentity
          ?.artistLogo;

      const socialProfileComplete =
        this.isSocialProfileComplete(
          profile.socialProfile,
        );

      steps.push({
        step: 2,
        key: 'band_identity',
        name: 'Band Identity',
        percentage: 12.5,
        completed:
          bandIdentityComplete,
      });

      steps.push({
        step: 3,
        key: 'band_members',
        name: 'Band Members',
        percentage: 12.5,
        completed:
          bandMembersComplete,
      });

      steps.push({
        step: 4,
        key: 'visual_identity',
        name: 'Visual Identity',
        percentage: 25,
        completed:
          visualIdentityComplete,
      });

      steps.push({
        step: 5,
        key: 'social_profile',
        name: 'Social Profile',
        percentage: 25,
        completed:
          socialProfileComplete,
      });
    }

    const percentage =
      steps.reduce(
        (total, step) =>
          total +
          (step.completed
            ? step.percentage
            : 0),
        0,
      );

    const completedSteps =
      steps.filter(
        (step) => step.completed,
      ).length;

    const totalSteps =
      steps.length;

    const remainingSteps =
      totalSteps -
      completedSteps;

    const remainingPercentage =
      100 - percentage;

    return {
      percentage,
      remainingPercentage,
      totalSteps,
      completedSteps,
      remainingSteps,
      steps,
    };
  }

  /**
   * ============================================================
   * SOCIAL PROFILE COMPLETION
   * ============================================================
   *
   * Social step is complete when at least one social
   * presence has been provided.
   * ============================================================
   */
  private isSocialProfileComplete(
    socialProfile: any,
  ): boolean {
    if (!socialProfile) {
      return false;
    }

    return (
      !!socialProfile.facebook?.trim() ||
      !!socialProfile.instagram?.trim() ||
      !!socialProfile.tiktok?.trim() ||
      !!socialProfile.youtube?.trim() ||
      socialProfile.others?.length > 0
    );
  }

  /**
   * ============================================================
   * FIND ARTIST PROFILE
   * ============================================================
   */
  private async getArtistProfile(
    userId: string,
  ) {
    const profile =
      await this.database.artistProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!profile) {
      throw new NotFoundException(
        'Artist profile not found.',
      );
    }

    return profile;
  }

  /**
   * ============================================================
   * FORMAT COMPLETE PROFILE RESPONSE
   *
   * RN field names are preserved where they are already part
   * of the API response contract.
   *
   * Backend domain data is not forced to match RN naming
   * internally.
   * ============================================================
   */
  private formatProfile(
    profile: any,
    completion: ProfileCompletionDetails,
  ) {
    const registration =
      profile.user?.artistRegistration;

    const visual =
      profile.visualIdentity;

    const social =
      profile.socialProfile;

    const isSolo =
      profile.artistType ===
      ArtistType.SOLO_ARTIST;

    const isBand =
      profile.artistType ===
      ArtistType.MUSIC_BAND;

    /*
     * Genres are available to both Solo and Band.
     */
    const likeSing =
      profile.genres?.map(
        (item: any) => ({
          id: item.genre.id,
          name: item.genre.name,
        }),
      ) ?? [];

    /*
     * Artist roles only apply to Solo Artist.
     */
    const amAlso =
      isSolo
        ? (
            profile.artistRoles?.map(
              (item: any) => ({
                id:
                  item.artistRole.id,
                name:
                  item.artistRole.name,
              }),
            ) ?? []
          )
        : [];

    /*
     * Instruments only apply to Solo Artist.
     */
    const likePlay =
      isSolo
        ? (
            profile.instruments?.map(
              (item: any) => ({
                id:
                  item.instrument.id,
                name:
                  item.instrument.name,
              }),
            ) ?? []
          )
        : [];

    /*
     * Band members only apply to Music Band.
     *
     * Actual database fields:
     * - id
     * - name
     * - designation
     * - profilePicture
     *
     * Profile pictures are converted to public URLs.
     */
    const bandMembers =
      isBand
        ? (
            profile.bandMembers?.map(
              (member: any) => ({
                id: member.id,
                name: member.name,
                designation:
                  member.designation ?? null,
                profilePicture:
                  member.profilePicture
                    ? this.toPublicUrl(
                        member.profilePicture,
                      )
                    : null,
              }),
            ) ?? []
          )
        : [];

    return {
      basic: {
        issubscription: false,

        name: [
          registration?.firstName,
          registration?.lastName,
        ]
          .filter(Boolean)
          .join(' '),

        email:
          profile.user?.email ?? '',

        phone:
          profile.user?.mobile
            ? `${profile.user?.countryCode ?? ''}${profile.user.mobile}`
            : '',

        country: {
          dialcode:
            registration?.country
              ?.phoneCode ?? '',

          name:
            registration?.country
              ?.name ?? '',

          flag:
            registration?.country
              ?.iso2 ?? '',

          id:
            registration?.country
              ?.id ?? '',
        },

        city: {
          id:
            registration?.city?.id ?? '',

          name:
            registration?.city?.name ?? '',
        },

        /*
         * Profile completion.
         */
        profile_completion:
          completion.percentage,

        profile_completion_remaining:
          completion.remainingPercentage,

        profile_completion_steps: {
          total_steps:
            completion.totalSteps,

          completed_steps:
            completion.completedSteps,

          remaining_steps:
            completion.remainingSteps,

          steps:
            completion.steps,
        },

        profile_picture:
          visual?.profilePicture
            ? this.toPublicUrl(
                visual.profilePicture,
              )
            : null,

        artist_type:
          profile.artistType,

        artist_type_required:
          !profile.artistType,
      },

      artist_identity: {
        bio:
          profile.bio ?? '',

        stage_name:
          profile.stageName ?? '',

        like_sing:
          likeSing,

        am_also:
          amAlso,

        like_play:
          likePlay,
      },

      visual_identity: {
        /*
         * Keep the existing API spelling.
         */
        artst_cover_picture:
          visual?.artistCoverPicture
            ? this.toPublicUrl(
                visual.artistCoverPicture,
              )
            : '',

        profile_picture:
          visual?.profilePicture
            ? this.toPublicUrl(
                visual.profilePicture,
              )
            : '',

        artist_logo:
          visual?.artistLogo
            ? this.toPublicUrl(
                visual.artistLogo,
              )
            : '',
      },

      band_member: {
        members:
          bandMembers,
      },

      social_profile: {
        facebook:
          social?.facebook ?? '',

        instagram:
          social?.instagram ?? '',

        tiktok:
          social?.tiktok ?? '',

        youtube:
          social?.youtube ?? '',

        others:
          social?.others?.map(
            (item: any) => ({
              name:
                item.name,

              logo:
                item.logo
                  ? this.toPublicUrl(
                      item.logo,
                    )
                  : '',

              url:
                item.url,
            }),
          ) ?? [],
      },
    };
  }

  /**
   * ============================================================
   * PUBLIC IMAGE URL
   * ============================================================
   *
   * Supports both:
   *
   * storage key:
   * artist-profile/profile/abc.jpg
   *
   * and an already-existing full URL:
   * http://localhost:3003/uploads/...
   * ============================================================
   */
  private toPublicUrl(
    value: string,
  ): string {
    if (!value) {
      return '';
    }

    

    if (
      value.startsWith('http://') ||
      value.startsWith('https://')
    ) {
      return value;
    }

    return this.storageService.getUrl(
      value,
    );
  }

  /**
   * ============================================================
   * CLEAN STRING
   * ============================================================
   */
  private cleanString(
    value?: string | null,
  ): string | null {
    return value?.trim() || null;
  }

  /**
   * ============================================================
   * SAFE STORAGE DELETE
   * ============================================================
   *
   * File deletion failure should not make a successful
   * database update look like it failed.
   * ============================================================
   */
  private async safeDeleteStorageFile(
    storageKey: string,
  ): Promise<void> {
    try {
      await this.storageService.delete(
        storageKey,
      );
    } catch {
      /*
       * Do not break the profile update because
       * an old physical file could not be removed.
       *
       * The DB already points to the new file.
       */
    }
  }
}
