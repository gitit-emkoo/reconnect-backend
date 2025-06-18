import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ContentType } from '@prisma/client';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;
}
