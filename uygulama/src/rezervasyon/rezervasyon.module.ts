import { Module } from '@nestjs/common';
import { RezervasyonController } from './rezervasyon.controller';
import { RezervasyonService } from './rezervasyon.service';
import { RezervasyonRepository } from './rezervasyon.repository';

@Module({
  controllers: [RezervasyonController],
  providers: [RezervasyonService, RezervasyonRepository],
})
export class RezervasyonModule {}
