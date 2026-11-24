import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

export const MENU_YAPI_SURUMU = 1;

export function menuAnahtari(yemekhaneId: number, tarih: string, ogunId: number) {
  return `menu:${yemekhaneId}:${tarih}:${ogunId}`;
}

@Injectable()
export class MenuOnbellek {
  private readonly logger = new Logger('MenuOnbellek');

  constructor(@Inject(REDIS) private redis: Redis) {}

  async getir<T>(anahtar: string): Promise<T | null> {
    const deger = await this.redis.get(anahtar);
    if (!deger) return null;
    const kayit = JSON.parse(deger);
    if (kayit.surum !== MENU_YAPI_SURUMU) {
      await this.redis.del(anahtar);
      this.logger.log(`${anahtar} eski yapıda (sürüm ${kayit.surum}), silindi`);
      return null;
    }
    return kayit.veri as T;
  }

  async yaz(anahtar: string, tarih: string, veri: unknown): Promise<number | null> {
    const gunSonu = Math.floor(new Date(`${tarih}T23:59:59+03:00`).getTime() / 1000);
    const kalan = gunSonu - Math.floor(Date.now() / 1000);
    if (kalan <= 0) return null;
    await this.redis.multi().set(anahtar, JSON.stringify({ surum: MENU_YAPI_SURUMU, veri })).expireat(anahtar, gunSonu).exec();
    return kalan;
  }

  async sil(anahtar: string, neden: string): Promise<void> {
    const silinen = await this.redis.del(anahtar);
    this.logger.log(`${anahtar} silindi (${neden}, ${silinen} kayıt)`);
  }

  log(mesaj: string) {
    this.logger.log(mesaj);
  }
}
