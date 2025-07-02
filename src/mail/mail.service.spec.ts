import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'EMAIL_FROM') return 'test@example.com';
              return 'mock-value';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send mail successfully', async () => {
    const result = await service.sendMail({
      to: 'user@example.com',
      subject: '테스트 메일',
      html: '<b>테스트</b>',
    });
    expect(result).toBe(true);
  });

  it('should throw error if sendMail fails', async () => {
    (service as any).transporter.sendMail = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(
      service.sendMail({
        to: 'user@example.com',
        subject: '테스트 메일',
        html: '<b>테스트</b>',
      }),
    ).rejects.toThrow('이메일 발송에 실패했습니다.');
  });
}); 