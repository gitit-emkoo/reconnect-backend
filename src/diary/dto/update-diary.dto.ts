import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class UpdateDiaryDto {
  @IsString()
  @IsOptional()
  date?: string;

  @IsObject()
  @IsOptional()
  emotion?: any;

  @IsArray()
  @IsOptional()
  triggers?: any[];

  @IsString()
  @IsOptional()
  comment?: string;

  @IsArray()
  @IsOptional()
  palette?: any[];

  @IsArray()
  @IsOptional()
  randomInfo?: any[];

  @IsString()
  @IsOptional()
  userId?: string;
} 