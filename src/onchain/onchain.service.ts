import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SendTransactionDTO } from './dto/send-transaction.dto';
import axios, { AxiosError } from 'axios';
import { TokenToFiatDTO } from './dto/token-to-fiat.dto';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { Wallet } from '@circle-fin/developer-controlled-wallets/dist/types/clients/developer-controlled-wallets';

@Injectable()
export class OnchainService {
  private client: ReturnType<typeof initiateDeveloperControlledWalletsClient>;
  private wallets: Wallet[] = [];

  constructor() {
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY,
      entitySecret: process.env.CIRCLE_SECRET,
    });

    this.client = client;

    this.createWallet();
  }

  async createWallet() {
    const walletSetResponse = await this.client.createWalletSet({
      name: 'WalletSet 1',
    });

    // console.log('Created WalletSet', walletSetResponse.data?.walletSet);

    const walletsResponse = await this.client.createWallets({
      blockchains: ['ETH-SEPOLIA'],
      count: 2,
      walletSetId: walletSetResponse.data?.walletSet?.id ?? '',
    });

    const wallets = walletsResponse.data?.wallets;

    // console.log('Created Wallets', wallets);

    this.wallets = wallets ?? [];
  }

  async getAccountData() {
    const wallet = this.wallets[0];

    const response = await this.client.getWalletTokenBalance({
      id: wallet.id,
    });

    return {
      accountAddress: wallet.address,
      blockchain: wallet.blockchain,
      id: wallet.id,
      tokenBalances: response.data.tokenBalances,
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
