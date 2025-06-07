import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async createPost(createPostDto: CreatePostDto, authorId: string) {
    const { title, content, categoryId, imageUrl, tags } = createPostDto;
    return this.prisma.communityPost.create({
      data: {
        title,
        content,
        imageUrl,
        tags,
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
}
