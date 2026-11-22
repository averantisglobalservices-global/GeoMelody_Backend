import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { LocationsService } from '../services/locations.service';

@Controller('api/v1/locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
  ) {}

  @Get('countries')
  async getCountries() {
    return this.locationsService.getCountries();
  }

  @Get('countries/:countryId/cities')
  async getCitiesByCountry(
    @Param('countryId') countryId: string,
  ) {
    return this.locationsService.getCitiesByCountry(
      countryId,
    );
  }
}