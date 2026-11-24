import { Module } from '@nestjs/common';
import { ProfilController } from './profil.controller';
import { ProfilService } from './profil.service';
import { ProfilRepository } from './profil.repository';

@Module({
  controllers: [ProfilController],
  providers: [ProfilService, ProfilRepository],
})
export class ProfilModule {}
