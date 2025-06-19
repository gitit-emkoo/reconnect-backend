import { Controller, Get, Param, Post, Body, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ContentService } from './content.service';
import { AdminGuard } from 'src/auth/admin.guard';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @Get()
  findAll() {
    return this.contentService.findAll();
  }

  @Get('bookmarked')
  @UseGuards(JwtAuthGuard)
  findBookmarked(@GetUser() user: User) {
    return this.contentService.findBookmarkedByUserId(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.contentService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  likeContent(@Param('id') id: string, @GetUser() user: User) {
    return this.contentService.likeContent(id, user.id);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  unlikeContent(@Param('id') id: string, @GetUser() user: User) {
    return this.contentService.unlikeContent(id, user.id);
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  bookmarkContent(@Param('id') id: string, @GetUser() user: User) {
    return this.contentService.bookmarkContent(id, user.id);
  }

  @Delete(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  unbookmarkContent(@Param('id') id: string, @GetUser() user: User) {
    return this.contentService.unbookmarkContent(id, user.id);
  }
}
