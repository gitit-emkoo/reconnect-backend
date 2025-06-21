import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateDiagnosisDto {
  @IsInt()
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsNotEmpty()
  resultType: string;
}
