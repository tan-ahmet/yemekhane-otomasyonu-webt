import { Global, Module } from '@nestjs/common';
import { OturumService } from './oturum.service';
import { OturumGuard } from './oturum.guard';

@Global()
@Module({
  providers: [OturumService, OturumGuard],
  exports: [OturumService, OturumGuard],
})
export class OturumModule {}
