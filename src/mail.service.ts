import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendMail({ to, subject, html }) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject,
        html,
      });
      console.log('Message sent: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      // 프로덕션에서는 더 정교한 에러 로깅/처리가 필요할 수 있습니다.
      throw new Error('이메일 발송에 실패했습니다.');
    }
  }
} 