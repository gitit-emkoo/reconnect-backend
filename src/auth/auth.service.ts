// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt'; // JwtService 임포트 유지
import * as bcrypt from 'bcryptjs'; // bcryptjs 임포트

// DTO(Data Transfer Object) 임포트 (이전에 정의했었던 dto 파일들)
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService // JwtService 주입 유지
  ) {}

  /**
   * 새로운 사용자를 등록합니다.
   * @param registerDto 이메일, 비밀번호, 닉네임 정보를 포함하는 DTO
   * @returns 생성된 사용자 정보 (비밀번호 제외)
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const { email, password, nickname } = registerDto; // DTO에서 값 추출

    // 1. 이메일 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.'); // HTTP 409 Conflict
    }

    // 2. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10); // 솔트 라운드 10

    // 3. 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword, // 해싱된 비밀번호 저장
        nickname,
      },
    });

    // 민감 정보(비밀번호)는 응답에서 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...result } = user;
    return result; // 'as User' 캐스팅 제거, Omit<User, 'password'> 타입으로 반환
  }

  /**
   * 사용자 로그인을 처리하고 JWT 토큰을 발급합니다.
   * @param loginDto 이메일, 비밀번호 정보를 포함하는 DTO
   * @returns JWT 액세스 토큰과 사용자 정보
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const { email, password } = loginDto; // DTO에서 값 추출

    // 1. 사용자 이메일로 조회
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // 보안을 위해 "이메일 또는 비밀번호가 올바르지 않습니다."와 같은 일반적인 메시지를 사용
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.'); // HTTP 401 Unauthorized
    }

    // 2. 비밀번호 일치 여부 확인 (해싱된 비밀번호 비교)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 3. 로그인 성공 시 JWT 발급
    // 페이로드(payload)는 JWT에 담을 사용자 정보입니다.
    // 민감한 정보(예: 비밀번호, coupleId 등)는 담지 않습니다.
    const payload = { userId: user.id, email: user.email, nickname: user.nickname };
    const accessToken = await this.jwtService.sign(payload); // JWT 생성 (JwtModule 설정에 따라 서명됨)

    // 민감 정보 제외하고 사용자 정보 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...result } = user;

    return {
      accessToken, // 발급된 JWT 토큰
      user: result // 비밀번호 제외된 사용자 정보
    };
  }
}