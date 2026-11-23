export function tarihMetni(t: Date): string {
  const yil = t.getFullYear();
  const ay = String(t.getMonth() + 1).padStart(2, '0');
  const gun = String(t.getDate()).padStart(2, '0');
  return `${yil}-${ay}-${gun}`;
}

export function bugun(): string {
  return tarihMetni(new Date());
}

export function gecerliTarihMi(metin: unknown): metin is string {
  if (typeof metin !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(metin)) return false;
  const t = new Date(`${metin}T00:00:00`);
  return !Number.isNaN(t.getTime()) && tarihMetni(t) === metin;
}

export function gunEkle(metin: string, gun: number): string {
  const t = new Date(`${metin}T00:00:00`);
  t.setDate(t.getDate() + gun);
  return tarihMetni(t);
}
