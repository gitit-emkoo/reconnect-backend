import { Controller, Post, Body, Get, UseGuards, Query, Param } from '@nestjs/common';
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

  @Get('posts/:id')
  async getPostById(@Param('id') id: string) {
    return this.communityService.getPostById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/comments')
  async createComment(
    @Param('id') postId: string,
    @Body('content') content: string,
    @GetUser() user: any
  ) {
    return this.communityService.createComment(postId, content, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments/:parentId/replies')
  async createReply(
    @Param('postId') postId: string,
    @Param('parentId') parentId: string,
    @Body('content') content: string,
    @GetUser() user: any
  ) {
    return this.communityService.createReply(postId, parentId, content, user.userId);
  }
}
