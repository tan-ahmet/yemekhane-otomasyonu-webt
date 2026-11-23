import { Injectable } from '@nestjs/common';
import { HaftalikSatir, MenuDetaySatiri, MenuRepository } from './menu.repository';
import { OturumKullanicisi, Rol } from '../oturum/oturum.service';
import { bugun, gunEkle } from '../ortak/tarih';
import { tamSayiAl, tarihAl } from '../ortak/dogrulama';

export interface Menu {
  menu_id: number;
  tarih: string;
  yemekhane_id: number;
  yemekhane: string;
  ogun_id: number;
  ogun: string;
  rezervasyon_son: string;
  ogrenci_fiyati: number;
  personel_fiyati: number;
  toplam_kalori: number;
  tumu_vejetaryen: boolean;
  yemekler: {
    id: number;
    ad: string;
    kategori: string;
    kalori: number;
    vejetaryen: boolean;
    alerjenler: string[];
    alerjen_idler: number[];
  }[];
}

export function roleGoreFiyat(rol: Rol, f: { ogrenci_fiyati: number; personel_fiyati: number }): number {
  return rol === 'ogrenci' ? f.ogrenci_fiyati : f.personel_fiyati;
}

@Injectable()
export class MenuService {
  constructor(private menuler: MenuRepository) {}

  async secenekler() {
    const [yemekhaneler, ogunler] = await Promise.all([this.menuler.yemekhaneler(), this.menuler.ogunler()]);
    return { bugun: bugun(), yemekhaneler, ogunler };
  }

  async gununMenusu(kullanici: OturumKullanicisi, yemekhaneMetni: unknown, ogunMetni: unknown, tarihMetni: unknown) {
    const yemekhaneId = tamSayiAl(yemekhaneMetni, 'Geçerli bir yemekhane seçin.');
    const ogunId = tamSayiAl(ogunMetni, 'Geçerli bir öğün seçin.');
    const tarih = tarihAl(tarihMetni, bugun());

    const menu = await this.menuyuGetir(yemekhaneId, tarih, ogunId);
    if (!menu) return { tarih, menu: null };
    return { tarih, menu: { ...menu, fiyat: roleGoreFiyat(kullanici.rol, menu) } };
  }

  async menuyuGetir(yemekhaneId: number, tarih: string, ogunId: number): Promise<Menu | null> {
    const satirlar = await this.menuler.menuDetay(yemekhaneId, tarih, ogunId);
    return satirlar.length ? this.menuyuOlustur(satirlar) : null;
  }

  private menuyuOlustur(satirlar: MenuDetaySatiri[]): Menu {
    const ilk = satirlar[0];
    const yemekler = satirlar.map((s) => ({
      id: s.yemek_id,
      ad: s.yemek,
      kategori: s.kategori,
      kalori: s.kalori,
      vejetaryen: s.vejetaryen === 1,
      alerjenler: s.alerjenler ? s.alerjenler.split(', ') : [],
      alerjen_idler: s.alerjen_idler ? s.alerjen_idler.split(',').map(Number) : [],
    }));
    return {
      menu_id: ilk.menu_id,
      tarih: ilk.tarih,
      yemekhane_id: ilk.yemekhane_id,
      yemekhane: ilk.yemekhane,
      ogun_id: ilk.ogun_id,
      ogun: ilk.ogun,
      rezervasyon_son: ilk.rezervasyon_son,
      ogrenci_fiyati: ilk.ogrenci_fiyati,
      personel_fiyati: ilk.personel_fiyati,
      toplam_kalori: yemekler.reduce((toplam, y) => toplam + y.kalori, 0),
      tumu_vejetaryen: yemekler.every((y) => y.vejetaryen),
      yemekler,
    };
  }

  async haftalik(kullanici: OturumKullanicisi, yemekhaneMetni: unknown, baslangicMetni: unknown) {
    const yemekhaneId = tamSayiAl(yemekhaneMetni, 'Geçerli bir yemekhane seçin.');
    const baslangic = tarihAl(baslangicMetni, bugun());
    const bitis = gunEkle(baslangic, 6);
    const satirlar = await this.menuler.haftalik(yemekhaneId, baslangic, bitis, kullanici.id);

    const gunler = new Map<string, ReturnType<MenuService['haftalikOgun']>[]>();
    for (let i = 0; i < 7; i++) gunler.set(gunEkle(baslangic, i), []);
    for (const s of satirlar) gunler.get(s.tarih)?.push(this.haftalikOgun(s, kullanici));

    return {
      baslangic,
      bitis,
      bugun: bugun(),
      gunler: [...gunler.entries()].map(([tarih, menuler]) => ({ tarih, menuler })),
    };
  }

  private haftalikOgun(s: HaftalikSatir, kullanici: OturumKullanicisi) {
    const rezerveli = s.rezervasyon_durum === 'aktif' || s.rezervasyon_durum === 'kullanildi';
    const acik = s.acik === 1;
    return {
      menu_id: s.menu_id,
      ogun_id: s.ogun_id,
      ogun: s.ogun,
      yemekler: s.yemekler,
      kapasite: s.kapasite,
      bos_yer: s.bos_yer,
      fiyat: roleGoreFiyat(kullanici.rol, s),
      rezervasyon_son: s.rezervasyon_son,
      rezervasyon_durum: s.rezervasyon_durum,
      rezerve_edilebilir: acik && s.bos_yer > 0 && !rezerveli,
      pasif_nedeni: rezerveli ? 'Rezervasyonunuz var' : !acik ? 'Son saat geçti' : s.bos_yer <= 0 ? 'Kapasite dolu' : null,
    };
  }
}
