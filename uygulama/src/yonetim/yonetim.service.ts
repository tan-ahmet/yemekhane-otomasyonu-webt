import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MenuGirdisi, YonetimRepository } from './yonetim.repository';
import { MenuOnbellek, menuAnahtari } from '../menu/menu.onbellek';
import { bugun, gunEkle } from '../ortak/tarih';
import { tamSayiAl, tarihAl, tutarAl } from '../ortak/dogrulama';

const IKINCI_SILME_MS = 2000;

interface MenuGovdesi {
  yemekhane_id?: unknown;
  tarih?: unknown;
  ogun_id?: unknown;
  ogrenci_fiyati?: unknown;
  personel_fiyati?: unknown;
  yemek_idleri?: unknown;
}

@Injectable()
export class YonetimService {
  constructor(
    private yonetim: YonetimRepository,
    private onbellek: MenuOnbellek,
  ) {}

  async rapor(baslangicMetni: unknown, bitisMetni: unknown, yemekhaneMetni: unknown) {
    const baslangic = tarihAl(baslangicMetni, gunEkle(bugun(), -3));
    const bitis = tarihAl(bitisMetni, gunEkle(bugun(), 3));
    if (baslangic > bitis) throw new BadRequestException('Başlangıç tarihi bitişten sonra olamaz.');
    const yemekhaneId = yemekhaneMetni ? tamSayiAl(yemekhaneMetni, 'Geçerli bir yemekhane seçin.') : null;
    const menuler = await this.yonetim.menuRaporu(baslangic, bitis, yemekhaneId);
    return { baslangic, bitis, menuler };
  }

  yemekler() {
    return this.yonetim.yemekler();
  }

  async menu(idMetni: unknown) {
    const menu = await this.yonetim.menu(tamSayiAl(idMetni, 'Geçersiz menü.'));
    if (!menu) throw new NotFoundException('Menü bulunamadı.');
    return menu;
  }

  async olustur(govde: MenuGovdesi) {
    const girdi: MenuGirdisi = {
      yemekhaneId: tamSayiAl(govde?.yemekhane_id, 'Yemekhane seçin.'),
      tarih: tarihAl(govde?.tarih),
      ogunId: tamSayiAl(govde?.ogun_id, 'Öğün seçin.'),
      ...this.fiyatVeYemekler(govde),
    };
    let menuId: number;
    try {
      menuId = await this.yonetim.menuOlustur(girdi);
    } catch (hata) {
      throw this.cevir(hata);
    }
    await this.onbellegiTemizle(girdi.yemekhaneId, girdi.tarih, girdi.ogunId);
    return { mesaj: 'Menü oluşturuldu.', menu_id: menuId };
  }

  async guncelle(idMetni: unknown, govde: MenuGovdesi) {
    const mevcut = await this.menu(idMetni);
    try {
      await this.yonetim.menuGuncelle(mevcut.id, this.fiyatVeYemekler(govde));
    } catch (hata) {
      throw this.cevir(hata);
    }
    await this.onbellegiTemizle(mevcut.yemekhane_id, mevcut.tarih, mevcut.ogun_id);
    return { mesaj: 'Menü güncellendi.', menu_id: mevcut.id };
  }

  private async onbellegiTemizle(yemekhaneId: number, tarih: string, ogunId: number) {
    const anahtar = menuAnahtari(yemekhaneId, tarih, ogunId);
    await this.onbellek.sil(anahtar, 'yönetici menüyü değiştirdi');
    setTimeout(() => this.onbellek.sil(anahtar, 'replika gecikmesine karşı ikinci silme').catch(() => null), IKINCI_SILME_MS).unref();
  }

  private fiyatVeYemekler(govde: MenuGovdesi) {
    const yemekIdleri = govde?.yemek_idleri;
    if (!Array.isArray(yemekIdleri) || yemekIdleri.length === 0) throw new BadRequestException('Menüye en az bir yemek ekleyin.');
    return {
      ogrenciFiyati: tutarAl(govde?.ogrenci_fiyati, 'Öğrenci fiyatı geçersiz.'),
      personelFiyati: tutarAl(govde?.personel_fiyati, 'Personel fiyatı geçersiz.'),
      yemekIdleri: [...new Set(yemekIdleri.map((y) => tamSayiAl(y, 'Geçersiz yemek seçimi.')))],
    };
  }

  private cevir(hata: any) {
    if (hata?.errno === 1062) return new ConflictException('Bu yemekhane, tarih ve öğün için zaten bir menü var.');
    if (hata?.errno === 1452) return new BadRequestException('Geçersiz yemekhane, öğün ya da yemek seçimi.');
    return hata;
  }
}
