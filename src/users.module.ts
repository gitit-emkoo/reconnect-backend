import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, JwtAuthGuard],
})
export class UsersModule {} 