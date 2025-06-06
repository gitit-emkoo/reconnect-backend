import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async createPost(createPostDto: CreatePostDto, authorId: string) {
    const { title, content, categoryId, imageUrl } = createPostDto;
    return this.prisma.communityPost.create({
      data: {
        title,
        content,
        imageUrl,
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
}
