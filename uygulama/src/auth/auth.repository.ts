import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { OKUMA_DB, YAZMA_DB, sorgula } from '../veritabani/veritabani.module';
import { Rol } from '../oturum/oturum.service';

export interface KullaniciSatiri {
  id: number;
  ad: string;
  soyad: string;
  eposta: string;
  sifre_hash: string;
  rol: Rol;
  ogrenci_no: string | null;
  bakiye: number;
  aktif: number;
}

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(YAZMA_DB) private yazma: Pool,
    @Inject(OKUMA_DB) private okuma: Pool,
  ) {}

  async epostaIleBul(eposta: string): Promise<KullaniciSatiri | null> {
    const [satir] = await sorgula<KullaniciSatiri>(
      this.okuma,
      `SELECT id, ad, soyad, eposta, sifre_hash, rol, ogrenci_no, bakiye, aktif
         FROM kullanicilar
        WHERE eposta = ?`,
      [eposta],
    );
    return satir ?? null;
  }

  async profil(id: number, kaynaktan: boolean) {
    const [satir] = await sorgula<Pick<KullaniciSatiri, 'ogrenci_no' | 'bakiye'>>(
      kaynaktan ? this.yazma : this.okuma,
      'SELECT ogrenci_no, bakiye FROM kullanicilar WHERE id = ?',
      [id],
    );
    return satir ?? null;
  }
}
