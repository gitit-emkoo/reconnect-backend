import { IsString, IsOptional } from 'class-validator';

export class CreateComplaintDto {
  @IsString()
  @IsOptional()
  postId?: string;

  @IsString()
  @IsOptional()
  commentId?: string;

  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  etcReason?: string;
} 