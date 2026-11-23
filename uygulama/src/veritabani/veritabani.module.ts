import { Global, Logger, Module } from '@nestjs/common';
import { createPool, Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export const YAZMA_DB = 'YAZMA_DB';
export const OKUMA_DB = 'OKUMA_DB';

const logger = new Logger('Veritabani');
const havuzAdlari = new WeakMap<Pool, string>();

function havuzOlustur(host: string, ad: string): Pool {
  const havuz = createPool({
    host,
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_ADI,
    user: process.env.DB_KULLANICI,
    password: process.env.DB_SIFRE,
    charset: 'utf8mb4',
    timezone: '+03:00',
    dateStrings: true,
    decimalNumbers: true,
    connectionLimit: 10,
  });
  havuzAdlari.set(havuz, ad);
  return havuz;
}

function kaydet(havuz: Pool, sql: string) {
  logger.log(`[${havuzAdlari.get(havuz)}] ${sql.replace(/\s+/g, ' ').trim().slice(0, 90)}`);
}

export async function sorgula<T>(havuz: Pool, sql: string, parametreler: unknown[] = []): Promise<T[]> {
  kaydet(havuz, sql);
  const [satirlar] = await havuz.query<RowDataPacket[]>(sql, parametreler);
  return satirlar as T[];
}

export async function calistir(havuz: Pool, sql: string, parametreler: unknown[] = []): Promise<ResultSetHeader> {
  kaydet(havuz, sql);
  const [sonuc] = await havuz.query<ResultSetHeader>(sql, parametreler);
  return sonuc;
}

export async function yordamCagir<T>(havuz: Pool, yordam: string, parametreler: unknown[]): Promise<T> {
  kaydet(havuz, `CALL ${yordam}(${parametreler.join(', ')})`);
  const yer = parametreler.map(() => '?').join(', ');
  const [sonuc] = await havuz.query<RowDataPacket[][]>(`CALL ${yordam}(${yer})`, parametreler);
  return sonuc[0][0] as T;
}

export async function islemIcinde<T>(havuz: Pool, is: (baglanti: PoolConnection) => Promise<T>): Promise<T> {
  const baglanti = await havuz.getConnection();
  try {
    await baglanti.beginTransaction();
    const sonuc = await is(baglanti);
    await baglanti.commit();
    return sonuc;
  } catch (hata) {
    await baglanti.rollback();
    throw hata;
  } finally {
    baglanti.release();
  }
}

@Global()
@Module({
  providers: [
    { provide: YAZMA_DB, useFactory: () => havuzOlustur(process.env.DB_YAZMA_HOST!, 'kaynak') },
    { provide: OKUMA_DB, useFactory: () => havuzOlustur(process.env.DB_OKUMA_HOST!, 'replika') },
  ],
  exports: [YAZMA_DB, OKUMA_DB],
})
export class VeritabaniModule {}
