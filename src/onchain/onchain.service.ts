import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SendTransactionDTO } from './dto/send-transaction.dto';
import axios, { AxiosError } from 'axios';
import { TokenToFiatDTO } from './dto/token-to-fiat.dto';

@Injectable()
export class OnchainService {
  constructor() {}

  async getAccountData() {
    return {
      accountAddress: 'accountAddress',
      publicKey: 'publicKey',
    };
  }

  async sendTransaction({ toAddress, amount }: SendTransactionDTO) {
    return { toAddress, amount };
  }

  async getTokenPrice(token: string = '') {
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd,inr&x_cg_demo_api_key=${process.env.COIN_GECKO_API_KEY}`,
      );

      return res.data as {
        token: {
          usd: number;
          inr: number;
        };
      };
    } catch (e: any) {
      const error = e as AxiosError;
      throw new InternalServerErrorException(
        error.response.data ?? 'Failed to get token price',
      );
    }
  }

  async tokenToFiat({ amountInToken: amountInToken, to }: TokenToFiatDTO) {
    const {
      token: { inr, usd },
    } = await this.getTokenPrice();

    if (to === 'usd') {
      return amountInToken * usd;
    } else if (to === 'inr') {
      return amountInToken * inr;
    }

    throw new BadRequestException('Invalid fiat currency');
  }
}
