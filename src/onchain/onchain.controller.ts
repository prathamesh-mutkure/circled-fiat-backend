import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OnchainService } from './onchain.service';
import { SendTransactionDTO } from './dto/send-transaction.dto';

@Controller('onchain')
export class OnchainController {
  constructor(private readonly onchainService: OnchainService) {}

  @Get('account/data')
  getAccountData() {
    return this.onchainService.getAccountData();
  }

  @Get('convert/:fiat/:amount')
  async tokenToUsd(
    @Param('fiat') fiat: 'usd' | 'inr',
    @Param('amount') amount: number,
  ) {
    return this.onchainService.tokenToFiat({
      amountInToken: amount,
      to: fiat,
    });
  }

  @Post('send')
  sendTransaction(@Body() body: SendTransactionDTO) {
    // return this.onchainService.sendTransaction(body);
    return this.onchainService.cctpTest();
  }
}
