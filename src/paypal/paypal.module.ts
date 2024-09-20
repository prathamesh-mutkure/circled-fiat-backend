import { Module } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { PaypalController } from './paypal.controller';
import { PrismaService } from 'src/prisma.service';
import { OnchainService } from 'src/onchain/onchain.service';

@Module({
  controllers: [PaypalController],
  providers: [PaypalService, OnchainService, PrismaService],
})
export class PaypalModule {}
