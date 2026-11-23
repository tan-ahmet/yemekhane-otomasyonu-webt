import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OturumService } from './oturum.service';
import { ROLLER_ANAHTARI } from './roller.decorator';

@Injectable()
export class OturumGuard implements CanActivate {
  constructor(
    private oturum: OturumService,
    private reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const istek = ctx.switchToHttp().getRequest();
    const baslik: string = istek.headers['authorization'] ?? '';
    const token = baslik.startsWith('Bearer ') ? baslik.slice(7) : null;
    if (!token) throw new UnauthorizedException('Oturum açmanız gerekiyor.');

    const kullanici = await this.oturum.getir(token);
    if (!kullanici) throw new UnauthorizedException('Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.');

    const roller = this.reflector.getAllAndOverride<string[]>(ROLLER_ANAHTARI, [ctx.getHandler(), ctx.getClass()]);
    if (roller && !roller.includes(kullanici.rol)) throw new ForbiddenException('Bu işlem için yetkiniz yok.');

    istek.kullanici = kullanici;
    istek.token = token;
    return true;
  }
}
