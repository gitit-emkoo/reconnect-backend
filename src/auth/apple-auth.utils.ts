import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
});

export interface AppleUserInfo {
  email?: string;
  name?: string;
  sub?: string;
}

export class AppleAuthUtils {
  static decodePayload(idToken: string) {
    const b64 = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  }

  static async verifyAppleIdToken(identityToken: string): Promise<AppleUserInfo> {
    // 1. 환경별 allowedAudiences 분기
    const allowedAudiences =
      process.env.NODE_ENV === 'production'
        ? ['com.reconnect.kwcc']
        : ['com.reconnect.kwcc', 'host.exp.Exponent'];

    // 2. idToken의 aud 값 로그로 확인
    const payload = AppleAuthUtils.decodePayload(identityToken);
    console.log('[DEBUG] apple idToken aud:', payload.aud);

    // 3. 기존 getKey 로직
    function getKey(header, callback) {
      client.getSigningKey(header.kid, function (err, key) {
        if (!key) return callback(new Error('No signing key found'));
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      });
    }

    // 4. 검증
    return new Promise((resolve, reject) => {
      jwt.verify(
        identityToken,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: 'https://appleid.apple.com',
          audience: allowedAudiences,
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as AppleUserInfo);
        }
      );
    });
  }

  static extractUserInfo(
    appleUserInfo: AppleUserInfo,
    userString?: string
  ): { email: string; name: string; sub: string } {
    let email = appleUserInfo.email || '';
    let name = '';
    let sub = appleUserInfo.sub || '';

    if (userString) {
      try {
        const userData = JSON.parse(userString);
        if (userData.name) {
          name = userData.name;
        }
        if (userData.email) {
          email = userData.email;
        }
      } catch (e) {}
    }

    return { email, name, sub };
  }
} 