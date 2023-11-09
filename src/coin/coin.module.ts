import { Module } from '@nestjs/common';
import { CoinService } from './coin.service';
import { CoinSseController } from './coin-sse.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';
import { config } from '../config/config';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'COIN_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: config.redis.host,
          port: config.redis.port,
        },
      },
    ]),
  ],
  providers: [CoinService],
  exports: [CoinService],
  controllers: [CoinSseController],
})
export class CoinModule {}
