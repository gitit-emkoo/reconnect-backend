import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async createPost(createPostDto: CreatePostDto, authorId: string) {
    const { title, content, categoryId, imageUrl, tags, poll, isPollCategory } = createPostDto;

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

  async getAllPosts(categoryId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where: {
          categoryId: categoryId ? categoryId : undefined,
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
        },
      }),
    ]);
    return { posts, total };
  }

  async findAll(categoryId?: string, search?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.CommunityPostWhereInput = {};

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
        where,
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
      this.prisma.communityPost.count({ where }),
    ]);
    return { posts, total };
  }

  async getPostById(id: string) {
    await this.prisma.communityPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { nickname: true } },
        category: true,
        comments: {
          include: { author: { select: { nickname: true } } }
        },
        votes: true
      }
    });
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
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('게시글을 찾을 수 없습니다.');
    if (post.authorId !== userId) throw new Error('본인 글만 삭제할 수 있습니다.');
    return this.prisma.communityPost.delete({ where: { id: postId } });
  }

  async voteOnPost(postId: string, userId: string, choice: number) {
    if (choice !== 1 && choice !== 2) {
      throw new BadRequestException('투표 선택지는 1(찬성) 또는 2(반대)여야 합니다.');
    }

    const option = String(choice); // 숫자 1, 2를 문자열 "1", "2"로 변경

    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post || !post.poll) {
      throw new BadRequestException('투표가 가능한 게시글이 아닙니다.');
    }

    const existingVote = await this.prisma.communityPostVote.findUnique({
            where: { postId_userId: { postId, userId } },
          });
          
    // 같은 선택지를 다시 누른 경우: 투표 취소 (삭제)
    if (existingVote && existingVote.option === option) {
      return this.prisma.communityPostVote.delete({
            where: { postId_userId: { postId, userId } },
          });
        }

    // 신규 투표 또는 다른 선택지로 변경: upsert 사용
    return this.prisma.communityPostVote.upsert({
      where: { postId_userId: { postId, userId } },
      update: { option }, // 이미 투표한 경우 선택지를 업데이트
      create: { 
        userId, 
        postId, 
        option, 
      }, // 새로 투표하는 경우 생성
    });
  }

  async getPollResult(postId: string) {
    const voteGroups = await this.prisma.communityPostVote.groupBy({
      where: { postId },
      by: ['option'],
      _count: {
        option: true,
      },
    });

    const result: Record<string, number> = {};
    for (const group of voteGroups) {
      result[group.option] = group._count.option;
    }
    return result;
  }
}
