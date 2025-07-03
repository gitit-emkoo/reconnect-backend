import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAgreementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @IsString()
  @IsNotEmpty()
  authorSignature: string;

  @IsString()
  @IsOptional()
  coupleId?: string;
} 