import { Injectable } from '@nestjs/common';
import { SaglikRepository } from './saglik.repository';

@Injectable()
export class SaglikService {
  constructor(private saglik: SaglikRepository) {}

  async durum() {
    const [kaynak, replika, redis] = await Promise.all([this.saglik.kaynak(), this.saglik.replika(), this.saglik.redisPing()]);
    return { durum: 'ok', kaynak, replika, redis };
  }
}
