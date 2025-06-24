import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getYear, getMonth, getWeek } from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async findAvailableWeeks(coupleId: string) {
    const reports = await this.prisma.report.findMany({
      where: { coupleId },
      select: {
        weekStartDate: true,
      },
      orderBy: {
        weekStartDate: 'desc',
      },
    });

    // 중복을 제거하고 년/월/주차 정보로 변환
    const availableWeeks = reports.map(report => {
      const date = report.weekStartDate;
      return {
        year: getYear(date),
        month: getMonth(date) + 1, // 0-11을 1-12로 변환
        week: getWeek(date, { weekStartsOn: 1 }), // 월요일 시작 기준
        label: `${getYear(date)}년 ${getMonth(date) + 1}월 ${getWeek(date, { weekStartsOn: 1 })}주차`,
        value: `${getYear(date)}-${getWeek(date, { weekStartsOn: 1 })}`,
      };
    });

    // 중복 제거
    const uniqueWeeks = availableWeeks.filter(
      (week, index, self) =>
        index === self.findIndex(t => t.value === week.value)
    );

    return uniqueWeeks;
  }

  async findReportByWeek(coupleId: string, year: number, week: number) {
    // 특정 년도와 주차에 해당하는 날짜 계산
    // week-fns 같은 라이브러리를 쓰거나 직접 구현 필요
    // 여기서는 date-fns의 기능을 활용한다고 가정
    const { start, end } = this.getWeekDates(year, week);

    const report = await this.prisma.report.findFirst({
      where: {
        coupleId: coupleId,
        weekStartDate: {
          gte: start,
          lte: end,
        },
      },
    });

    return report;
  }

  private getWeekDates(year: number, week: number) {
    // 1월 1일을 기준으로 해당 주차의 첫 날을 찾음
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;
    const firstDayOfWeek = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + daysOffset));

    // 주의 시작(월요일)과 끝(일요일)을 계산
    const day = firstDayOfWeek.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day; // 일요일(0)이면 -6, 아니면 1-day
    const start = new Date(firstDayOfWeek.setDate(firstDayOfWeek.getDate() + diffToMonday));
    const end = new Date(new Date(start).setDate(start.getDate() + 6));
    
    return { start, end };
  }
} 