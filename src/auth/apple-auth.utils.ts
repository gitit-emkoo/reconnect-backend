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
    const pubKey = (key as any).getPublicKey ? (key as any).getPublicKey() : (key as any).publicKey || (key as any).rsaPublicKey;
    cb(null, pubKey);
  });
}

export interface AppleUserInfo {
  email?: string;
  name?: string;
  sub?: string;
}

export async function verifyAppleIdToken(idToken: string): Promise<AppleUserInfo> {
  // 1) 검증 전 안전하게 payload만 decode해서 aud 확인
  const decodedAny: any = jwt.decode(idToken, { complete: true }) || {};
  const aud: string | undefined = decodedAny?.payload?.aud;
  if (aud) console.log('[DEBUG] idToken aud(pre-verify):', aud);

  // 2) 환경/토큰에 따라 허용 audience 구성
  const isProd = process.env.NODE_ENV === 'production';
  const allowedAudiences: string[] = isProd
    ? ['com.reconnect.kwcc']
    : ['com.reconnect.kwcc', 'host.exp.Exponent'];

  if (aud === 'host.exp.Exponent' && !allowedAudiences.includes('host.exp.Exponent')) {
    allowedAudiences.push('host.exp.Exponent');
  }

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