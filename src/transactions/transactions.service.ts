import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prismaService: PrismaService) {}

  create({ userId }: { userId: string }) {
    return this.prismaService.transaction.create({
      data: {
        userId,
      },
    });
  }

  findAll() {
    return this.prismaService.transaction.findMany();
  }

  findById(id: string) {
    return this.prismaService.transaction.findUnique({
      where: {
        id,
      },
    });
  }

  findByUser(userId: string) {
    return this.prismaService.transaction.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        fiatPayment: {
          select: {
            id: true,
            gatewayId: true,
            amountPaid: true,
            fiatCurrency: true,
            status: true,
            paidAt: true,
          },
        },
        onchainPayment: {
          select: {
            id: true,
            txHash: true,
            tokenAmount: true,
            conversionRate: true,
            convertedAt: true,
          },
        },
      },
    });
  }
}
