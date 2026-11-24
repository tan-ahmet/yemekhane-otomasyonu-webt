import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfilRepository } from './profil.repository';
import { OturumKullanicisi, OturumService } from '../oturum/oturum.service';
import { tamSayiAl } from '../ortak/dogrulama';

@Injectable()
export class ProfilService {
  constructor(
    private profil: ProfilRepository,
    private oturum: OturumService,
  ) {}

  async getir(kullanici: OturumKullanicisi) {
    const kaynaktan = this.oturum.kaynaktanOkunsunMu(kullanici);
    const [bilgi, alerjenler] = await Promise.all([this.profil.kullanici(kullanici.id, kaynaktan), this.profil.alerjenler(kullanici.id, kaynaktan)]);
    return { ...bilgi, alerjenler: alerjenler.map((a) => ({ id: a.id, ad: a.ad, secili: a.secili === 1 })) };
  }

  async alerjenleriKaydet(kullanici: OturumKullanicisi, token: string, govde: { alerjen_idleri?: unknown }) {
    const liste = govde?.alerjen_idleri;
    if (!Array.isArray(liste) || liste.length > 14) throw new BadRequestException('Alerjen listesi geçersiz.');
    const idler = [...new Set(liste.map((a) => tamSayiAl(a, 'Geçersiz alerjen seçimi.')))];
    try {
      await this.profil.alerjenleriKaydet(kullanici.id, idler);
    } catch (hata: any) {
      if (hata?.errno === 1452) throw new BadRequestException('Geçersiz alerjen seçimi.');
      throw hata;
    }
    await this.oturum.yazmaYapildi(token, kullanici);
    return {
      mesaj: idler.length
        ? `Alerjenleriniz kaydedildi (${idler.length}). Menülerde bu alerjenleri içeren yemekler uyarıyla gösterilecek.`
        : 'Alerjen seçiminiz temizlendi.',
    };
  }
}
