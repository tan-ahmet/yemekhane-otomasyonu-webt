import { BadRequestException, Injectable } from '@nestjs/common';
import { Porsiyon, RezervasyonRepository } from './rezervasyon.repository';
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

  async yap(kullanici: OturumKullanicisi, token: string, govde: { menu_id?: unknown; porsiyon?: unknown }) {
    const menuId = tamSayiAl(govde?.menu_id, 'Menü seçilmedi.');
    const porsiyon = govde?.porsiyon ?? 'tam';
    if (porsiyon !== 'tam' && porsiyon !== 'yarim') throw new BadRequestException('Geçersiz porsiyon seçimi.');
    const sonuc = await this.rezervasyonlar.yap(kullanici.id, menuId, porsiyon as Porsiyon);
    await this.oturum.yazmaYapildi(token, kullanici);
    return {
      mesaj: sonuc.porsiyon === 'yarim' ? 'Yarım porsiyon rezervasyonunuz alındı.' : 'Rezervasyonunuz alındı.',
      rezervasyon_id: sonuc.rezervasyon_id,
      porsiyon: sonuc.porsiyon,
      ucret: sonuc.ucret,
      bakiye: sonuc.bakiye,
    };
  }

  async iptal(kullanici: OturumKullanicisi, token: string, idMetni: unknown) {
    const rezervasyonId = tamSayiAl(idMetni, 'Geçersiz rezervasyon.');
    const sonuc = await this.rezervasyonlar.iptal(kullanici.id, rezervasyonId);
    await this.oturum.yazmaYapildi(token, kullanici);
    return { mesaj: 'Rezervasyon iptal edildi, ücret iade edildi.', iade: sonuc.iade, bakiye: sonuc.bakiye };
  }
}
