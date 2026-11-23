import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DegerlendirmeService } from './degerlendirme.service';
import { OturumGuard } from '../oturum/oturum.guard';
import { Kullanici, Token } from '../oturum/oturum.decorator';
import { OturumKullanicisi } from '../oturum/oturum.service';

@Controller('degerlendirmeler')
@UseGuards(OturumGuard)
export class DegerlendirmeController {
  constructor(private degerlendirme: DegerlendirmeService) {}

  @Get()
  listele(@Kullanici() kullanici: OturumKullanicisi) {
    return this.degerlendirme.listele(kullanici);
  }

  @Post()
  ekle(@Kullanici() kullanici: OturumKullanicisi, @Token() token: string, @Body() govde: { menu_id?: unknown; puan?: unknown; yorum?: unknown }) {
    return this.degerlendirme.ekle(kullanici, token, govde);
  }
}
