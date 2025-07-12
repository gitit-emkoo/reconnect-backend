import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { CreateSupportDto, InquiryType } from './dto/create-support.dto';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupportService {
  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async createInquiry(createSupportDto: CreateSupportDto, user: User) {
    const { title, content, type, attachmentUrl } = createSupportDto;
    
    // 관리자 이메일 주소 (환경변수에서 가져오거나 하드코딩)
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL') || 'admin@reconnect.com';
    
    // 이메일 제목
    const subject = `[고객지원 문의] ${title}`;
    
    // 이메일 내용 HTML 템플릿
    const html = this.generateInquiryEmailHTML({
      user,
      title,
      content,
      type,
      attachmentUrl,
    });

    try {
      // 관리자에게 문의 이메일 전송
      await this.mailService.sendMail({
        to: adminEmail,
        subject,
        html,
      });

      // 사용자에게 접수 확인 이메일 전송
      await this.sendConfirmationEmail(user, title);

      return {
        success: true,
        message: '문의가 성공적으로 접수되었습니다. 확인 이메일을 발송했습니다.',
      };
    } catch (error) {
      throw new Error('문의 접수 중 오류가 발생했습니다.');
    }
  }

  private generateInquiryEmailHTML(data: {
    user: User;
    title: string;
    content: string;
    type: InquiryType;
    attachmentUrl?: string;
  }) {
    const { user, title, content, type, attachmentUrl } = data;
    
    const typeLabels = {
      [InquiryType.GENERAL]: '일반 문의',
      [InquiryType.TECHNICAL]: '기술 문의',
      [InquiryType.BILLING]: '결제 문의',
      [InquiryType.FEATURE_REQUEST]: '기능 요청',
      [InquiryType.BUG_REPORT]: '버그 신고',
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .user-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          .type-badge { display: inline-block; background-color: #007bff; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
          .attachment { margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>새로운 고객지원 문의</h2>
            <p>문의 시간: ${new Date().toLocaleString('ko-KR')}</p>
          </div>
          
          <div class="content">
            <div class="user-info">
              <h3>사용자 정보</h3>
              <p><strong>닉네임:</strong> ${user.nickname || '미입력'}</p>
              <p><strong>이메일:</strong> ${user.email}</p>
              <p><strong>사용자 ID:</strong> ${user.id}</p>
            </div>
            
            <div>
              <h3>문의 내용</h3>
              <p><strong>제목:</strong> ${title}</p>
              <p><strong>유형:</strong> <span class="type-badge">${typeLabels[type]}</span></p>
              <p><strong>내용:</strong></p>
              <div style="white-space: pre-wrap; background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px;">
                ${content}
              </div>
            </div>
            
            ${attachmentUrl ? `
              <div class="attachment">
                <h4>첨부파일</h4>
                <p><a href="${attachmentUrl}" target="_blank">첨부파일 보기</a></p>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async sendConfirmationEmail(user: User, title: string) {
    const subject = '[리커넥트] 문의 접수 확인';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .content { background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>문의 접수 확인</h2>
          </div>
          
          <div class="content">
            <p>안녕하세요, ${user.nickname || '고객'}님</p>
            
            <p>다음 문의가 성공적으로 접수되었습니다:</p>
            <p><strong>제목:</strong> ${title}</p>
            <p><strong>접수 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
            
            <p>빠른 시일 내에 답변드리도록 하겠습니다.</p>
            
            <p>감사합니다.<br>
            리커넥트 팀</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.mailService.sendMail({
      to: user.email,
      subject,
      html,
    });
  }
} 