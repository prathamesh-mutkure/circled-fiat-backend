import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CheckoutDTO } from './dto/checkout.dto';
import * as braintree from 'braintree';
import { TransactionsService } from 'src/transactions/transactions.service';
import { PrismaService } from 'src/prisma.service';
import { OnchainService } from 'src/onchain/onchain.service';

type Environment = 'Sandbox' | 'Production';

@Injectable()
export class PaypalService {
  private gateway: braintree.BraintreeGateway;

  constructor(
    private readonly onchainService: OnchainService,
    private readonly transactionsService: TransactionsService,
    private readonly prisma: PrismaService,
  ) {
    this.gateway = new braintree.BraintreeGateway({
      environment:
        braintree.Environment[process.env.BRAINTREE_ENVIRONMENT as Environment],
      merchantId: process.env.BRAINTREE_MERCHANT_ID as string,
      publicKey: process.env.BRAINTREE_PUBLIC_KEY as string,
      privateKey: process.env.BRAINTREE_PRIVATE_KEY as string,
    });
  }

  async getClientToken() {
    try {
      const res = await this.gateway.clientToken.generate({});

      return res.clientToken;
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        'Error generating braintree client token',
      );
    }
  }

  async processTransaction({ nonce, toAddress, tokenAmount }: CheckoutDTO) {
    if (!nonce || !toAddress || !tokenAmount) {
      throw new BadRequestException('Missing required fields');
    }

    if (tokenAmount <= 0 || isNaN(tokenAmount) || tokenAmount >= 0.5) {
      throw new BadRequestException(
        'For testing purposes, we have restricted the amount between 0.01-0.5',
      );
    }

    const userId = '7e93dcfe-3b25-45a9-a3b9-9cf10ccc8e2e';

    try {
      // Converted Token to USD
      // const fiatAmount = await this.onchainService.tokenToFiat({
      //   amountInToken: tokenAmount,
      //   to: 'usd',
      // });

      const fiatAmount = tokenAmount;

      // Created new Transaction in database
      const transaction = await this.transactionsService.create({ userId });

      // Processed Payment
      const payment = await this.gateway.transaction.sale({
        amount: fiatAmount.toFixed(2).toString(),
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      });

      // Add FiatPayment details to Transaction
      const fiatPayment = await this.prisma.fiatPayment.create({
        data: {
          gatewayId: payment.transaction.id,
          amountPaid: parseFloat(payment.transaction.amount),
          fiatCurrency: payment.transaction.currencyIsoCode,
          transactionId: transaction.id,
          status: payment.success ? 'COMPLETED' : 'FAILED',
          paidAt: new Date(payment.transaction.createdAt),
        },
      });

      if (!payment.success) {
        throw new InternalServerErrorException('Payment failed');
      }

      console.log(`Payment ID: ${payment.transaction.id}`);

      // Execute Txn Onchain
      const txn = await this.onchainService.sendTransaction({
        amount: tokenAmount,
        toAddress,
      });

      // Save onchainPayment details to Transaction
      const onchainPayment = await this.prisma.onchainPayment.create({
        data: {
          // @ts-ignore
          // txHash: txn.onchainPayment,
          // tokenAmount: tokenAmount,
          // conversionCurrency: payment.transaction.currencyIsoCode,
          // conversionRate: fiatAmount / tokenAmount,
          // transactionId: transaction.id,
          txHash: txn.id,
          tokenAmount: tokenAmount,
          conversionCurrency: 'USD',
          conversionRate: 1,
          transactionId: transaction.id,
        },
      });

      console.log(`Transaction ID: ${'txn.hash'}`);

      // Mark Transaction as complete
      await this.prisma.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: 'COMPLETED',
        },
      });

      return {
        message: 'Payment processed successfully',
        id: transaction.id,
        gatewayId: fiatPayment.gatewayId,
        txHash: txn.id,
      };
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        err?.message ?? 'Error processing payment',
      );
    }
  }
}
