import { Test, TestingModule } from '@nestjs/testing';
import { ArtistServiceController } from './artist-service.controller';
import { ArtistServiceService } from './artist-service.service';

describe('ArtistServiceController', () => {
  let artistServiceController: ArtistServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ArtistServiceController],
      providers: [ArtistServiceService],
    }).compile();

    artistServiceController = app.get<ArtistServiceController>(ArtistServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(artistServiceController.getHello()).toBe('Hello World!');
    });
  });
});
