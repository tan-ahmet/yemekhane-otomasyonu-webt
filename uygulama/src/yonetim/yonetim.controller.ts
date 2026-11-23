import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { YonetimService } from './yonetim.service';
import { OturumGuard } from '../oturum/oturum.guard';
import { Roller } from '../oturum/roller.decorator';

@Controller('yonetim')
@UseGuards(OturumGuard)
@Roller('yonetici')
export class YonetimController {
  constructor(private yonetim: YonetimService) {}

  @Get('menuler')
  rapor(@Query('baslangic') baslangic?: string, @Query('bitis') bitis?: string, @Query('yemekhane') yemekhane?: string) {
    return this.yonetim.rapor(baslangic, bitis, yemekhane);
  }

  @Get('yemekler')
  yemekler() {
    return this.yonetim.yemekler();
  }

  @Get('menuler/:id')
  menu(@Param('id') id: string) {
    return this.yonetim.menu(id);
  }

  @Post('menuler')
  olustur(@Body() govde: Record<string, unknown>) {
    return this.yonetim.olustur(govde);
  }

  @Put('menuler/:id')
  guncelle(@Param('id') id: string, @Body() govde: Record<string, unknown>) {
    return this.yonetim.guncelle(id, govde);
  }
}
