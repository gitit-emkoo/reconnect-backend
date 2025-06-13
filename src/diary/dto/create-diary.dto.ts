import { IsString, IsNotEmpty, IsArray, IsObject } from 'class-validator';

export class CreateDiaryDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsObject()
  emotion: any;

  @IsArray()
  triggers: any[];

  @IsString()
  comment: string;

  @IsArray()
  palette: any[];

  @IsArray()
  randomInfo: any[];

  @IsString()
  userId: string;
} 