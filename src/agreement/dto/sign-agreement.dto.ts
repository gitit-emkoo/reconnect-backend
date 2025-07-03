import { IsString, IsNotEmpty } from 'class-validator';

export class SignAgreementDto {
  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  signedAt: string;
} 