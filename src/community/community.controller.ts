import { Controller, Post, Body, Get, UseGuards, Query } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // 경로에 guards/ 없음
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('community')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly prisma: PrismaService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts')
  createPost(@Body() createPostDto: CreatePostDto, @GetUser() user: any) {
    return this.communityService.createPost(createPostDto, user.userId);
  }

  @Get('posts')
  getAllPosts(@Query('categoryId') categoryId?: string) {
    return this.communityService.getAllPosts(categoryId);
  }

  @Get('categories')
  async getCategories() {
    return this.prisma.category.findMany({
      select: { id: true, name: true }
    });
  }
}
