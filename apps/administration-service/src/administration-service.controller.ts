import { Controller, Get } from '@nestjs/common';
import { AdministrationServiceService } from './administration-service.service';

@Controller()
export class AdministrationServiceController {
  constructor(private readonly administrationServiceService: AdministrationServiceService) {}

  @Get()
  getHello(): string {
    return this.administrationServiceService.getHello();
  }
}
