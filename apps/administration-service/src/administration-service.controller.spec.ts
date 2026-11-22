import { Test, TestingModule } from '@nestjs/testing';
import { AdministrationServiceController } from './administration-service.controller';
import { AdministrationServiceService } from './administration-service.service';

describe('AdministrationServiceController', () => {
  let administrationServiceController: AdministrationServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AdministrationServiceController],  
      providers: [AdministrationServiceService],
    }).compile();

    administrationServiceController = app.get<AdministrationServiceController>(AdministrationServiceController);
  });

  describe('root', () => {   
    it('should return "Hello World!"', () => {
      expect(administrationServiceController.getHello()).toBe('Hello World!');
    });
  });
});
