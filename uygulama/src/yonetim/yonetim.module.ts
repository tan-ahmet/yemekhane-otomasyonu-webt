import { Module } from '@nestjs/common';
import { YonetimController } from './yonetim.controller';
import { YonetimService } from './yonetim.service';
import { YonetimRepository } from './yonetim.repository';
import { MenuModule } from '../menu/menu.module';

@Module({
  imports: [MenuModule],
  controllers: [YonetimController],
  providers: [YonetimService, YonetimRepository],
})
export class YonetimModule {}
