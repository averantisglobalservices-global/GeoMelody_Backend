import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '@geomelody/database';

@Controller('health')
export class AuthServiceController {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  @Get('database')
  async databaseHealth() {
    try {
      await this.databaseService.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: 'connected',
      };
    } catch {
      return {
        status: 'error',
        database: 'disconnected',
      };
    }
  }
}