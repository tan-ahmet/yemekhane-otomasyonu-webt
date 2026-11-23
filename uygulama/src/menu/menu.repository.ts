import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { OKUMA_DB, sorgula } from '../veritabani/veritabani.module';

export interface MenuDetaySatiri {
  menu_id: number;
  tarih: string;
  yemekhane_id: number;
  yemekhane: string;
  ogun_id: number;
  ogun: string;
  rezervasyon_son: string;
  ogrenci_fiyati: number;
  personel_fiyati: number;
  yemek_id: number;
  yemek: string;
  kategori: string;
  kategori_sira: number;
  kalori: number;
  vejetaryen: number;
  alerjenler: string | null;
  alerjen_idler: string | null;
}

export interface HaftalikSatir {
  menu_id: number;
  tarih: string;
  ogun_id: number;
  ogun: string;
  kapasite: number;
  bos_yer: number;
  rezervasyon_son: string;
  acik: number;
  ogrenci_fiyati: number;
  personel_fiyati: number;
  yemekler: string | null;
  rezervasyon_id: number | null;
  rezervasyon_durum: string | null;
}

@Injectable()
export class MenuRepository {
  constructor(@Inject(OKUMA_DB) private okuma: Pool) {}

  yemekhaneler() {
    return sorgula<{ id: number; ad: string; kapasite: number }>(this.okuma, 'SELECT id, ad, kapasite FROM yemekhaneler ORDER BY id');
  }

  ogunler() {
    return sorgula<{ id: number; ad: string; son_saat: string }>(
      this.okuma,
      `SELECT id, ad, TIME_FORMAT(son_saat, '%H:%i') AS son_saat FROM ogunler ORDER BY sira`,
    );
  }

  menuDetay(yemekhaneId: number, tarih: string, ogunId: number) {
    return sorgula<MenuDetaySatiri>(
      this.okuma,
      `SELECT * FROM v_menu_detay
        WHERE yemekhane_id = ? AND tarih = ? AND ogun_id = ?
        ORDER BY kategori_sira, yemek`,
      [yemekhaneId, tarih, ogunId],
    );
  }

  haftalik(yemekhaneId: number, baslangic: string, bitis: string, kullaniciId: number) {
    return sorgula<HaftalikSatir>(
      this.okuma,
      `SELECT d.menu_id, d.tarih, d.ogun_id, d.ogun, d.kapasite, d.bos_yer, d.rezervasyon_son,
              d.rezervasyon_son > NOW() AS acik,
              m.ogrenci_fiyati, m.personel_fiyati,
              (SELECT GROUP_CONCAT(y.ad ORDER BY k.sira, y.ad SEPARATOR ', ')
                 FROM menu_yemekleri my
                 JOIN yemekler y ON y.id = my.yemek_id
                 JOIN yemek_kategorileri k ON k.id = y.kategori_id
                WHERE my.menu_id = d.menu_id) AS yemekler,
              r.id AS rezervasyon_id, r.durum AS rezervasyon_durum
         FROM v_menu_doluluk d
         JOIN menuler m ON m.id = d.menu_id
         JOIN ogunler o ON o.id = d.ogun_id
         LEFT JOIN rezervasyonlar r ON r.menu_id = d.menu_id AND r.kullanici_id = ?
        WHERE d.yemekhane_id = ? AND d.tarih BETWEEN ? AND ?
        ORDER BY d.tarih, o.sira`,
      [kullaniciId, yemekhaneId, baslangic, bitis],
    );
  }
}
