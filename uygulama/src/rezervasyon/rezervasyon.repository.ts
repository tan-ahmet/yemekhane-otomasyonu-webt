import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { OKUMA_DB, YAZMA_DB, sorgula, yordamCagir } from '../veritabani/veritabani.module';

export interface RezervasyonSatiri {
  id: number;
  menu_id: number;
  durum: 'aktif' | 'kullanildi' | 'iptal';
  ucret: number;
  olusturma: string;
  kullanma_zamani: string | null;
  iptal_zamani: string | null;
  tarih: string;
  yemekhane: string;
  ogun: string;
  rezervasyon_son: string;
  iptal_edilebilir: number;
}

@Injectable()
export class RezervasyonRepository {
  constructor(
    @Inject(YAZMA_DB) private yazma: Pool,
    @Inject(OKUMA_DB) private okuma: Pool,
  ) {}

  yap(kullaniciId: number, menuId: number) {
    return yordamCagir<{ rezervasyon_id: number; ucret: number; bakiye: number }>(this.yazma, 'sp_rezervasyon_yap', [kullaniciId, menuId]);
  }

  iptal(kullaniciId: number, rezervasyonId: number) {
    return yordamCagir<{ rezervasyon_id: number; iade: number; bakiye: number }>(this.yazma, 'sp_rezervasyon_iptal', [
      kullaniciId,
      rezervasyonId,
    ]);
  }

  kullanicininRezervasyonlari(kullaniciId: number, kaynaktan: boolean) {
    return sorgula<RezervasyonSatiri>(
      kaynaktan ? this.yazma : this.okuma,
      `SELECT r.id, r.menu_id, r.durum, r.ucret, r.olusturma, r.kullanma_zamani, r.iptal_zamani,
              m.tarih, yh.ad AS yemekhane, o.ad AS ogun,
              TIMESTAMP(m.tarih, o.son_saat) AS rezervasyon_son,
              (r.durum = 'aktif' AND TIMESTAMP(m.tarih, o.son_saat) > NOW()) AS iptal_edilebilir
         FROM rezervasyonlar r
         JOIN menuler m       ON m.id = r.menu_id
         JOIN yemekhaneler yh ON yh.id = m.yemekhane_id
         JOIN ogunler o       ON o.id = m.ogun_id
        WHERE r.kullanici_id = ?
        ORDER BY m.tarih DESC, o.sira DESC`,
      [kullaniciId],
    );
  }
}
