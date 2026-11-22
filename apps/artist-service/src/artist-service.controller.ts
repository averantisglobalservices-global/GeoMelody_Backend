import { Controller, Get } from '@nestjs/common';
import { ArtistServiceService } from './artist-service.service';

@Controller()
export class ArtistServiceController {
  constructor(private readonly artistServiceService: ArtistServiceService) {}

  @Get()
  getHello(): string {
    return this.artistServiceService.getHello();
  }
}
