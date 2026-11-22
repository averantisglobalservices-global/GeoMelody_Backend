import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '@geomelody/database';

@Injectable()
export class LocationsService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async getCountries() {
    return this.databaseService.country.findMany({
      where: {
        status: 1,
      },
      select: {
        id: true,
        name: true,
        iso2: true,
        iso3: true,
        phoneCode: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getCitiesByCountry(
    countryId: string,
  ) {
    const country =
      await this.databaseService.country.findFirst({
        where: {
          id: countryId,
          status: 1,
        },
        select: {
          id: true,
        },
      });

    if (!country) {
      throw new NotFoundException(
        'Country not found',
      );
    }

    return this.databaseService.city.findMany({
      where: {
        countryId,
        status: 1,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}