import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  create(createContentDto: CreateContentDto) {
    const sanitizedBody = sanitizeHtml(createContentDto.body, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt'],
      },
    });

    return this.prisma.content.create({
      data: {
        ...createContentDto,
        body: sanitizedBody,
      },
    });
  }

  findAll() {
    return this.prisma.content.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        _count: {
          select: { likes: true, bookmarks: true },
        },
        likes: {
          where: { userId },
        },
        bookmarks: {
          where: { userId },
        },
      },
    });

    if (!content) {
      return null;
    }

    const { _count, likes, bookmarks, ...rest } = content;

    return {
      ...rest,
      likesCount: _count.likes,
      bookmarksCount: _count.bookmarks,
      isLiked: likes.length > 0,
      isBookmarked: bookmarks.length > 0,
    };
  }

  update(id: string, updateContentDto: UpdateContentDto) {
    const dataToUpdate: { [key: string]: any } = { ...updateContentDto };

    if (updateContentDto.body) {
      dataToUpdate.body = sanitizeHtml(updateContentDto.body, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt'],
        },
      });
    }

    return this.prisma.content.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  remove(id: string) {
    return this.prisma.content.delete({ where: { id } });
  }

  async likeContent(contentId: string, userId: string) {
    return this.prisma.contentLike.create({
      data: {
        contentId,
        userId,
      },
    });
  }

  async unlikeContent(contentId: string, userId: string) {
    return this.prisma.contentLike.delete({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
    });
  }

  async bookmarkContent(contentId: string, userId: string) {
    return this.prisma.contentBookmark.create({
      data: {
        contentId,
        userId,
      },
    });
  }

  async unbookmarkContent(contentId: string, userId: string) {
    return this.prisma.contentBookmark.delete({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
    });
  }

  async findBookmarkedByUserId(userId: string) {
    return this.prisma.content.findMany({
      where: {
        bookmarks: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
