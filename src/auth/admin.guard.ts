import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard {
  handleRequest(err, user, info) {
    // 기본 JWT 인증 (토큰 만료, 서명 오류 등) 확인
    if (err || !user) {
      throw err || new ForbiddenException('접근 권한이 없습니다.');
    }

    // 관리자 역할 확인
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('관리자만 이 작업을 수행할 수 있습니다.');
    }

    // 인증된 사용자 정보 반환
    return user;
  }
} 