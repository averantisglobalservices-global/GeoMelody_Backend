import { NestFactory } from '@nestjs/core';
import { AdministrationServiceModule } from './administration-service.module';

async function bootstrap() {
  const app = await NestFactory.create(
    AdministrationServiceModule,
  );

  await app.listen(3002);

  console.log(
    'Administration Service running on http://localhost:3002',
  );
}

bootstrap();