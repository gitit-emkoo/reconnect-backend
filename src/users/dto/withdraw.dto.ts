import { IsString, IsIn } from 'class-validator';

export class WithdrawDto {
  @IsString()
  @IsIn(['divorced', 'relationship_better', 'not_satisfied', 'inconvenient'])
  reason: string;
} 