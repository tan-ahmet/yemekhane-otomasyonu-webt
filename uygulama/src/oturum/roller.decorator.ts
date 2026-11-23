import { SetMetadata } from '@nestjs/common';

export const ROLLER_ANAHTARI = 'roller';
export const Roller = (...roller: string[]) => SetMetadata(ROLLER_ANAHTARI, roller);
