import { IsString, IsNotEmpty, IsOptional, IsUrl, IsArray, ValidateIf, IsObject } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ValidateIf((o) => o.isPollCategory === true)
  @IsObject()
  @IsNotEmpty()
  poll?: {
    question: string;
    options: string[];
  };

  // 프론트엔드에서 카테고리 타입을 전달하기 위한 필드
  @IsOptional()
  isPollCategory?: boolean;
} 