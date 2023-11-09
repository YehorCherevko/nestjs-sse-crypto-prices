import { HttpService } from '@nestjs/axios';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';
import { CoinData } from './coin.interface';
import { config } from '../config/config';

@Injectable()
export class CoinService {
  private readonly logger = new Logger(CoinService.name);

  constructor(private httpService: HttpService) {}

  getTopFiveCoints(): Observable<CoinData[]> {
    const apiUrl = config.apiUrl;

    return this.httpService.get(apiUrl).pipe(
      map((response) => {
        const coins = response.data.data;
        const topCoins = coins
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 5)
          .map(({ id, name, symbol, rank, priceUsd }) => ({
            id,
            name,
            symbol,
            rank,
            priceUsd,
          }));

        return topCoins;
      }),
      catchError((error) => {
        this.logger.error(`Failed to fetch coin data: ${error.message}`);
        return throwError(() => new Error('Unable to fetch coin data'));
      }),
    );
  }
}
