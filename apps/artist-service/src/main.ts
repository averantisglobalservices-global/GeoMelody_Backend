import { NestFactory } from '@nestjs/core';
import { ArtistServiceModule } from './artist-service.module';

async function bootstrap() {
  process.env.STORAGE_UPLOAD_ROOT =
    'apps/artist-service/uploads';

  process.env.STORAGE_PUBLIC_URL =
    'http://localhost:3003';

  const app = await NestFactory.create(
    ArtistServiceModule,
  );

  app.enableCors();

  await app.listen(
    process.env.ARTIST_SERVICE_PORT || 3003,
  );
}

bootstrap();