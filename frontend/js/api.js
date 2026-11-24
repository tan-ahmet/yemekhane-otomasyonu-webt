const TOKEN_ANAHTARI = 'yemekhane_token';
const ROL_ADLARI = { ogrenci: 'Öğrenci', personel: 'Personel', yonetici: 'Yönetici' };

function tokenAl() {
  return localStorage.getItem(TOKEN_ANAHTARI);
}

function tokenKaydet(token) {
  localStorage.setItem(TOKEN_ANAHTARI, token);
}

function tokenSil() {
  localStorage.removeItem(TOKEN_ANAHTARI);
}

async function api(yol, secenekler = {}) {
  const basliklar = { Accept: 'application/json' };
  const token = tokenAl();
  if (token) basliklar.Authorization = 'Bearer ' + token;

  let govde;
  if (secenekler.govde !== undefined) {
    basliklar['Content-Type'] = 'application/json';
    govde = JSON.stringify(secenekler.govde);
  }

  let yanit;
  try {
    yanit = await fetch('/api' + yol, { method: secenekler.method || 'GET', headers: basliklar, body: govde });
  } catch {
    throw new Error('Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.');
  }

  let veri = null;
  try {
    veri = await yanit.json();
  } catch {
    veri = null;
  }

  if (yanit.status === 401 && token) {
    tokenSil();
    location.href = '/giris.html?sure=doldu';
    throw new Error('Oturumunuzun süresi doldu.');
  }
  if (!yanit.ok) throw new Error((veri && veri.hata) || 'Beklenmeyen bir hata oluştu.');
  return veri;
}

function el(etiket, ozellikler = {}, ...cocuklar) {
  const oge = document.createElement(etiket);
  for (const [ad, deger] of Object.entries(ozellikler)) {
    if (deger === undefined || deger === null || deger === false) continue;
    if (ad === 'sinif') oge.className = deger;
    else if (ad === 'metin') oge.textContent = deger;
    else if (ad.startsWith('on')) oge.addEventListener(ad.slice(2), deger);
    else if (ad in oge && typeof oge[ad] !== 'function') oge[ad] = deger;
    else oge.setAttribute(ad, deger === true ? '' : deger);
  }
  for (const cocuk of cocuklar.flat()) {
    if (cocuk === null || cocuk === undefined || cocuk === false) continue;
    oge.append(cocuk instanceof Node ? cocuk : document.createTextNode(String(cocuk)));
  }
  return oge;
}

function bildirimGoster(oge, mesaj, tur = 'hata') {
  oge.textContent = mesaj;
  oge.className = 'bildirim bildirim-' + tur;
  oge.setAttribute('role', tur === 'hata' ? 'alert' : 'status');
  oge.hidden = false;
  oge.scrollIntoView({ block: 'nearest' });
}

function bildirimGizle(oge) {
  oge.hidden = true;
}

function tl(tutar) {
  return Number(tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

function tarihYaz(metin) {
  return new Date(metin.slice(0, 10) + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
}

function kisaTarihYaz(metin) {
  return new Date(metin.slice(0, 10) + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' });
}

function saatYaz(metin) {
  return metin ? metin.slice(11, 16) : '';
}

function zamanYaz(metin) {
  return metin ? kisaTarihYaz(metin) + ' ' + saatYaz(metin) : '';
}

function secenekleriDoldur(secim, liste, ekMetin) {
  secim.replaceChildren(...liste.map((oge) => el('option', { value: oge.id, metin: ekMetin ? ekMetin(oge) : oge.ad })));
}

async function dugmeKilitle(dugme, is) {
  const eski = dugme.textContent;
  dugme.disabled = true;
  dugme.textContent = 'Bekleyin…';
  try {
    return await is();
  } finally {
    dugme.disabled = false;
    dugme.textContent = eski;
  }
}

function ustBakiyeGuncelle(bakiye) {
  const cip = document.getElementById('ust-bakiye');
  if (cip) cip.textContent = tl(bakiye);
}

async function oturumGerekli(gerekenRol) {
  if (!tokenAl()) {
    location.href = '/giris.html';
    throw new Error('Giriş gerekli');
  }
  const kullanici = await api('/auth/ben');
  if (gerekenRol && kullanici.rol !== gerekenRol) {
    location.href = '/';
    throw new Error('Bu sayfa için yetkiniz yok.');
  }
  ustMenuyuCiz(kullanici);
  return kullanici;
}

function ustMenuyuCiz(kullanici) {
  const baglantilar = [
    ['/', 'Günün Menüsü'],
    ['/haftalik.html', 'Haftalık Menü'],
    ['/rezervasyonlarim.html', 'Rezervasyonlarım'],
    ['/bakiye.html', 'Bakiye'],
    ['/degerlendirme.html', 'Değerlendirme'],
    ['/profil.html', 'Profil'],
  ];
  if (kullanici.rol === 'yonetici') baglantilar.push(['/yonetici.html', 'Yönetici Paneli']);
  const simdiki = location.pathname === '/index.html' ? '/' : location.pathname;

  const cikis = el('button', { type: 'button', sinif: 'cikis', metin: 'Çıkış' });
  cikis.addEventListener('click', async () => {
    await api('/auth/cikis', { method: 'POST' }).catch(() => null);
    tokenSil();
    location.href = '/giris.html?cikis=1';
  });

  const baslik = el(
    'header',
    { sinif: 'ust-cubuk' },
    el(
      'div',
      { sinif: 'kapsayici ust-satir' },
      el('a', { sinif: 'marka', href: '/' }, el('span', { sinif: 'marka-isaret', metin: 'Y' }), 'Yemekhane'),
      el('span', { sinif: 'kullanici-bilgi' }, `${kullanici.ad} ${kullanici.soyad}`, el('small', { metin: ROL_ADLARI[kullanici.rol] })),
      el('a', { sinif: 'bakiye-cip', id: 'ust-bakiye', href: '/bakiye.html', metin: tl(kullanici.bakiye) }),
      cikis,
    ),
    el(
      'nav',
      { sinif: 'gezinme', 'aria-label': 'Ana menü' },
      el(
        'div',
        { sinif: 'kapsayici' },
        baglantilar.map(([adres, ad]) => el('a', { href: adres, metin: ad, 'aria-current': adres === simdiki ? 'page' : null })),
      ),
    ),
  );
  document.body.prepend(baslik);
  baslik.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}
