import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

export interface AppleUserInfo {
  sub: string; // Apple의 고유 사용자 ID
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

@Injectable()
export class AppleAuthUtils {



  /**
   * Apple ID 토큰을 검증하고 사용자 정보를 추출합니다.
   */
  async verifyAppleIdToken(idToken: string): Promise<AppleUserInfo> {
    try {
      // 토큰 헤더에서 kid (Key ID) 추출
      const decodedHeader = jwt.decode(idToken, { complete: true });
      if (!decodedHeader || typeof decodedHeader === 'string') {
        throw new Error('유효하지 않은 Apple ID 토큰입니다.');
      }

      const { kid, alg } = decodedHeader.header;
      if (!kid || !alg) {
        throw new Error('토큰 헤더에 필요한 정보가 없습니다.');
      }

      // jwks-rsa 클라이언트 생성
      const client = jwksClient({
        jwksUri: 'https://appleid.apple.com/auth/keys',
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 600000, // 10분
      });

      // kid에 해당하는 공개키 가져오기
      const key = await client.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      // JWT 검증
      const verifiedToken = jwt.verify(idToken, publicKey, {
        algorithms: [alg as jwt.Algorithm],
        audience: process.env.APPLE_CLIENT_ID,
        issuer: 'https://appleid.apple.com',
      }) as AppleUserInfo;

      return verifiedToken;
    } catch (error) {
      console.error('Apple ID token verification failed:', error);
      throw new Error('Apple ID 토큰 검증에 실패했습니다.');
    }
  }



  /**
   * Apple 사용자 정보에서 이메일과 이름을 추출합니다.
   */
  extractUserInfo(appleUserInfo: AppleUserInfo, userString?: string): {
    email: string;
    name: string;
    sub: string;
  } {
    let email = appleUserInfo.email || '';
    let name = '';

    // Apple에서 제공하는 사용자 정보가 있으면 사용
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        if (userData.name) {
          const firstName = userData.name.firstName || '';
          const lastName = userData.name.lastName || '';
          name = `${firstName} ${lastName}`.trim();
        }
      } catch (error) {
        console.error('Failed to parse Apple user data:', error);
      }
    }

    // 이름이 없으면 이메일에서 추출
    if (!name && email) {
      name = email.split('@')[0];
    }

    // 이메일이 없으면 sub를 사용
    if (!email) {
      email = `${appleUserInfo.sub}@privaterelay.appleid.com`;
    }

    return {
      email,
      name: name || `User${appleUserInfo.sub.slice(-6)}`,
      sub: appleUserInfo.sub,
    };
  }
} 