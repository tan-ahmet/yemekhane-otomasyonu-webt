import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { RezervasyonService } from './rezervasyon.service';
import { OturumGuard } from '../oturum/oturum.guard';
import { Kullanici, Token } from '../oturum/oturum.decorator';
import { OturumKullanicisi } from '../oturum/oturum.service';

@Controller('rezervasyonlar')
@UseGuards(OturumGuard)
export class RezervasyonController {
  constructor(private rezervasyon: RezervasyonService) {}

  @Get()
  listele(@Kullanici() kullanici: OturumKullanicisi) {
    return this.rezervasyon.listele(kullanici);
  }

  @Post()
  yap(@Kullanici() kullanici: OturumKullanicisi, @Token() token: string, @Body() govde: { menu_id?: unknown; porsiyon?: unknown }) {
    return this.rezervasyon.yap(kullanici, token, govde);
  }

  @Post(':id/iptal')
  @HttpCode(200)
  iptal(@Kullanici() kullanici: OturumKullanicisi, @Token() token: string, @Param('id') id: string) {
    return this.rezervasyon.iptal(kullanici, token, id);
  }
}
