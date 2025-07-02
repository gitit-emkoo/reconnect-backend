import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from './community.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

// PrismaClient를 모킹하기 위한 타입
type MockPrismaClient = {
  communityPostVote: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  communityPost: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

// PrismaService 모킹
const prismaMock: MockPrismaClient = {
  communityPostVote: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  communityPost: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation(async (callback) => {
    // 트랜잭션 콜백을 모방하여 즉시 실행
    const prisma = {
      communityPostVote: {
        create: prismaMock.communityPostVote.create,
        update: prismaMock.communityPostVote.update,
        delete: prismaMock.communityPostVote.delete,
      },
      communityPost: {
        update: prismaMock.communityPost.update,
      },
    };
    return await callback(prisma);
  }),
};

describe('CommunityService', () => {
  let service: CommunityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        {
          provide: PrismaService,
          useValue: prismaMock, // 실제 PrismaService 대신 모의 객체 사용
        },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
    jest.clearAllMocks(); // 각 테스트 전에 모의 함수 호출 기록 초기화
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('voteOnPost', () => {
    const postId = 'test-post-id';
    const userId = 'test-user-id';

    it('찬성(1): 사용자가 처음 투표하는 경우', async () => {
      prismaMock.communityPostVote.findUnique.mockResolvedValue(null); // 기존 투표 없음

      await service.voteOnPost(postId, userId, '1');

      // 트랜잭션이 한 번 호출되었는지 확인
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

      // 새 투표가 생성되었는지 확인
      expect(prismaMock.communityPostVote.create).toHaveBeenCalledWith({
        data: { postId, userId, option: '1' },
      });
      // 게시글의 찬성 수가 1 증가했는지 확인
      expect(prismaMock.communityPost.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { agreeVotes: { increment: 1 } },
      });
    });

    it('찬성(1) -> 반대(2): 투표를 변경하는 경우', async () => {
      // 사용자는 이미 '1'(찬성)에 투표한 상태
      prismaMock.communityPostVote.findUnique.mockResolvedValue({ id: 'vote-id', postId, userId, option: '1' });

      await service.voteOnPost(postId, userId, '2'); // '2'(반대)로 변경

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      
      // 투표가 업데이트되었는지 확인
      expect(prismaMock.communityPostVote.update).toHaveBeenCalledWith({
        where: { postId_userId: { postId, userId } },
        data: { option: '2' },
      });
      // 게시글의 찬성 수는 1 감소하고, 반대 수는 1 증가했는지 확인
      expect(prismaMock.communityPost.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          agreeVotes: { decrement: 1, increment: 0 },
          disagreeVotes: { increment: 1, decrement: 0 },
        },
      });
    });

    it('찬성(1) -> 찬성(1): 투표를 취소하는 경우', async () => {
      // 사용자는 이미 '1'(찬성)에 투표한 상태
      prismaMock.communityPostVote.findUnique.mockResolvedValue({ id: 'vote-id', postId, userId, option: '1' });
      
      await service.voteOnPost(postId, userId, '1'); // 다시 '1'(찬성)을 누름

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

      // 투표가 삭제되었는지 확인
      expect(prismaMock.communityPostVote.delete).toHaveBeenCalledWith({
        where: { postId_userId: { postId, userId } },
      });
      // 게시글의 찬성 수가 1 감소했는지 확인
      expect(prismaMock.communityPost.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { 
          agreeVotes: { decrement: 1, increment: 0 },
          disagreeVotes: { decrement: 0, increment: 0 },
        },
      });
    });

    it('choice가 1 또는 2가 아닌 경우 에러를 던져야 합니다', async () => {
      await expect(service.voteOnPost(postId, userId, '3')).rejects.toThrow(
        new BadRequestException('투표 선택지는 1(찬성) 또는 2(반대)여야 합니다.')
      );
    });
  });
});
