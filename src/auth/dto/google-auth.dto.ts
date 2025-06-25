import { IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  accessToken: string;

  @IsString()
  @IsOptional()
  unauthDiagnosisId?: string;
} 