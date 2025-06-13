import { IsNumber } from 'class-validator';

export class VoteDto {
  @IsNumber()
  choice: number;
} 