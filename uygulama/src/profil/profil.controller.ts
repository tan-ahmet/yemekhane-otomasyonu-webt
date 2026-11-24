import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ProfilService } from './profil.service';
import { OturumGuard } from '../oturum/oturum.guard';
import { Kullanici, Token } from '../oturum/oturum.decorator';
import { OturumKullanicisi } from '../oturum/oturum.service';

@Controller('profil')
@UseGuards(OturumGuard)
export class ProfilController {
  constructor(private profil: ProfilService) {}

  @Get()
  getir(@Kullanici() kullanici: OturumKullanicisi) {
    return this.profil.getir(kullanici);
  }

  @Put('alerjenler')
  alerjenler(@Kullanici() kullanici: OturumKullanicisi, @Token() token: string, @Body() govde: { alerjen_idleri?: unknown }) {
    return this.profil.alerjenleriKaydet(kullanici, token, govde);
  }
}
