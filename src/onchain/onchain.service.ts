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
import { CCTP_DATA, CIRCLE_DATA } from 'src/constants';
import { eth } from 'web3';

@Injectable()
export class OnchainService {
  private client: ReturnType<typeof initiateDeveloperControlledWalletsClient>;
  private wallet: Wallet;
  private polWallet: Wallet;

  constructor() {
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY,
      entitySecret: process.env.CIRCLE_SECRET,
    });

    this.client = client;

    this.getWallet();
    this.getPolWallet();

    // this.createWallet();
  }

  async createWallet() {
    // const walletSetResponse = await this.client.createWalletSet({
    //   name: 'WalletSet 1',
    // });

    const walletSetResponse = await this.client.getWalletSet({
      id: CIRCLE_DATA.WALLET_SET_ID,
    });

    const walletsResponse = await this.client.createWallets({
      // @ts-ignore-next
      blockchains: ['MATIC-AMOY'],
      count: 1,
      walletSetId: walletSetResponse.data.walletSet.id ?? '',
    });

    const wallets = walletsResponse.data?.wallets;

    return wallets;
  }

  async getWallet() {
    const response = await this.client.getWallet({
      id: CIRCLE_DATA.ARB_SEP.WALLET_ID,
    });

    this.wallet = response.data.wallet;
  }

  async getPolWallet() {
    const response = await this.client.getWallet({
      id: CIRCLE_DATA.POL_DEV.WALLET_ID,
    });

    this.polWallet = response.data.wallet;
  }

  async getAccountData() {
    const wallet = this.polWallet;

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
    try {
      const wallet = this.wallet;

      const response = await this.client.createTransaction({
        // @ts-ignore-next
        blockchain: CIRCLE_DATA.ARB_SEP.NAME,
        walletId: wallet.id,
        tokenAddress: CIRCLE_DATA.ARB_SEP.USDC_ADDRESS,
        // destinationAddress: toAddress,
        // amount: [amount.toString()],
        destinationAddress: CIRCLE_DATA.ARB_SEP.WALLET_ADDRESS,
        amount: ['0.05'],
        fee: {
          type: 'level',
          config: {
            feeLevel: 'HIGH',
          },
        },
      });

      console.log(response.data);

      return response.data as {
        id: string;
        state: string;
      };
    } catch (e: any) {
      const err = e as AxiosError;

      throw new BadRequestException(
        err.response.data ?? 'Failed to send transaction',
      );
    }
  }

  async cctpTest() {
    const rpc = 'https://iris-api-sandbox.circle.com';

    try {
      const res1 = await this.client.createContractExecutionTransaction({
        walletId: this.wallet.id,
        contractAddress: CIRCLE_DATA.ARB_SEP.USDC_ADDRESS,
        abiFunctionSignature: 'approve(address,uint256)',
        abiParameters: [
          CCTP_DATA.TokenMessenger.ARB_SEP,
          (0.1 * 1000000).toString(),
        ],
        fee: {
          type: 'level',
          config: {
            feeLevel: 'HIGH',
          },
        },
      });

      console.log('here');
      console.log(res1?.data);

      const encodedDestinationAddress = eth.abi.encodeParameter(
        'address',
        CIRCLE_DATA.ETH_SEP.WALLET_ADDRESS,
      );

      const res2 = await this.client.createContractExecutionTransaction({
        walletId: this.wallet.id,
        contractAddress: CIRCLE_DATA.ARB_SEP.USDC_ADDRESS,
        abiFunctionSignature: 'depositForBurn(uint256,uint32,bytes32,address)',
        abiParameters: [
          (0.1 * 1000000).toString(),
          '0',
          encodedDestinationAddress,
          CIRCLE_DATA.ARB_SEP.USDC_ADDRESS,
        ],
        fee: {
          type: 'level',
          config: {
            feeLevel: 'HIGH',
          },
          // type: 'absolute',
          // config: {
          //   gasLimit: '100000000',
          //   maxFee: '1',
          //   priorityFee: '1',
          // },
        },
      });

      console.log('here2');
      console.log(res2?.data);

      return true;
    } catch (e) {
      const err = e as AxiosError;

      console.log(err);
      return false;
    }
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
