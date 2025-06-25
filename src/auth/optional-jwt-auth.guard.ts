import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // 에러가 있거나 사용자가 있으면 그대로 반환
    // 사용자가 없어도 (토큰이 없거나 유효하지 않아도) 에러를 발생시키지 않고 진행
    return user;
  }
} 