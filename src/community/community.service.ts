import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma } from '@prisma/client';
import { CreateComplaintDto } from './dto/create-complaint.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async createPost(createPostDto: CreatePostDto, authorId: string) {
    const { title, content, categoryId, imageUrl, tags, poll, isPollCategory } = createPostDto;

    // 1단계: 간단 콘텐츠 필터(금칙어, 링크/도배)
    const plain = (title + ' ' + content).replace(/<[^>]*>/g, ' ');
    const BLOCKLIST: RegExp[] = [
      /시발|병신|꺼져|fuck|shit|bitch/i,
      /nigger|faggot|cunt/i,
      /자살|팔아넘기|불법|아동음란/i,
    ];
    const hasBlocked = BLOCKLIST.some(rx => rx.test(plain));
    const tooManyLinks = ((plain.match(/https?:\/\//g) || []).length) > 2;
    const spammy = /([\w가-힣])\1{6,}/.test(plain);
    if (hasBlocked || tooManyLinks || spammy) {
      throw new BadRequestException('가이드라인에 맞지 않는 내용이 포함되어 게시할 수 없습니다.');
    }

    // 카테고리 정보 조회
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, isPollCategory: true },
    });

    if (!category) {
      throw new BadRequestException('존재하지 않는 카테고리입니다.');
    }

    // 투표 카테고리인 경우 poll 데이터 필수
    if (category.isPollCategory) {
      if (!poll || !poll.question || !poll.options || poll.options.length === 0) {
        throw new BadRequestException('투표 카테고리에는 투표 질문과 옵션이 필요합니다.');
      }
    } else {
      // 일반 카테고리인 경우 poll 데이터가 있으면 안 됨
      if (poll) {
        throw new BadRequestException('일반 카테고리에는 투표를 추가할 수 없습니다.');
      }
    }

    const data: Prisma.CommunityPostCreateInput = {
      title,
      content,
      imageUrl,
      tags,
      author: { connect: { id: authorId } },
      category: { connect: { id: categoryId } },
    };

    if (category.isPollCategory && poll) {
      data.poll = {
        question: poll.question,
        options: poll.options.map(option => ({ text: option })),
      };
    }

    return this.prisma.communityPost.create({
      data,
    });
  }

  async getAllPosts(categoryId?: string, page: number = 1, limit: number = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const blockedIds = userId ? (await this.prisma.userBlock.findMany({ where: { blockerId: userId }, select: { blockedId: true } })).map(b => b.blockedId) : [];
    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where: {
          categoryId: categoryId ? categoryId : undefined,
          authorId: blockedIds.length ? { notIn: blockedIds } : undefined,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          createdAt: true,
          poll: true,
          author: {
            select: {
              nickname: true,
            },
          },
          category: true,
          _count: {
            select: { comments: true },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({
        where: {
          categoryId: categoryId ? categoryId : undefined,
          authorId: blockedIds.length ? { notIn: blockedIds } : undefined,
        },
      }),
    ]);
    return { posts, total };
  }

  async findAll(categoryId?: string, search?: string, page: number = 1, limit: number = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.CommunityPostWhereInput = {};
    const blockedIds = userId ? (await this.prisma.userBlock.findMany({ where: { blockerId: userId }, select: { blockedId: true } })).map(b => b.blockedId) : [];

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          tags: {
            has: search,
          },
        },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where: {
          ...where,
          authorId: blockedIds.length ? { notIn: blockedIds } : undefined,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          createdAt: true,
          poll: true,
          author: {
            select: {
              nickname: true,
            },
          },
          category: true,
          _count: {
            select: { comments: true },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({ where: { ...where, authorId: blockedIds.length ? { notIn: blockedIds } : undefined } }),
    ]);
    return { posts, total };
  }

  async getPostById(id: string) {
    await this.prisma.communityPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, nickname: true } },
        category: true,
        comments: {
          include: { author: { select: { id: true, nickname: true } } }
        },
        votes: true
      }
    });
    console.log('[getPostById] id:', id, 'votes:', post?.votes);
    return post;
  }

  async createComment(postId: string, content: string, authorId: string) {
    return this.prisma.comment.create({
      data: {
        content,
        author: { connect: { id: authorId } },
        communityPost: { connect: { id: postId } }
      }
    });
  }

  async createReply(postId: string, parentId: string, content: string, authorId: string) {
    return this.prisma.comment.create({
      data: {
        content,
        author: { connect: { id: authorId } },
        communityPost: { connect: { id: postId } },
        parent: { connect: { id: parentId } },
      }
    });
  }

  async updatePost(postId: string, updateData: any, userId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('게시글을 찾을 수 없습니다.');
    if (post.authorId !== userId) throw new Error('본인 글만 수정할 수 있습니다.');
    return this.prisma.communityPost.update({
      where: { id: postId },
      data: updateData,
    });
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.communityPost.findUnique({ 
      where: { id: postId },
      include: { author: true }
    });
    if (!post) throw new Error('게시글을 찾을 수 없습니다.');
    
    // 사용자 정보 조회
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');
    
    // 본인 글 또는 관리자인 경우에만 삭제 가능
    if (post.authorId !== userId && user.role !== 'ADMIN') {
      throw new Error('본인 글만 삭제할 수 있습니다.');
    }
    
    // 트랜잭션으로 관련 데이터 모두 삭제
    return this.prisma.$transaction(async (tx) => {
      // 관련된 투표 삭제
      await tx.communityPostVote.deleteMany({
        where: { postId }
      });
      
      // 관련된 신고 삭제
      await tx.communityComplaint.deleteMany({
        where: { postId }
      });
      
      // 관련된 댓글 삭제 (cascade로 자동 삭제됨)
      await tx.comment.deleteMany({
        where: { communityPostId: postId }
      });
      
      // 게시글 삭제
      return tx.communityPost.delete({ where: { id: postId } });
    });
  }

  async voteOnPost(postId: string, userId: string, option: string) {
    console.log('[voteOnPost] postId:', postId, 'userId:', userId, 'option:', option);
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { poll: true },
    });

    if (
      !post ||
      !post.poll ||
      typeof post.poll !== 'object' ||
      !('options' in post.poll) ||
      !Array.isArray((post.poll as any).options)
    ) {
      throw new BadRequestException('투표가 가능한 게시글이 아닙니다.');
    }

    const pollData = post.poll as any;
    const isValidOption = pollData.options.some(opt => opt.text === option);
    if (!isValidOption) {
      throw new BadRequestException('유효하지 않은 투표 선택지입니다.');
    }

    const existingVote = await this.prisma.communityPostVote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    // 같은 선택지를 다시 누른 경우: 투표 취소
    if (existingVote && existingVote.option === option) {
      await this.prisma.communityPostVote.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      console.log(`[투표취소] postId=${postId}, userId=${userId}, option=${option}`);
      return { message: '투표가 취소되었습니다.' };
    } else {
      // 다른 선택지로 변경 또는 신규 투표
      const data = await this.prisma.communityPostVote.upsert({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
        update: { option },
        create: {
          userId,
          postId,
          option,
        },
      });
      console.log(`[투표저장] postId=${postId}, userId=${userId}, option=${option}, data=`, data);
      return { message: '투표가 반영되었습니다.', data };
    }
  }

  async getPollResult(postId: string) {
    const votes = await this.prisma.communityPostVote.groupBy({
      by: ['option'],
      where: { postId },
      _count: {
        option: true,
      },
    });

    const result = {};
    for (const group of votes) {
      result[group.option] = group._count.option;
    }
    return result;
  }

  async complaintContent(dto: CreateComplaintDto, reporterId: string) {
    return this.prisma.communityComplaint.create({
      data: {
        postId: dto.postId,
        commentId: dto.commentId,
        reporterId,
        reason: dto.reason,
        etcReason: dto.etcReason,
      }
    });
  }

  async getComplaints() {
    return this.prisma.communityComplaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: { post: true, comment: true, reporter: true }
    });
  }
}
