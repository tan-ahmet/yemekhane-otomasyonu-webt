import { Injectable } from '@nestjs/common';
import { HaftalikSatir, MenuDetaySatiri, MenuRepository } from './menu.repository';
import { MenuOnbellek, menuAnahtari } from './menu.onbellek';
import { OturumKullanicisi, OturumService, Rol } from '../oturum/oturum.service';
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
  yarim_porsiyon_orani: number | null;
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

export function yarimFiyat(fiyat: number, oran: number | null): number | null {
  return oran === null ? null : Math.round(fiyat * oran * 100) / 100;
}

@Injectable()
export class MenuService {
  constructor(
    private menuler: MenuRepository,
    private onbellek: MenuOnbellek,
    private oturum: OturumService,
  ) {}

  private async alerjenHaritasi(kullanici: OturumKullanicisi): Promise<Map<number, string>> {
    const liste = await this.menuler.kullaniciAlerjenleri(kullanici.id, this.oturum.kaynaktanOkunsunMu(kullanici));
    return new Map(liste.map((a) => [a.id, a.ad]));
  }

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
    const alerjenler = await this.alerjenHaritasi(kullanici);
    const fiyat = roleGoreFiyat(kullanici.rol, menu);
    const yemekler = menu.yemekler.map((y) => {
      const uyari = y.alerjen_idler.filter((id) => alerjenler.has(id)).map((id) => alerjenler.get(id)!);
      return { ...y, uyari: uyari.length ? uyari : null };
    });
    return {
      tarih,
      menu: {
        ...menu,
        fiyat,
        yarim_fiyat: yarimFiyat(fiyat, menu.yarim_porsiyon_orani),
        yemekler,
        uyari_sayisi: yemekler.filter((y) => y.uyari).length,
      },
    };
  }

  async menuyuGetir(yemekhaneId: number, tarih: string, ogunId: number): Promise<Menu | null> {
    const anahtar = menuAnahtari(yemekhaneId, tarih, ogunId);
    const onbellekte = await this.onbellek.getir<Menu>(anahtar);
    if (onbellekte) {
      this.onbellek.log(`${anahtar} → Redis'ten okundu`);
      return onbellekte;
    }
    const satirlar = await this.menuler.menuDetay(yemekhaneId, tarih, ogunId);
    if (!satirlar.length) {
      this.onbellek.log(`${anahtar} → veritabanında menü yok`);
      return null;
    }
    const menu = this.menuyuOlustur(satirlar);
    const sure = await this.onbellek.yaz(anahtar, tarih, menu);
    this.onbellek.log(
      `${anahtar} → veritabanından (replika) okundu, ${sure ? `Redis'e yazıldı (TTL ${sure} sn, gün sonuna kadar)` : 'gün geçtiği için önbelleğe yazılmadı'}`,
    );
    return menu;
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
      yarim_porsiyon_orani: ilk.yarim_porsiyon_orani,
      yemekler,
    };
  }

  async haftalik(kullanici: OturumKullanicisi, yemekhaneMetni: unknown, baslangicMetni: unknown) {
    const yemekhaneId = tamSayiAl(yemekhaneMetni, 'Geçerli bir yemekhane seçin.');
    const baslangic = tarihAl(baslangicMetni, bugun());
    const bitis = gunEkle(baslangic, 6);
    const [satirlar, alerjenler] = await Promise.all([
      this.menuler.haftalik(yemekhaneId, baslangic, bitis, kullanici.id),
      this.alerjenHaritasi(kullanici),
    ]);

    const gunler = new Map<string, ReturnType<MenuService['haftalikOgun']>[]>();
    for (let i = 0; i < 7; i++) gunler.set(gunEkle(baslangic, i), []);
    for (const s of satirlar) gunler.get(s.tarih)?.push(this.haftalikOgun(s, kullanici, alerjenler));

    return {
      baslangic,
      bitis,
      bugun: bugun(),
      gunler: [...gunler.entries()].map(([tarih, menuler]) => ({ tarih, menuler })),
    };
  }

  private haftalikOgun(s: HaftalikSatir, kullanici: OturumKullanicisi, alerjenler: Map<number, string>) {
    const fiyat = roleGoreFiyat(kullanici.rol, s);
    const menuAlerjenleri = s.alerjen_idler ? s.alerjen_idler.split(',').map(Number) : [];
    const uyari = menuAlerjenleri.filter((id) => alerjenler.has(id)).map((id) => alerjenler.get(id)!);
    const rezerveli = s.rezervasyon_durum === 'aktif' || s.rezervasyon_durum === 'kullanildi';
    const acik = s.acik === 1;
    return {
      menu_id: s.menu_id,
      ogun_id: s.ogun_id,
      ogun: s.ogun,
      yemekler: s.yemekler,
      kapasite: s.kapasite,
      bos_yer: s.bos_yer,
      fiyat,
      yarim_fiyat: yarimFiyat(fiyat, s.yarim_porsiyon_orani),
      alerjen_uyarisi: uyari.length ? uyari : null,
      rezervasyon_son: s.rezervasyon_son,
      rezervasyon_durum: s.rezervasyon_durum,
      rezerve_edilebilir: acik && s.bos_yer > 0 && !rezerveli,
      pasif_nedeni: rezerveli ? 'Rezervasyonunuz var' : !acik ? 'Son saat geçti' : s.bos_yer <= 0 ? 'Kapasite dolu' : null,
    };
  }
}
