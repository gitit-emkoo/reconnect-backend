// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Provider } from '@prisma/client';
import { JwtService } from '@nestjs/jwt'; // JwtService 임포트 유지
import * as bcrypt from 'bcryptjs'; // bcryptjs 임포트
import axios from 'axios';
import { GoogleAuthDto } from './dto/social-auth.dto';
import multiavatar from '@multiavatar/multiavatar';

// DTO(Data Transfer Object) 임포트 (이전에 정의했었던 dto 파일들)
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DiagnosisService } from '../diagnosis/diagnosis.service';

// 아바타 생성 함수
const generateAvatarUrl = (seed: string): string => {
  // multiavatar 생성
  const svg = multiavatar(seed);
  
  // SVG를 base64로 인코딩
  const base64 = Buffer.from(svg).toString('base64');
  
  // data URL로 반환
  return `data:image/svg+xml;base64,${base64}`;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, // JwtService 주입 유지
    private diagnosisService: DiagnosisService, // DiagnosisService 주입
  ) {}

  /**
   * 새로운 사용자를 등록합니다.
   * @param registerDto 이메일, 비밀번호, 닉네임, 비회원 진단결과 정보를 포함하는 DTO
   * @returns 생성된 사용자 정보 (비밀번호 제외)
   */
  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
    const { email, password, nickname, unauthDiagnosis } = registerDto;

    // 1. 이메일 중복 확인
    const existingUserByEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      throw new ConflictException('이미 사용중인 이메일입니다.');
    }

    // 2. 닉네임 중복 확인
    const existingUserByNickname = await this.prisma.user.findUnique({ where: { nickname } });
    if (existingUserByNickname) {
      throw new ConflictException('이미 사용중인 닉네임입니다.');
    }

    // 3. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 비회원 진단 결과에 따른 초기 온도 설정
    const initialTemperature = unauthDiagnosis ? unauthDiagnosis.score : 61;

    const newUser = await this.prisma.$transaction(async (tx) => {
      // 5. 랜덤 아바타 생성
      const avatarUrl = generateAvatarUrl(email);
      
      // 6. 새로운 사용자 생성 (temperature 필드와 profileImageUrl 추가)
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname,
          provider: 'EMAIL',
          temperature: initialTemperature, // 초기 온도 설정
          profileImageUrl: avatarUrl, // 랜덤 아바타 URL 저장
        },
      });

      // 6. 진단 결과 처리
      if (unauthDiagnosis) {
        // 비회원 진단 결과를 회원 진단 결과로 전환
        await this.diagnosisService.createOrUpdateFromUnauth(user.id, {
          ...unauthDiagnosis,
          diagnosisType: 'BASELINE_TEMPERATURE', // 타입 명확화
        });
      } else {
        // 연결할 진단 결과가 없으면 기본값으로 새로 생성
        await this.diagnosisService.create({
          score: initialTemperature,
          resultType: '기초 관계온도',
          diagnosisType: 'BASELINE_TEMPERATURE', // [추가] 타입 명시
        }, user.id);
      }

      return user;
    });

    // 7. JWT 토큰 생성
    const payload = {
      userId: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
      role: newUser.role,
      partnerId: null,
      couple: null,
    };
    const accessToken = this.jwtService.sign(payload);

    // 8. 민감 정보(비밀번호) 제외하고 반환
    const { password: _, ...result } = newUser;
    return { user: result, accessToken };
  }

  /**
   * 사용자 로그인을 처리하고 JWT 토큰을 발급합니다.
   * @param loginDto 이메일, 비밀번호 정보를 포함하는 DTO
   * @returns JWT 액세스 토큰과 사용자 정보
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const { email, password } = loginDto;
    // 1. 사용자 이메일로 조회 (partner, couple 포함)
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { partner: true, couple: true },
    });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    // partnerId, couple 정보 포함
    let partnerId: string | null = null;
    if (user.partnerId) {
      partnerId = user.partnerId;
    } else if (user.partner && typeof user.partner === 'object' && user.partner.id) {
      partnerId = user.partner.id;
    } else if (typeof user.partner === 'string') {
      partnerId = user.partner;
    }
    const payload = {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      role: (user as any).role,
      partnerId: partnerId ?? null,
      couple: user.couple ? { id: user.couple.id } : null,
    };
    const accessToken = this.jwtService.sign(payload);
    const { password: userPassword, ...result } = user;
    return {
      accessToken,
      user: result
    };
  }

  /**
   * 사용자 정보를 기반으로 JWT 페이로드를 생성하고 토큰을 발급합니다.
   * @param user User 객체 (partner, couple 정보 포함 가능)
   * @returns JWT 액세스 토큰
   */
  createJwtToken(user: User & { partner?: User | null; couple?: any | null }): string {
    let partnerId: string | null = null;
    if (user.partnerId) {
      partnerId = user.partnerId;
    } else if (user.partner && typeof user.partner === 'object' && user.partner.id) {
      partnerId = user.partner.id;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      partnerId: partnerId ?? null,
      couple: user.couple ? { id: user.couple.id } : null,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Google OAuth 토큰으로 로그인을 처리합니다.
   * 사용자가 없으면 자동으로 회원가입을 진행하고, 비회원 진단 결과가 있으면 연결합니다.
   * @param googleAuthDto Google 액세스 토큰과 비회원 진단 ID를 포함하는 DTO
   */
  async googleLogin(
    googleAuthDto: GoogleAuthDto,
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const { accessToken: googleAccessToken, unauthDiagnosis } = googleAuthDto;

    // 1. 구글에서 사용자 정보 가져오기
    const googleUserInfo = await this.getGoogleUserInfo(googleAccessToken);
    const { email, name, sub: providerId } = googleUserInfo;

    if (!email) {
      throw new BadRequestException('구글 계정에서 이메일 정보를 가져올 수 없습니다. 동의 항목을 확인해주세요.');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      // 2. 이메일로 기존 사용자 찾기
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      let user: User;

      // 3. 사용자가 존재하지 않으면, 새로 생성 (회원가입)
      if (!existingUser) {
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const initialTemperature = unauthDiagnosis ? unauthDiagnosis.score : 61;
        
        // 랜덤 아바타 생성
        const avatarUrl = generateAvatarUrl(email);

        user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            nickname: name || email.split('@')[0],
            provider: 'GOOGLE',
            providerId,
            temperature: initialTemperature, // 초기 온도 설정
            profileImageUrl: avatarUrl, // 랜덤 아바타 URL 저장
          },
        });

        // 3-1. 진단 결과 처리
        if (unauthDiagnosis) {
          await this.diagnosisService.createOrUpdateFromUnauth(user.id, {
            ...unauthDiagnosis,
            diagnosisType: 'BASELINE_TEMPERATURE',
          });
        } else {
          await this.diagnosisService.create({
            score: initialTemperature,
            resultType: '기초 관계온도',
            diagnosisType: 'BASELINE_TEMPERATURE', // [추가] 타입 명시
          }, user.id);
        }
      }
      // 4. 사용자가 존재하지만, 구글 연동이 안된 경우 -> 에러 발생
      else if (existingUser.provider !== 'GOOGLE') {
        throw new ConflictException(
          '이미 다른 방식으로 가입된 이메일입니다. 해당 방식으로 로그인해주세요.',
        );
      }
      // 5. 이미 구글로 가입된 사용자인 경우
      else {
        user = existingUser;
      }
      
      return user;
    });

    // 6. JWT 토큰 생성 및 반환 (로그인)
    const userWithDetails = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { partner: true, couple: true },
    });

    if (!userWithDetails) {
      throw new UnauthorizedException('사용자 정보를 찾는 데 실패했습니다.');
    }

    // partnerId, couple 정보 포함 (login 함수와 동일한 로직으로 수정)
    let partnerId: string | null = null;
    if (userWithDetails.partnerId) {
      partnerId = userWithDetails.partnerId;
    } else if (userWithDetails.partner && typeof userWithDetails.partner === 'object' && userWithDetails.partner.id) {
      partnerId = userWithDetails.partner.id;
    } else if (typeof userWithDetails.partner === 'string') {
      partnerId = userWithDetails.partner as any;
    }

    const payload = {
      userId: userWithDetails.id,
      email: userWithDetails.email,
      nickname: userWithDetails.nickname,
      role: userWithDetails.role,
      partnerId: partnerId ?? null, // 수정된 partnerId 사용
      couple: userWithDetails.couple ? { id: userWithDetails.couple.id } : null,
    };
    const accessToken = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = userWithDetails;

    return {
      accessToken,
      user: result,
    };
  }

  /**
   * Google Access Token으로 사용자 정보를 조회하는 헬퍼 함수
   */
  private async getGoogleUserInfo(accessToken: string): Promise<{ email: string; name: string; sub: string }> {
    try {
      const { data } = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return data;
    } catch (error) {
      this.handleOAuthError('Google', error);
    }
  }

  async kakaoRegister(code: string): Promise<{ message: string }> {
    try {
      console.log('카카오 회원가입 처리 시작');
      
      // 1. 카카오 토큰 받기
      const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.KAKAO_CLIENT_ID,
          client_secret: process.env.KAKAO_CLIENT_SECRET,
          code,
          redirect_uri: process.env.KAKAO_REGISTER_REDIRECT_URI,
        },
      });

      const { access_token } = tokenResponse.data;

      // 2. 사용자 정보 받기
      const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id: providerId, kakao_account } = userResponse.data;
      const { email, profile } = kakao_account;
      const nickname = profile?.nickname || email?.split('@')[0] || `User${providerId}`;

      // 3. 이미 가입된 사용자인지 확인
      const existingUser = await this.prisma.user.findFirst({
        where: { 
          OR: [
            { email },
            { 
              provider: 'KAKAO',
              providerId: String(providerId)
            }
          ]
        } as Prisma.UserWhereInput,
      });

      if (existingUser) {
        throw new ConflictException('이미 가입된 사용자입니다. 로그인을 진행해주세요.');
      }

      // 4. 새로운 사용자 생성
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // 랜덤 아바타 생성
      const avatarUrl = generateAvatarUrl(email);

      await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname,
          provider: 'KAKAO',
          providerId: String(providerId),
          profileImageUrl: avatarUrl, // 랜덤 아바타 URL 저장
        },
      });

      return {
        message: '카카오 회원가입이 완료되었습니다.',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Kakao register error:', error);
      throw new UnauthorizedException('카카오 회원가입에 실패했습니다.');
    }
  }

  async kakaoLogin(code: string): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    try {
      const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.KAKAO_CLIENT_ID,
          client_secret: process.env.KAKAO_CLIENT_SECRET,
          code,
          redirect_uri: process.env.KAKAO_REDIRECT_URI,
        },
      });
      const { access_token } = tokenResponse.data;
      const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const { id: providerId, kakao_account } = userResponse.data;
      const { email } = kakao_account;
      const user = await this.prisma.user.findFirst({
        where: { 
          provider: 'KAKAO',
          providerId: String(providerId)
        } as Prisma.UserWhereInput,
        include: { partner: true, couple: true },
      });
      if (!user) {
        throw new UnauthorizedException('가입되지 않은 사용자입니다. 회원가입을 진행해주세요.');
      }
      let partnerId: string | null = null;
      if (user.partnerId) {
        partnerId = user.partnerId;
      } else if (user.partner && typeof user.partner === 'object' && user.partner.id) {
        partnerId = user.partner.id;
      } else if (typeof user.partner === 'string') {
        partnerId = user.partner;
      }
      const payload = {
        userId: user.id,
        email: user.email,
        nickname: user.nickname,
        role: (user as any).role,
        partnerId: partnerId ?? null,
        couple: user.couple ? { id: user.couple.id } : null,
      };
      const accessToken = this.jwtService.sign(payload);
      const { password: _, ...userWithoutPassword } = user;
      return {
        accessToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error('Kakao login error:', error);
      throw new UnauthorizedException('카카오 로그인에 실패했습니다.');
    }
  }

  async logout(): Promise<{ message: string }> {
    // 현재 구현에서는 서버 측에서 특별히 처리할 로직이 없습니다.
    // (예: 토큰 블랙리스트 추가 등)
    // 따라서 성공 메시지만 반환합니다.
    return { message: '성공적으로 로그아웃되었습니다.' };
  }

  /**
   * OAuth 관련 에러를 처리하는 헬퍼 함수
   */
  private handleOAuthError(provider: string, error: any): never {
    if (error instanceof ConflictException || error instanceof UnauthorizedException) {
      throw error;
    }
    console.error(`${provider} auth error:`, error.response?.data || error.message);
    throw new UnauthorizedException(`${provider} 인증에 실패했습니다.`);
  }
}