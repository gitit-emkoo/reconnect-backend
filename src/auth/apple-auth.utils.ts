import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

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
  private applePublicKeys: any[] = [];
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

  /**
   * Apple의 공개키 목록을 가져옵니다.
   */
  private async fetchApplePublicKeys(): Promise<any[]> {
    const now = Date.now();
    
    // 캐시된 키가 있고 아직 유효한 경우
    if (this.applePublicKeys.length > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.applePublicKeys;
    }

    try {
      const response = await axios.get('https://appleid.apple.com/auth/keys');
      this.applePublicKeys = response.data.keys;
      this.lastFetchTime = now;
      return this.applePublicKeys;
    } catch (error) {
      console.error('Apple public keys fetch failed:', error);
      throw new Error('Apple 공개키를 가져오는데 실패했습니다.');
    }
  }

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

      // Apple 공개키 가져오기
      const publicKeys = await this.fetchApplePublicKeys();
      
      // kid에 해당하는 공개키 찾기
      const publicKey = publicKeys.find(key => key.kid === kid);
      if (!publicKey) {
        throw new Error('토큰에 해당하는 공개키를 찾을 수 없습니다.');
      }

      // JWT 검증
      const verifiedToken = jwt.verify(idToken, this.convertJwkToPem(publicKey), {
        algorithms: [alg],
        audience: process.env.APPLE_CLIENT_ID, // Apple App ID
        issuer: 'https://appleid.apple.com',
      }) as AppleUserInfo;

      return verifiedToken;
    } catch (error) {
      console.error('Apple ID token verification failed:', error);
      throw new Error('Apple ID 토큰 검증에 실패했습니다.');
    }
  }

  /**
   * JWK를 PEM 형식으로 변환합니다.
   */
  private convertJwkToPem(jwk: any): string {
    // 간단한 JWK to PEM 변환 (실제 구현에서는 더 복잡할 수 있음)
    // 실제 프로덕션에서는 jose 라이브러리 사용 권장
    const { n, e } = jwk;
    
    // Base64URL을 Base64로 변환
    const modulus = this.base64UrlToBase64(n);
    const exponent = this.base64UrlToBase64(e);
    
    // RSA 공개키 PEM 형식 생성
    const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${modulus}
${exponent}
-----END PUBLIC KEY-----`;
    
    return rsaPublicKey;
  }

  /**
   * Base64URL을 Base64로 변환합니다.
   */
  private base64UrlToBase64(base64Url: string): string {
    return base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(base64Url.length + (4 - base64Url.length % 4) % 4, '=');
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