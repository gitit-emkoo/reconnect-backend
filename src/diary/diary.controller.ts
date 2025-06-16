import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';

@Controller('diaries')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {
    console.log('DiaryController loaded!');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDiaryDto: CreateDiaryDto, @Req() req: Request, @Res() res: Response) {
    const { userId } = (req.user as { userId: string });
    const diary = await this.diaryService.create({ ...createDiaryDto, userId });
    return res.status(HttpStatus.CREATED).json(diary);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: Request, @Res() res: Response) {
    const { userId } = (req.user as { userId: string });
    const diaries = await this.diaryService.findAll(userId);
    return res.status(HttpStatus.OK).json(diaries);
  }

  @Get(':date')
  @UseGuards(JwtAuthGuard)
  async findByDate(@Param('date') date: string, @Req() req: Request, @Res() res: Response) {
    const { userId } = (req.user as { userId: string });
    const diary = await this.diaryService.findByDate(userId, date);
    if (!diary) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Diary not found' });
    }
    return res.status(HttpStatus.OK).json(diary);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateDiaryDto: UpdateDiaryDto, @Req() req: Request, @Res() res: Response) {
    const diary = await this.diaryService.update(id, updateDiaryDto);
    return res.status(HttpStatus.OK).json(diary);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    await this.diaryService.remove(id);
    return res.status(HttpStatus.NO_CONTENT).send();
  }
} 