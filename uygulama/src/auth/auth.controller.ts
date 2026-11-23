import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OturumGuard } from '../oturum/oturum.guard';
import { Kullanici, Token } from '../oturum/oturum.decorator';
import { OturumKullanicisi } from '../oturum/oturum.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('giris')
  @HttpCode(200)
  giris(@Body() govde: { eposta?: unknown; sifre?: unknown }) {
    return this.auth.giris(govde);
  }

  @Post('cikis')
  @HttpCode(200)
  @UseGuards(OturumGuard)
  cikis(@Token() token: string) {
    return this.auth.cikis(token);
  }

  @Get('ben')
  @UseGuards(OturumGuard)
  ben(@Kullanici() kullanici: OturumKullanicisi) {
    return this.auth.ben(kullanici);
  }
}
