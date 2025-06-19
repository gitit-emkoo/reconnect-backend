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

    const choiceStr = String(choice);
    const existingVote = await this.prisma.communityPostVote.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    return this.prisma.$transaction(async (tx) => {
      if (existingVote) {
        // 이미 투표한 경우
        const updates = {
          agree: { decrement: 0, increment: 0 },
          disagree: { decrement: 0, increment: 0 },
        };
        const prevChoice = existingVote.option;

        if (prevChoice === '1') updates.agree.decrement = 1;
        else if (prevChoice === '2') updates.disagree.decrement = 1;

        if (existingVote.option === choiceStr) {
          // 같은 선택지: 투표 취소
          await tx.communityPostVote.delete({
            where: { postId_userId: { postId, userId } },
          });
        } else {
          // 다른 선택지: 투표 변경
          await tx.communityPostVote.update({
            where: { postId_userId: { postId, userId } },
            data: { option: choiceStr },
          });
          if (choiceStr === '1') updates.agree.increment = 1;
          else if (choiceStr === '2') updates.disagree.increment = 1;
        }

        await tx.communityPost.update({
          where: { id: postId },
          data: {
            agreeVotes: { 
              increment: updates.agree.increment,
              decrement: updates.agree.decrement,
            },
            disagreeVotes: {
              increment: updates.disagree.increment,
              decrement: updates.disagree.decrement,
            },
          },
        });

      } else {
        // 처음 투표하는 경우
        await tx.communityPostVote.create({
          data: { postId, userId, option: choiceStr },
        });

        const voteField = choice === 1 ? 'agreeVotes' : 'disagreeVotes';
        await tx.communityPost.update({
          where: { id: postId },
          data: { [voteField]: { increment: 1 } },
        });
      }
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
