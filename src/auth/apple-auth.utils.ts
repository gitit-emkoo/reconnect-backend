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
  static async verifyAppleIdToken(identityToken: string): Promise<AppleUserInfo> {
    function getKey(header, callback) {
      client.getSigningKey(header.kid, function (err, key) {
        if (!key) return callback(new Error('No signing key found'));
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      });
    }

    const allowedAudiences = process.env.ALLOWED_APPLE_AUDIENCES
      ? process.env.ALLOWED_APPLE_AUDIENCES.split(',').map(s => s.trim())
      : ['com.reconnect.kwcc'];

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