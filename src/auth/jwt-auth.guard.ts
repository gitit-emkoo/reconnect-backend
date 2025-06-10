import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      console.log('[JwtAuthGuard] 인증 실패:', { err, user, info });
    }
    return super.handleRequest(err, user, info, context);
  }
} 