import { Controller, Post, Body, Get, UseGuards, Query, Param, Patch, Delete, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // 경로에 guards/ 없음
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VoteDto } from './dto/vote.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';

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

  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts')
  getAllPosts(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @GetUser() user?: any,
  ) {
    const userId = user?.userId;
    if (search) {
      return this.communityService.findAll(categoryId, search, Number(page), Number(limit), userId);
    }
    return this.communityService.getAllPosts(categoryId, Number(page), Number(limit), userId);
  }

  @Get('categories')
  async getCategories() {
    return this.prisma.category.findMany({
      select: { id: true, name: true }
    });
  }

  @Get('posts/:id')
  async getPostById(@Param('id') id: string) {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isMongoId) {
      throw new BadRequestException('Invalid ID format');
    }
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

  @UseGuards(JwtAuthGuard)
  @Patch('posts/:id')
  async updatePost(@Param('id') id: string, @Body() updateData: any, @GetUser() user: any) {
    return this.communityService.updatePost(id, updateData, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @GetUser() user: any) {
    return this.communityService.deletePost(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/vote')
  async voteOnPost(
    @Param('id') postId: string,
    @Body() voteDto: VoteDto,
    @GetUser() user: any
  ) {
    return this.communityService.voteOnPost(postId, user.userId, voteDto.choice);
  }

  @Get('posts/:id/poll')
  async getPollResult(@Param('id') postId: string) {
    return this.communityService.getPollResult(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complaint')
  async complaintContent(
    @Body() dto: CreateComplaintDto,
    @GetUser() user: any
  ) {
    return this.communityService.complaintContent(dto, user.userId);
  }

  // 관리자용: 전체 신고 내역 조회 (추후 AdminGuard로 보호 권장)
  @Get('complaints')
  async getComplaints() {
    return this.communityService.getComplaints();
  }
}
