import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';
import { REDIS } from '../redis/redis.module';

export type Rol = 'ogrenci' | 'personel' | 'yonetici';

export interface OturumKullanicisi {
  id: number;
  ad: string;
  soyad: string;
  eposta: string;
  rol: Rol;
  sonYazma?: number;
}

const OTURUM_SURESI = 30 * 60;
const TUTARLILIK_SURESI_MS = 5000;

@Injectable()
export class OturumService {
  private readonly logger = new Logger('Oturum');

  constructor(@Inject(REDIS) private redis: Redis) {}

  private anahtar(token: string) {
    return `oturum:${token}`;
  }

  async olustur(kullanici: OturumKullanicisi): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(this.anahtar(token), JSON.stringify(kullanici), 'EX', OTURUM_SURESI);
    this.logger.log(`Oturum açıldı: kullanıcı ${kullanici.id}`);
    return token;
  }

  async getir(token: string): Promise<OturumKullanicisi | null> {
    if (!/^[a-f0-9]{64}$/.test(token)) return null;
    const veri = await this.redis.getex(this.anahtar(token), 'EX', OTURUM_SURESI);
    return veri ? JSON.parse(veri) : null;
  }

  async yazmaYapildi(token: string, kullanici: OturumKullanicisi): Promise<void> {
    kullanici.sonYazma = Date.now();
    await this.redis.set(this.anahtar(token), JSON.stringify(kullanici), 'EX', OTURUM_SURESI);
  }

  kaynaktanOkunsunMu(kullanici: OturumKullanicisi): boolean {
    return !!kullanici.sonYazma && Date.now() - kullanici.sonYazma < TUTARLILIK_SURESI_MS;
  }

  async sil(token: string): Promise<void> {
    await this.redis.del(this.anahtar(token));
    this.logger.log('Oturum kapatıldı');
  }
}
