import { Injectable } from '@nestjs/common';

@Injectable()
export class AdministrationServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
