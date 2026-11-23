import { Module } from '@nestjs/common';
import { DegerlendirmeController } from './degerlendirme.controller';
import { DegerlendirmeService } from './degerlendirme.service';
import { DegerlendirmeRepository } from './degerlendirme.repository';

@Module({
  controllers: [DegerlendirmeController],
  providers: [DegerlendirmeService, DegerlendirmeRepository],
})
export class DegerlendirmeModule {}
