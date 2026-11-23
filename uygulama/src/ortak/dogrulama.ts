import { BadRequestException } from '@nestjs/common';
import { gecerliTarihMi } from './tarih';

export function tamSayiAl(deger: unknown, mesaj: string): number {
  const sayi = typeof deger === 'string' && deger.trim() !== '' ? Number(deger) : deger;
  if (typeof sayi !== 'number' || !Number.isInteger(sayi) || sayi < 1) throw new BadRequestException(mesaj);
  return sayi;
}

export function tarihAl(deger: unknown, varsayilan?: string): string {
  if ((deger === undefined || deger === '') && varsayilan) return varsayilan;
  if (!gecerliTarihMi(deger)) throw new BadRequestException('Geçerli bir tarih girin (YYYY-AA-GG).');
  return deger;
}

export function tutarAl(deger: unknown, mesaj: string): number {
  if (typeof deger !== 'number' || !Number.isFinite(deger) || deger < 0 || Math.round(deger * 100) !== deger * 100) {
    throw new BadRequestException(mesaj);
  }
  return deger;
}
