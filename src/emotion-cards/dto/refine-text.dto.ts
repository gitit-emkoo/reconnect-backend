import { IsNotEmpty, IsString } from 'class-validator';

export class RefineTextDto {
  @IsString()
  @IsNotEmpty()
  text!: string;
} 