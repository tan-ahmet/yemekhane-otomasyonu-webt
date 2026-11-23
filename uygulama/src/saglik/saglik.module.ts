import { Module } from '@nestjs/common';
import { SaglikController } from './saglik.controller';
import { SaglikService } from './saglik.service';
import { SaglikRepository } from './saglik.repository';

@Module({
  controllers: [SaglikController],
  providers: [SaglikService, SaglikRepository],
})
export class SaglikModule {}
