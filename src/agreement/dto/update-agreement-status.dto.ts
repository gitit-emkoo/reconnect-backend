import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateAgreementStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'signed', 'completed', 'cancelled'])
  status: 'pending' | 'signed' | 'completed' | 'cancelled';
} 