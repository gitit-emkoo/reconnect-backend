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

  async getAllPosts(categoryId?: string) {
    return this.prisma.communityPost.findMany({
      where: {
        categoryId: categoryId ? categoryId : undefined,
      },
      include: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findAll(categoryId?: string, search?: string) {
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
      ];
    }

    return this.prisma.communityPost.findMany({
      where,
      include: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });
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
        parentId,
      } as any
    });
  }
}
