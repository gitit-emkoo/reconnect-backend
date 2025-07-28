import { Injectable } from '@nestjs/common';
import * as jose from 'jose';

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
      // jose 라이브러리를 사용하여 JWT 검증
      const JWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
      
      const { payload } = await jose.jwtVerify(idToken, JWKS, {
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_CLIENT_ID,
      });

      return payload as AppleUserInfo;
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