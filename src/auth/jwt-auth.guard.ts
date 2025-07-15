import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('[JwtAuthGuard] canActivate 호출됨');
    const request = context.switchToHttp().getRequest();
    console.log('[JwtAuthGuard] 요청 경로:', request.url);
    console.log('[JwtAuthGuard] Authorization 헤더:', request.headers.authorization);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('[JwtAuthGuard] handleRequest 호출됨');
    console.log('[JwtAuthGuard] err:', err);
    console.log('[JwtAuthGuard] user:', user ? { id: user.id, email: user.email } : null);
    console.log('[JwtAuthGuard] info:', info);
    
    if (err || !user) {
      console.log('[JwtAuthGuard] 인증 실패:', { err, user, info });
    } else {
      console.log('[JwtAuthGuard] 인증 성공');
    }
    return super.handleRequest(err, user, info, context);
  }
} 