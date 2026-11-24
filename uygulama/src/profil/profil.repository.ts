import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { OKUMA_DB, YAZMA_DB, islemIcinde, sorgula } from '../veritabani/veritabani.module';

@Injectable()
export class ProfilRepository {
  constructor(
    @Inject(YAZMA_DB) private yazma: Pool,
    @Inject(OKUMA_DB) private okuma: Pool,
  ) {}

  async kullanici(id: number, kaynaktan: boolean) {
    const [satir] = await sorgula<{ ad: string; soyad: string; eposta: string; rol: string; ogrenci_no: string | null }>(
      kaynaktan ? this.yazma : this.okuma,
      'SELECT ad, soyad, eposta, rol, ogrenci_no FROM kullanicilar WHERE id = ?',
      [id],
    );
    return satir ?? null;
  }

  alerjenler(kullaniciId: number, kaynaktan: boolean) {
    return sorgula<{ id: number; ad: string; secili: number }>(
      kaynaktan ? this.yazma : this.okuma,
      `SELECT a.id, a.ad, (ka.kullanici_id IS NOT NULL) AS secili
         FROM alerjenler a
         LEFT JOIN kullanici_alerjenleri ka ON ka.alerjen_id = a.id AND ka.kullanici_id = ?
        ORDER BY a.ad`,
      [kullaniciId],
    );
  }

  alerjenleriKaydet(kullaniciId: number, alerjenIdleri: number[]) {
    return islemIcinde(this.yazma, async (b) => {
      await b.query('DELETE FROM kullanici_alerjenleri WHERE kullanici_id = ?', [kullaniciId]);
      if (alerjenIdleri.length) {
        await b.query('INSERT INTO kullanici_alerjenleri (kullanici_id, alerjen_id) VALUES ?', [alerjenIdleri.map((a) => [kullaniciId, a])]);
      }
    });
  }
}
