import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AdminGuard } from '../auth/admin.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('entry')
  async createEntry(
    @Body('eventKey') eventKey: string,
    @GetUser() user: any,
  ) {
    const userId = user?.id;
    const entry = await this.eventsService.createEntry(eventKey, userId);
    return { success: true, entry };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('entries')
  async listEntries(@Query('eventKey') eventKey: string) {
    const entries = await this.eventsService.listEntries(eventKey);
    return { success: true, entries };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/entry')
  async getMyEntry(
    @Query('eventKey') eventKey: string,
    @GetUser() user: any,
  ) {
    const userId = user?.id;
    const entry = await this.eventsService.findMyEntry(eventKey, userId);
    return { success: true, entry };
  }
}


