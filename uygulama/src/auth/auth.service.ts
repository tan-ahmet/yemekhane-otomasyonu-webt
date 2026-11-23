import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { OturumKullanicisi, OturumService } from '../oturum/oturum.service';

@Injectable()
export class AuthService {
  constructor(
    private kullanicilar: AuthRepository,
    private oturum: OturumService,
  ) {}

  async giris(govde: { eposta?: unknown; sifre?: unknown }) {
    const eposta = typeof govde?.eposta === 'string' ? govde.eposta.trim().toLowerCase() : '';
    const sifre = typeof govde?.sifre === 'string' ? govde.sifre : '';
    if (!eposta || !sifre) throw new BadRequestException('E-posta ve şifre zorunludur.');

    const satir = await this.kullanicilar.epostaIleBul(eposta);
    const dogru = satir ? await compare(sifre, satir.sifre_hash) : false;
    if (!satir || !dogru) throw new UnauthorizedException('E-posta veya şifre hatalı.');
    if (!satir.aktif) throw new UnauthorizedException('Hesabınız pasif durumda.');

    const kullanici: OturumKullanicisi = { id: satir.id, ad: satir.ad, soyad: satir.soyad, eposta: satir.eposta, rol: satir.rol };
    const token = await this.oturum.olustur(kullanici);
    return { token, kullanici };
  }

  async cikis(token: string) {
    await this.oturum.sil(token);
    return { mesaj: 'Çıkış yapıldı.' };
  }

  async ben(kullanici: OturumKullanicisi) {
    const profil = await this.kullanicilar.profil(kullanici.id, this.oturum.kaynaktanOkunsunMu(kullanici));
    return {
      id: kullanici.id,
      ad: kullanici.ad,
      soyad: kullanici.soyad,
      eposta: kullanici.eposta,
      rol: kullanici.rol,
      ogrenci_no: profil?.ogrenci_no ?? null,
      bakiye: profil?.bakiye ?? 0,
    };
  }
}
