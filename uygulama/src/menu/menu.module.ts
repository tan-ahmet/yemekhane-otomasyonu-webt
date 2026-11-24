import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuRepository } from './menu.repository';
import { MenuOnbellek } from './menu.onbellek';

@Module({
  controllers: [MenuController],
  providers: [MenuService, MenuRepository, MenuOnbellek],
  exports: [MenuService, MenuOnbellek],
})
export class MenuModule {}
