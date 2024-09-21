import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PaypalModule } from './paypal/paypal.module';
import { OnchainModule } from './onchain/onchain.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    TransactionsModule,
    PaypalModule,
    OnchainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
