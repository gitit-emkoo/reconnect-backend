import { IsInt, IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateDiagnosisDto {
  @IsInt()
  @IsNotEmpty()
  score: number;

  @IsOptional()
  @IsString()
  resultType?: string;

  @IsOptional()
  @IsString()
  diagnosisType?: string;

  @IsDateString()
  @IsOptional()
  createdAt?: string;
}
