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

    return this.prisma.communityPost.create({
      data: {
        title,
        content,
        imageUrl,
        tags,
        poll,
        author: { connect: { id: authorId } },
        category: { connect: { id: categoryId } },
      },
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
        }
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
    const existing = await this.prisma.communityPostVote.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      throw new Error('이미 투표하셨습니다.');
    }
    return this.prisma.communityPostVote.create({
      data: {
        postId,
        userId,
        option: String(choice),
      },
    });
  }

  async getPollResult(postId: string) {
    const votes = await this.prisma.communityPostVote.findMany({
      where: { postId },
    });
    const result: Record<string, number> = {};
    for (const vote of votes) {
      result[vote.option] = (result[vote.option] || 0) + 1;
    }
    return result;
  }
}
