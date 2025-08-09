// jose 방식 (권장)
import { jwtVerify, createRemoteJWKSet } from 'jose';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const JOSE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export async function verifyAppleIdToken(identityToken: string) {
  // 디버깅: kid 확인
  const header = JSON.parse(Buffer.from(identityToken.split('.')[0], 'base64').toString('utf8'));
  console.log('[DEBUG] idToken kid:', header.kid);

  const allowedAudiences =
    process.env.NODE_ENV === 'production'
      ? ['com.reconnect.kwcc']
      : ['com.reconnect.kwcc', 'host.exp.Exponent'];

  const { payload } = await jwtVerify(identityToken, JOSE_JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: allowedAudiences,
  });
  return payload; // sub, email 등 사용
}

// jsonwebtoken + jwks-rsa 방식 (대체안)
const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 10 * 60 * 1000, // 10분 캐시
});

export function verifyAppleIdTokenWithJWT(identityToken: string) {
  // 디버깅: kid 확인
  const header = JSON.parse(Buffer.from(identityToken.split('.')[0], 'base64').toString('utf8'));
  console.log('[DEBUG] idToken kid:', header.kid);

  const allowedAudiences =
    process.env.NODE_ENV === 'production'
      ? ['com.reconnect.kwcc']
      : ['com.reconnect.kwcc', 'host.exp.Exponent'];

  function getKey(header: any, cb: any) {
    client.getSigningKey(header.kid, (err, key) => {
      if (err || !key) return cb(err || new Error('No signing key found'));
      cb(null, key.getPublicKey());
    });
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      identityToken,
      getKey,
      { issuer: 'https://appleid.apple.com', audience: allowedAudiences, algorithms: ['RS256'] },
      (err, decoded) => (err ? reject(err) : resolve(decoded)),
    );
  });
}

// 기존 extractUserInfo 유지
export interface AppleUserInfo {
  email?: string;
  name?: string;
  sub?: string;
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