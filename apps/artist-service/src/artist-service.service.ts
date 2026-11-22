import { Injectable } from '@nestjs/common';

@Injectable()
export class ArtistServiceService {
  getHello(): string {
    return 'Artist Service is running';
  }
}