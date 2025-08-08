import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

// AppleUserInfo 타입 정의
export interface AppleUserInfo {
  email?: string;
  name?: string;
  sub?: string;
}

export class AppleAuthUtils {
  static async verifyAppleIdToken(identityToken: string) {
    const allowedAudiences = (process.env.ALLOWED_APPLE_AUDIENCES ?? 'com.reconnect.kwcc')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const { payload } = await jwtVerify(identityToken, JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: allowedAudiences,
    });
    return payload;
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