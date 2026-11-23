import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HataFiltresi implements ExceptionFilter {
  private readonly logger = new Logger('Hata');

  catch(hata: any, host: ArgumentsHost) {
    const yanit = host.switchToHttp().getResponse<Response>();

    if (hata?.errno === 1644) {
      this.logger.warn(`Yordam hatası: ${hata.sqlMessage}`);
      return yanit.status(400).json({ hata: hata.sqlMessage });
    }
    if (hata instanceof HttpException) {
      const govde = hata.getResponse();
      const mesaj = typeof govde === 'string' ? govde : (govde as any).message;
      return yanit.status(hata.getStatus()).json({ hata: Array.isArray(mesaj) ? mesaj[0] : mesaj });
    }
    this.logger.error(hata?.sqlMessage ?? hata?.message ?? String(hata));
    return yanit.status(500).json({ hata: 'Beklenmeyen bir hata oluştu.' });
  }
}
