import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import type { SigningKey } from 'jwks-rsa';

const client = new JwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 10 * 60 * 1000,
});

function getKey(header: any, cb: (err: Error | null, key?: string) => void) {
  client.getSigningKey(header?.kid as string, (err: Error | null, key?: SigningKey) => {
    if (err || !key) return cb(err || new Error('No signing key found'));
    // v3 타입 호환: getPublicKey() 또는 필드 참조
    const pubKey = (key as any).getPublicKey ? (key as any).getPublicKey() : (key as any).publicKey || (key as any).rsaPublicKey;
    cb(null, pubKey);
  });
}

// 기존 extractUserInfo 등 유틸 함수 유지
export interface AppleUserInfo {
  email?: string;
  name?: string;
  sub?: string;
}

export async function verifyAppleIdToken(idToken: string): Promise<AppleUserInfo> {
  // kid 디버깅 로그
  try {
    const header = JSON.parse(Buffer.from(idToken.split('.')[0], 'base64').toString('utf8'));
    console.log('[DEBUG] idToken kid:', header?.kid);
  } catch {
    // 무시 (디버그 목적)
  }

  const allowedAudiences =
    process.env.NODE_ENV === 'production'
      ? ['com.reconnect.kwcc']
      : ['com.reconnect.kwcc', 'host.exp.Exponent'];

  return new Promise<AppleUserInfo>((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      { issuer: 'https://appleid.apple.com', audience: allowedAudiences, algorithms: ['RS256'] },
      (err: Error | null, decoded: any) => (err ? reject(err) : resolve(decoded as AppleUserInfo)),
    );
  });
}

export class AppleAuthUtils {
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
        if (userData?.name) {
          name = userData.name;
        }
        if (userData?.email) {
          email = userData.email;
        }
      } catch {
        // noop
      }
    }

    return { email, name, sub };
  }
} 