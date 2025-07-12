import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum InquiryType {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING = 'billing',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
}

export class CreateSupportDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(InquiryType)
  @IsNotEmpty()
  type: InquiryType;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;
} 