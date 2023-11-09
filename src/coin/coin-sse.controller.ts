import {
  Controller,
  Get,
  Res,
  Headers,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { CoinService } from './coin.service';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ClientProxy, EventPattern } from '@nestjs/microservices';
import { CoinData } from './coin.interface';

@Controller('coin-sse')
export class CoinSseController implements OnModuleDestroy {
  private destroy$: Subject<void> = new Subject();

  constructor(
    private readonly coinService: CoinService,
    @Inject('COIN_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Get('updates')
  sseUpdates(
    @Res() res: Response,
    @Headers('last-event-id') lastEventId: string,
  ): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const updateInterval = 30000; // 30 seconds
    let lastId = lastEventId || '0';

    const source$ = interval(updateInterval).pipe(
      switchMap(() => this.coinService.getTopFiveCoints()),
      takeUntil(this.destroy$),
    );

    const observer = {
      next: (data: CoinData[]) => {
        lastId = String(Number(lastId) + 1);
        res.write(`id: ${lastId}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      },
      error: () => {
        this.destroy$.next();
        this.destroy$.complete();
        res.end();
      },
    };

    source$.subscribe(observer);
  }

  @EventPattern('coin-update')
  handleCoinUpdate(data: CoinData[]) {
    this.client.emit('coin-sse.updates', data);
  }

  onModuleDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
