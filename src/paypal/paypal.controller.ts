import { Controller, Get, Post, Body } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { CheckoutDTO } from './dto/checkout.dto';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Get('client-token')
  getClientToken() {
    return this.paypalService.getClientToken();
  }

  @Post('checkout')
  processTransaction(@Body() checkoutDto: CheckoutDTO) {
    return this.paypalService.processTransaction(checkoutDto);
  }
}
