import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 10 * 60 * 1000,
});

function getKey(header: any, callback: (err: any, key?: string) => void) {
  client.getSigningKey(header.kid, (err, key: any) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

export async function verifyAppleIdToken(identityToken: string) {
  const allowedAudiences =
    process.env.NODE_ENV === 'production'
      ? ['com.reconnect.kwcc']
      : ['com.reconnect.kwcc', 'host.exp.Exponent']; // Expo Go 허용

  return new Promise((resolve, reject) => {
    jwt.verify(
      identityToken,
      getKey,
      {
        issuer: 'https://appleid.apple.com',
        audience: allowedAudiences,
        algorithms: ['RS256'],
      },
      (err, decoded) => (err ? reject(err) : resolve(decoded)),
    );
  });
}

// 기존 extractUserInfo 등 유틸 함수 유지
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