import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import Redis from 'ioredis';
import { OKUMA_DB, YAZMA_DB, sorgula } from '../veritabani/veritabani.module';
import { REDIS } from '../redis/redis.module';

interface SunucuSatiri {
  sunucu: string;
  salt_okunur: number;
}

@Injectable()
export class SaglikRepository {
  constructor(
    @Inject(YAZMA_DB) private yazma: Pool,
    @Inject(OKUMA_DB) private okuma: Pool,
    @Inject(REDIS) private redis: Redis,
  ) {}

  async kaynak() {
    const [satir] = await sorgula<SunucuSatiri>(this.yazma, 'SELECT @@hostname AS sunucu, @@read_only AS salt_okunur');
    return satir;
  }

  async replika() {
    const [satir] = await sorgula<SunucuSatiri>(this.okuma, 'SELECT @@hostname AS sunucu, @@read_only AS salt_okunur');
    return satir;
  }

  redisPing() {
    return this.redis.ping();
  }
}
