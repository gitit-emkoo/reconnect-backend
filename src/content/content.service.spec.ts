import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContentType } from '@prisma/client';

// PrismaService를 모킹(가짜로 만들기)합니다.
const mockPrismaService = {
  content: {
    create: jest.fn(),
    findMany: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ContentService', () => {
  let service: ContentService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService, // 실제 PrismaService 대신 모의 객체를 사용
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new content', async () => {
      // 1. 테스트 준비 (Arrange)
      const createContentDto = {
        title: '테스트 제목',
        body: '테스트 본문',
        type: ContentType.ARTICLE,
      };

      const expectedResult = {
        id: 'some-content-id',
        ...createContentDto,
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // prisma.content.create가 호출되면 expectedResult를 반환하도록 설정
      mockPrismaService.content.create.mockResolvedValue(expectedResult);

      // 2. 테스트 실행 (Act)
      const result = await service.create(createContentDto);

      // 3. 결과 검증 (Assert)
      expect(result).toEqual(expectedResult);
      // prisma.content.create가 올바른 데이터와 함께 호출되었는지 확인
      expect(prisma.content.create).toHaveBeenCalledWith({
        data: createContentDto,
      });
    });
  });
}); 