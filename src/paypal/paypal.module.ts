import { Module } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { PaypalController } from './paypal.controller';
import { PrismaService } from 'src/prisma.service';
import { OnchainService } from 'src/onchain/onchain.service';
import { TransactionsService } from 'src/transactions/transactions.service';

@Module({
  controllers: [PaypalController],
  providers: [
    PaypalService,
    OnchainService,
    PrismaService,
    TransactionsService,
  ],
})
export class PaypalModule {}
