import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthRequest } from 'types';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.transactionsService.findById(id);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('user/all')
  findByUser(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.transactionsService.findByUser(req.user.id);
  }
}
