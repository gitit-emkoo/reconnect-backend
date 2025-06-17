import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendMail({ to, subject, html }) {
    // 실제로는 nodemailer 등으로 구현
    console.log(`메일 발송: ${to}, 제목: ${subject}, 내용: ${html}`);
    return true;
  }
} 