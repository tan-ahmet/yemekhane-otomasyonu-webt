import { BadRequestException, Injectable } from '@nestjs/common';
import { BakiyeRepository } from './bakiye.repository';
import { OturumKullanicisi, OturumService } from '../oturum/oturum.service';

@Injectable()
export class BakiyeService {
  constructor(
    private bakiyeler: BakiyeRepository,
    private oturum: OturumService,
  ) {}

  async ozet(kullanici: OturumKullanicisi) {
    const kaynaktan = this.oturum.kaynaktanOkunsunMu(kullanici);
    const [bakiye, hareketler] = await Promise.all([
      this.bakiyeler.bakiye(kullanici.id, kaynaktan),
      this.bakiyeler.hareketler(kullanici.id, kaynaktan),
    ]);
    return { okunan_sunucu: kaynaktan ? 'kaynak' : 'replika', bakiye, hareketler };
  }

  async yukle(kullanici: OturumKullanicisi, token: string, govde: { tutar?: unknown }) {
    const tutar = typeof govde?.tutar === 'string' ? Number(govde.tutar) : govde?.tutar;
    if (typeof tutar !== 'number' || !Number.isFinite(tutar)) throw new BadRequestException('Geçerli bir tutar girin.');
    const sonuc = await this.bakiyeler.yukle(kullanici.id, tutar);
    await this.oturum.yazmaYapildi(token, kullanici);
    return { mesaj: `${tutar.toFixed(2)} TL yüklendi.`, hareket_id: sonuc.hareket_id, bakiye: sonuc.bakiye };
  }
}
