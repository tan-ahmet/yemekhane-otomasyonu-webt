import { Global, Logger, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS = 'REDIS';

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: () => {
        const logger = new Logger('Redis');
        const redis = new Redis({ host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT ?? 6379) });
        redis.on('ready', () => logger.log('Redis bağlantısı hazır'));
        redis.on('error', (hata) => logger.error(hata.message));
        return redis;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
