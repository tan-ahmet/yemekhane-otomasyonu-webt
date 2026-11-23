import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DegerlendirmeRepository } from './degerlendirme.repository';
import { OturumKullanicisi, OturumService } from '../oturum/oturum.service';
import { tamSayiAl } from '../ortak/dogrulama';

@Injectable()
export class DegerlendirmeService {
  constructor(
    private degerlendirmeler: DegerlendirmeRepository,
    private oturum: OturumService,
  ) {}

  async listele(kullanici: OturumKullanicisi) {
    const satirlar = await this.degerlendirmeler.kullanilmisMenuler(kullanici.id, this.oturum.kaynaktanOkunsunMu(kullanici));
    return satirlar.map((s) => ({ ...s, degerlendirilebilir: s.puan === null }));
  }

  async ekle(kullanici: OturumKullanicisi, token: string, govde: { menu_id?: unknown; puan?: unknown; yorum?: unknown }) {
    const menuId = tamSayiAl(govde?.menu_id, 'Menü seçilmedi.');
    const puan = govde?.puan;
    if (typeof puan !== 'number' || !Number.isInteger(puan) || puan < 1 || puan > 5) {
      throw new BadRequestException('Puan 1 ile 5 arasında olmalıdır.');
    }
    const yorumMetni = typeof govde?.yorum === 'string' ? govde.yorum.trim() : '';
    if (yorumMetni.length > 500) throw new BadRequestException('Yorum en fazla 500 karakter olabilir.');
    if (!(await this.degerlendirmeler.kullanildiMi(kullanici.id, menuId))) {
      throw new BadRequestException('Yalnızca kullandığınız menüleri değerlendirebilirsiniz.');
    }

    try {
      await this.degerlendirmeler.ekle(kullanici.id, menuId, puan, yorumMetni || null);
    } catch (hata: any) {
      if (hata?.errno === 1062) throw new ConflictException('Bu menüyü zaten değerlendirdiniz.');
      throw hata;
    }
    await this.oturum.yazmaYapildi(token, kullanici);
    return { mesaj: 'Değerlendirmeniz kaydedildi. Teşekkürler!' };
  }
}
