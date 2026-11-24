import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

export const MENU_YAPI_SURUMU = 2;

export function menuAnahtari(yemekhaneId: number, tarih: string, ogunId: number) {
  return `menu:${yemekhaneId}:${tarih}:${ogunId}`;
}

@Injectable()
export class MenuOnbellek implements OnApplicationBootstrap {
  private readonly logger = new Logger('MenuOnbellek');

  constructor(@Inject(REDIS) private redis: Redis) {}

  async onApplicationBootstrap() {
    await this.eskiYapidakileriTemizle();
  }

  async eskiYapidakileriTemizle(): Promise<number> {
    let imlec = '0';
    let taranan = 0;
    let silinen = 0;
    do {
      const [yeni, anahtarlar] = await this.redis.scan(imlec, 'MATCH', 'menu:*', 'COUNT', 200);
      imlec = yeni;
      for (const anahtar of anahtarlar) {
        taranan++;
        const deger = await this.redis.get(anahtar);
        let surum: unknown;
        try {
          surum = deger ? JSON.parse(deger).surum : undefined;
        } catch {
          surum = undefined;
        }
        if (surum !== MENU_YAPI_SURUMU) {
          await this.redis.del(anahtar);
          silinen++;
          this.logger.log(`${anahtar} eski yapıda (sürüm ${surum ?? 'yok'}), silindi`);
        }
      }
    } while (imlec !== '0');
    this.logger.log(`Açılış temizliği: ${taranan} menü kaydı tarandı, eski yapıdaki ${silinen} kayıt silindi (güncel sürüm ${MENU_YAPI_SURUMU})`);
    return silinen;
  }

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
