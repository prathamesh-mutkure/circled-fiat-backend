import { IsString, IsNumber } from 'class-validator';

export class TokenToFiatDTO {
  @IsNumber()
  amountInToken: number;

  @IsString()
  to: 'usd' | 'inr';
}
