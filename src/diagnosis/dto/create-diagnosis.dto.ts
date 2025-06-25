import { IsInt, IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateDiagnosisDto {
  @IsInt()
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  resultType?: string;

  @IsDateString()
  @IsOptional()
  createdAt?: string;
}
