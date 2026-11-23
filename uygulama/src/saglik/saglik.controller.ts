import { Controller, Get } from '@nestjs/common';
import { SaglikService } from './saglik.service';

@Controller()
export class SaglikController {
  constructor(private saglik: SaglikService) {}

  @Get(['', 'saglik'])
  durum() {
    return this.saglik.durum();
  }
}
