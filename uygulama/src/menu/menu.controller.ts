import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { OturumGuard } from '../oturum/oturum.guard';
import { Kullanici } from '../oturum/oturum.decorator';
import { OturumKullanicisi } from '../oturum/oturum.service';

@Controller('menu')
@UseGuards(OturumGuard)
export class MenuController {
  constructor(private menu: MenuService) {}

  @Get('secenekler')
  secenekler() {
    return this.menu.secenekler();
  }

  @Get('gunun')
  gunun(@Kullanici() kullanici: OturumKullanicisi, @Query('yemekhane') yemekhane?: string, @Query('ogun') ogun?: string, @Query('tarih') tarih?: string) {
    return this.menu.gununMenusu(kullanici, yemekhane, ogun, tarih);
  }

  @Get('haftalik')
  haftalik(@Kullanici() kullanici: OturumKullanicisi, @Query('yemekhane') yemekhane?: string, @Query('baslangic') baslangic?: string) {
    return this.menu.haftalik(kullanici, yemekhane, baslangic);
  }
}
