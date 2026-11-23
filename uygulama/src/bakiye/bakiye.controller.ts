import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BakiyeService } from './bakiye.service';
import { OturumGuard } from '../oturum/oturum.guard';
import { Kullanici, Token } from '../oturum/oturum.decorator';
import { OturumKullanicisi } from '../oturum/oturum.service';

@Controller('bakiye')
@UseGuards(OturumGuard)
export class BakiyeController {
  constructor(private bakiye: BakiyeService) {}

  @Get()
  ozet(@Kullanici() kullanici: OturumKullanicisi) {
    return this.bakiye.ozet(kullanici);
  }

  @Post('yukle')
  yukle(@Kullanici() kullanici: OturumKullanicisi, @Token() token: string, @Body() govde: { tutar?: unknown }) {
    return this.bakiye.yukle(kullanici, token, govde);
  }
}
