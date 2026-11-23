import { Inject, Injectable } from '@nestjs/common';
import { Pool, ResultSetHeader } from 'mysql2/promise';
import { OKUMA_DB, YAZMA_DB, islemIcinde, sorgula } from '../veritabani/veritabani.module';

export interface MenuRaporSatiri {
  menu_id: number;
  tarih: string;
  yemekhane: string;
  ogun: string;
  kapasite: number;
  rezerve: number;
  bos_yer: number;
  doluluk_yuzde: number;
  oy_sayisi: number;
  ortalama_puan: number | null;
  ogrenci_fiyati: number;
  personel_fiyati: number;
}

export interface MenuGirdisi {
  yemekhaneId: number;
  tarih: string;
  ogunId: number;
  ogrenciFiyati: number;
  personelFiyati: number;
  yemekIdleri: number[];
}

export interface MenuKaydi {
  id: number;
  yemekhane_id: number;
  tarih: string;
  ogun_id: number;
  ogrenci_fiyati: number;
  personel_fiyati: number;
}

@Injectable()
export class YonetimRepository {
  constructor(
    @Inject(YAZMA_DB) private yazma: Pool,
    @Inject(OKUMA_DB) private okuma: Pool,
  ) {}

  menuRaporu(baslangic: string, bitis: string, yemekhaneId: number | null) {
    return sorgula<MenuRaporSatiri>(
      this.okuma,
      `SELECT d.menu_id, d.tarih, d.yemekhane, d.ogun, d.kapasite, d.rezerve, d.bos_yer, d.doluluk_yuzde,
              p.oy_sayisi, p.ortalama_puan, m.ogrenci_fiyati, m.personel_fiyati
         FROM v_menu_doluluk d
         JOIN v_menu_puan p ON p.menu_id = d.menu_id
         JOIN menuler m     ON m.id = d.menu_id
         JOIN ogunler o     ON o.id = d.ogun_id
        WHERE d.tarih BETWEEN ? AND ? AND (? IS NULL OR d.yemekhane_id = ?)
        ORDER BY d.tarih DESC, d.yemekhane_id, o.sira`,
      [baslangic, bitis, yemekhaneId, yemekhaneId],
    );
  }

  yemekler() {
    return sorgula<{ id: number; ad: string; kategori: string; kalori: number; vejetaryen: number }>(
      this.okuma,
      `SELECT y.id, y.ad, k.ad AS kategori, y.kalori, y.vejetaryen
         FROM yemekler y JOIN yemek_kategorileri k ON k.id = y.kategori_id
        ORDER BY k.sira, y.ad`,
    );
  }

  async menu(menuId: number) {
    const [menu] = await sorgula<MenuKaydi>(
      this.yazma,
      `SELECT id, yemekhane_id, DATE_FORMAT(tarih, '%Y-%m-%d') AS tarih, ogun_id, ogrenci_fiyati, personel_fiyati
         FROM menuler WHERE id = ?`,
      [menuId],
    );
    if (!menu) return null;
    const yemekler = await sorgula<{ yemek_id: number }>(this.yazma, 'SELECT yemek_id FROM menu_yemekleri WHERE menu_id = ?', [menuId]);
    return { ...menu, yemek_idleri: yemekler.map((y) => y.yemek_id) };
  }

  menuOlustur(g: MenuGirdisi): Promise<number> {
    return islemIcinde(this.yazma, async (b) => {
      const [sonuc] = await b.query<ResultSetHeader>(
        'INSERT INTO menuler (yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati) VALUES (?, ?, ?, ?, ?)',
        [g.yemekhaneId, g.tarih, g.ogunId, g.ogrenciFiyati, g.personelFiyati],
      );
      await b.query('INSERT INTO menu_yemekleri (menu_id, yemek_id) VALUES ?', [g.yemekIdleri.map((y) => [sonuc.insertId, y])]);
      return sonuc.insertId;
    });
  }

  menuGuncelle(menuId: number, g: Pick<MenuGirdisi, 'ogrenciFiyati' | 'personelFiyati' | 'yemekIdleri'>) {
    return islemIcinde(this.yazma, async (b) => {
      await b.query('UPDATE menuler SET ogrenci_fiyati = ?, personel_fiyati = ? WHERE id = ?', [g.ogrenciFiyati, g.personelFiyati, menuId]);
      await b.query('DELETE FROM menu_yemekleri WHERE menu_id = ?', [menuId]);
      await b.query('INSERT INTO menu_yemekleri (menu_id, yemek_id) VALUES ?', [g.yemekIdleri.map((y) => [menuId, y])]);
    });
  }
}
