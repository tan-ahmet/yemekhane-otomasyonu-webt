import { Injectable } from '@nestjs/common';
import { RezervasyonRepository } from './rezervasyon.repository';
import { OturumKullanicisi, OturumService } from '../oturum/oturum.service';
import { tamSayiAl } from '../ortak/dogrulama';

@Injectable()
export class RezervasyonService {
  constructor(
    private rezervasyonlar: RezervasyonRepository,
    private oturum: OturumService,
  ) {}

  async listele(kullanici: OturumKullanicisi) {
    const kaynaktan = this.oturum.kaynaktanOkunsunMu(kullanici);
    const satirlar = await this.rezervasyonlar.kullanicininRezervasyonlari(kullanici.id, kaynaktan);
    return {
      okunan_sunucu: kaynaktan ? 'kaynak' : 'replika',
      rezervasyonlar: satirlar.map((r) => ({ ...r, iptal_edilebilir: r.iptal_edilebilir === 1 })),
    };
  }

  async yap(kullanici: OturumKullanicisi, token: string, govde: { menu_id?: unknown }) {
    const menuId = tamSayiAl(govde?.menu_id, 'Menü seçilmedi.');
    const sonuc = await this.rezervasyonlar.yap(kullanici.id, menuId);
    await this.oturum.yazmaYapildi(token, kullanici);
    return { mesaj: 'Rezervasyonunuz alındı.', rezervasyon_id: sonuc.rezervasyon_id, ucret: sonuc.ucret, bakiye: sonuc.bakiye };
  }

  async iptal(kullanici: OturumKullanicisi, token: string, idMetni: unknown) {
    const rezervasyonId = tamSayiAl(idMetni, 'Geçersiz rezervasyon.');
    const sonuc = await this.rezervasyonlar.iptal(kullanici.id, rezervasyonId);
    await this.oturum.yazmaYapildi(token, kullanici);
    return { mesaj: 'Rezervasyon iptal edildi, ücret iade edildi.', iade: sonuc.iade, bakiye: sonuc.bakiye };
  }
}
