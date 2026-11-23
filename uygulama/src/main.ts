import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HataFiltresi } from './ortak/hata.filtresi';

async function baslat() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HataFiltresi());
  app.enableShutdownHooks();
  await app.listen(8000, '0.0.0.0');
  new Logger('Uygulama').log('Uygulama 8000 portunda çalışıyor');
}

baslat();
