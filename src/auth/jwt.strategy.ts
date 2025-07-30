import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: any) {
    req.user = {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      nickname: payload.nickname,
      role: payload.role,
      partnerId: payload.partnerId,
      couple: payload.couple,
      coupleId: payload.couple?.id || null  // ✅ coupleId 추가
    };
    return req.user;
  }
} 