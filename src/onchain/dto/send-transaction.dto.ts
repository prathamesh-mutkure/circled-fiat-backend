import { IsString, IsNumber } from 'class-validator';

export class SendTransactionDTO {
  @IsString()
  toAddress: string;

  @IsNumber()
  amount: number;
}
