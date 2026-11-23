import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { OKUMA_DB, YAZMA_DB, calistir, sorgula } from '../veritabani/veritabani.module';

export interface KullanilmisMenuSatiri {
  menu_id: number;
  tarih: string;
  yemekhane: string;
  ogun: string;
  yemekler: string | null;
  puan: number | null;
  yorum: string | null;
}

@Injectable()
export class DegerlendirmeRepository {
  constructor(
    @Inject(YAZMA_DB) private yazma: Pool,
    @Inject(OKUMA_DB) private okuma: Pool,
  ) {}

  kullanilmisMenuler(kullaniciId: number, kaynaktan: boolean) {
    return sorgula<KullanilmisMenuSatiri>(
      kaynaktan ? this.yazma : this.okuma,
      `SELECT m.id AS menu_id, m.tarih, yh.ad AS yemekhane, o.ad AS ogun,
              (SELECT GROUP_CONCAT(y.ad ORDER BY k.sira, y.ad SEPARATOR ', ')
                 FROM menu_yemekleri my
                 JOIN yemekler y ON y.id = my.yemek_id
                 JOIN yemek_kategorileri k ON k.id = y.kategori_id
                WHERE my.menu_id = m.id) AS yemekler,
              d.puan, d.yorum
         FROM rezervasyonlar r
         JOIN menuler m       ON m.id = r.menu_id
         JOIN yemekhaneler yh ON yh.id = m.yemekhane_id
         JOIN ogunler o       ON o.id = m.ogun_id
         LEFT JOIN degerlendirmeler d ON d.menu_id = m.id AND d.kullanici_id = r.kullanici_id
        WHERE r.kullanici_id = ? AND r.durum = 'kullanildi'
        ORDER BY m.tarih DESC, o.sira DESC`,
      [kullaniciId],
    );
  }

  async kullanildiMi(kullaniciId: number, menuId: number): Promise<boolean> {
    const satirlar = await sorgula(
      this.yazma,
      `SELECT 1 FROM rezervasyonlar WHERE kullanici_id = ? AND menu_id = ? AND durum = 'kullanildi'`,
      [kullaniciId, menuId],
    );
    return satirlar.length > 0;
  }

  ekle(kullaniciId: number, menuId: number, puan: number, yorum: string | null) {
    return calistir(this.yazma, 'INSERT INTO degerlendirmeler (kullanici_id, menu_id, puan, yorum) VALUES (?, ?, ?, ?)', [
      kullaniciId,
      menuId,
      puan,
      yorum,
    ]);
  }
}
