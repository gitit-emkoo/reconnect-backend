import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class MailService {
  private transporter: Mail;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT');
    const secure = this.configService.get<boolean>('EMAIL_SECURE');
    const user = this.configService.get<string>('EMAIL_USER');
    // const pass = this.configService.get<string>('EMAIL_PASS'); // 보안상 출력하지 않음

    console.log('EMAIL_HOST:', host);
    console.log('EMAIL_PORT:', port);
    console.log('EMAIL_SECURE:', secure);
    console.log('EMAIL_USER:', user);
    // console.log('EMAIL_PASS:', pass); // 출력하지 않음

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
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