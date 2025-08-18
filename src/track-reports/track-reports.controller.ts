import { Controller, Get, Param, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { TrackReportsService } from './track-reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';

@Controller('track-reports')
@UseGuards(JwtAuthGuard)
export class TrackReportsController {
  constructor(private readonly trackReportsService: TrackReportsService) {}

  /**
   * 사용자의 모든 트랙 리포트 조회
   */
  @Get('/me')
  async getMyTrackReports(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId } = req.user as any;
      const reports = await this.trackReportsService.getUserTrackReports(userId);
      return res.status(HttpStatus.OK).json(reports);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: '트랙 리포트 조회에 실패했습니다.'
      });
    }
  }

  /**
   * 특정 월의 트랙 리포트 조회
   */
  @Get('/me/:year/:month')
  async getTrackReportByMonth(
    @Param('year') year: string,
    @Param('month') month: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const { userId } = req.user as any;
      const monthStartDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const report = await this.trackReportsService.getTrackReportByMonth(userId, monthStartDate);
      
      if (!report) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: '해당 월의 트랙 리포트를 찾을 수 없습니다.'
        });
      }

      return res.status(HttpStatus.OK).json(report);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: '트랙 리포트 조회에 실패했습니다.'
      });
    }
  }

  /**
   * 수동으로 트랙 리포트 생성 (관리자용)
   */
  @Get('/generate')
  async generateTrackReports(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, role } = req.user as any;
      
      // 관리자만 접근 가능
      if (role !== 'ADMIN') {
        return res.status(HttpStatus.FORBIDDEN).json({
          message: '관리자만 이 기능을 사용할 수 있습니다.'
        });
      }

      await this.trackReportsService.generateMonthlyTrackReports();
      
      return res.status(HttpStatus.OK).json({
        message: '트랙 리포트 생성이 완료되었습니다.'
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: '트랙 리포트 생성에 실패했습니다.'
      });
    }
  }

  /**
   * 개발용 수동 트랙 리포트 생성 (7개 제한 없음)
   */
  @Get('/generate-manual')
  async generateManualTrackReports(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, role } = req.user as any;
      
      // 관리자만 접근 가능
      if (role !== 'ADMIN') {
        return res.status(HttpStatus.FORBIDDEN).json({
          message: '관리자만 이 기능을 사용할 수 있습니다.'
        });
      }

      await this.trackReportsService.generateManualTrackReports();
      
      return res.status(HttpStatus.OK).json({
        message: '개발용 트랙 리포트 생성이 완료되었습니다. (지난 달 데이터, 7개 제한 없음)'
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: '개발용 트랙 리포트 생성에 실패했습니다.'
      });
    }
  }

  /**
   * 현재 월 일기 진행 현황 (유효/전체/최소 필요치)
   */
  @Get('/me/current/progress')
  async getCurrentProgress(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId } = req.user as any;
      const result = await this.trackReportsService.getCurrentMonthProgress(userId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: '진행 현황 조회 실패' });
    }
  }

  /**
   * 현재 월 즉시 생성 (최소 일기 충족 시)
   */
  @Get('/me/current/generate-now')
  async generateNow(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, subscriptionStartedAt } = req.user as any;
      if (!subscriptionStartedAt) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: '구독 시작 정보가 없습니다.' });
      }
      const result = await this.trackReportsService.generateCurrentMonthNow(userId, new Date(subscriptionStartedAt));
      if (!result.generated) {
        return res.status(HttpStatus.BAD_REQUEST).json(result);
      }
      return res.status(HttpStatus.OK).json({ message: '생성 완료' });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: '즉시 생성 실패' });
    }
  }

  /**
   * 개발용: 현재 월 즉시 생성(최소 일기 제한 없음)
   */
  @Get('/me/current/generate-manual')
  async generateCurrentManual(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, subscriptionStartedAt, role } = req.user as any;
      if (role !== 'ADMIN') {
        return res.status(HttpStatus.FORBIDDEN).json({ message: '관리자만 사용 가능합니다.' });
      }
      if (!subscriptionStartedAt) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: '구독 시작 정보가 없습니다.' });
      }
      const result = await this.trackReportsService.generateCurrentMonthManual(userId, new Date(subscriptionStartedAt));
      if (!result.generated) {
        return res.status(HttpStatus.BAD_REQUEST).json(result);
      }
      return res.status(HttpStatus.OK).json({ message: '현재 월 개발용 생성 완료' });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: '현재 월 개발용 생성 실패' });
    }
  }

  /**
   * 이번 달 리포트를 사용자 이메일로 전송 (PDF 첨부)
   * - 자동 발행 이후 스케줄러에서 호출하거나, 관리자 도구로 수동 호출 가능
   */
  @Get('/me/current/email')
  async emailCurrent(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId } = req.user as any;
      await this.trackReportsService.emailCurrentMonthReport(userId);
      return res.status(HttpStatus.OK).json({ message: '이메일 발송 완료' });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: '이메일 발송 실패' });
    }
  }
} 