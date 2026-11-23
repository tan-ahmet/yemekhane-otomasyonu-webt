import { Module } from '@nestjs/common';
import { BakiyeController } from './bakiye.controller';
import { BakiyeService } from './bakiye.service';
import { BakiyeRepository } from './bakiye.repository';

@Module({
  controllers: [BakiyeController],
  providers: [BakiyeService, BakiyeRepository],
})
export class BakiyeModule {}
