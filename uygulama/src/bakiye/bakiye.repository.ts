import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { OKUMA_DB, YAZMA_DB, sorgula, yordamCagir } from '../veritabani/veritabani.module';

export interface HareketSatiri {
  id: number;
  tur: 'yukleme' | 'rezervasyon' | 'iade';
  tutar: number;
  aciklama: string | null;
  olusturma: string;
}

@Injectable()
export class BakiyeRepository {
  constructor(
    @Inject(YAZMA_DB) private yazma: Pool,
    @Inject(OKUMA_DB) private okuma: Pool,
  ) {}

  yukle(kullaniciId: number, tutar: number) {
    return yordamCagir<{ hareket_id: number; bakiye: number }>(this.yazma, 'sp_bakiye_yukle', [kullaniciId, tutar]);
  }

  async bakiye(kullaniciId: number, kaynaktan: boolean) {
    const [satir] = await sorgula<{ bakiye: number }>(kaynaktan ? this.yazma : this.okuma, 'SELECT bakiye FROM kullanicilar WHERE id = ?', [
      kullaniciId,
    ]);
    return satir?.bakiye ?? 0;
  }

  hareketler(kullaniciId: number, kaynaktan: boolean) {
    return sorgula<HareketSatiri>(
      kaynaktan ? this.yazma : this.okuma,
      `SELECT id, tur, tutar, aciklama, olusturma
         FROM bakiye_hareketleri
        WHERE kullanici_id = ?
        ORDER BY olusturma DESC, id DESC
        LIMIT 50`,
      [kullaniciId],
    );
  }
}
