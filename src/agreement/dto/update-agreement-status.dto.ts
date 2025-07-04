import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateAgreementStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'signed', 'completed', 'issued', 'cancelled'])
  status: 'pending' | 'signed' | 'completed' | 'issued' | 'cancelled';
} 