import { Module } from '@nestjs/common';
import { VeritabaniModule } from './veritabani/veritabani.module';
import { RedisModule } from './redis/redis.module';
import { OturumModule } from './oturum/oturum.module';
import { SaglikModule } from './saglik/saglik.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { RezervasyonModule } from './rezervasyon/rezervasyon.module';
import { BakiyeModule } from './bakiye/bakiye.module';
import { DegerlendirmeModule } from './degerlendirme/degerlendirme.module';
import { YonetimModule } from './yonetim/yonetim.module';
import { ProfilModule } from './profil/profil.module';

@Module({
  imports: [
    VeritabaniModule,
    RedisModule,
    OturumModule,
    SaglikModule,
    AuthModule,
    MenuModule,
    RezervasyonModule,
    BakiyeModule,
    DegerlendirmeModule,
    YonetimModule,
    ProfilModule,
  ],
})
export class AppModule {}
