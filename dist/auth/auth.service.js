"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const axios_1 = require("axios");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const { email, password, nickname, provider = 'EMAIL' } = registerDto;
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('이미 존재하는 이메일입니다.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                nickname,
                provider: provider,
            },
        });
        const { password: userPassword, ...result } = user;
        return result;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { partner: true, couple: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        const payload = {
            userId: user.id,
            email: user.email,
            nickname: user.nickname,
            partnerId: user.partnerId || (user.partner && user.partner.id),
            couple: user.couple ? { id: user.couple.id } : null,
        };
        const accessToken = await this.jwtService.sign(payload);
        const { password: userPassword, ...result } = user;
        return {
            accessToken,
            user: result
        };
    }
    async googleRegister(accessToken) {
        try {
            const { data } = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const { email, name, sub: providerId } = data;
            const existingUser = await this.prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                throw new common_1.ConflictException('이미 가입된 사용자입니다. 로그인을 진행해주세요.');
            }
            const randomPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    nickname: name || email.split('@')[0],
                    provider: 'GOOGLE',
                    providerId,
                },
            });
            return {
                message: '구글 회원가입이 완료되었습니다.',
            };
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            console.error('Google register error:', error);
            throw new common_1.UnauthorizedException('구글 회원가입에 실패했습니다.');
        }
    }
    async googleLogin(accessToken) {
        try {
            const { data } = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const { email, name, sub: providerId } = data;
            const user = await this.prisma.user.findFirst({
                where: {
                    email,
                    provider: 'GOOGLE',
                },
                include: { partner: true, couple: true },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('가입되지 않은 사용자입니다. 회원가입을 진행해주세요.');
            }
            const payload = {
                userId: user.id,
                email: user.email,
                nickname: user.nickname,
                partnerId: user.partnerId || (user.partner && user.partner.id),
                couple: user.couple ? { id: user.couple.id } : null,
            };
            const jwtToken = await this.jwtService.sign(payload);
            const { password: _, ...userWithoutPassword } = user;
            return {
                accessToken: jwtToken,
                user: userWithoutPassword,
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            console.error('Google login error:', error);
            throw new common_1.UnauthorizedException('구글 로그인에 실패했습니다.');
        }
    }
    async kakaoRegister(code) {
        try {
            console.log('카카오 회원가입 처리 시작');
            const tokenResponse = await axios_1.default.post('https://kauth.kakao.com/oauth/token', null, {
                params: {
                    grant_type: 'authorization_code',
                    client_id: process.env.KAKAO_CLIENT_ID,
                    client_secret: process.env.KAKAO_CLIENT_SECRET,
                    code,
                    redirect_uri: process.env.KAKAO_REGISTER_REDIRECT_URI,
                },
            });
            const { access_token } = tokenResponse.data;
            const userResponse = await axios_1.default.get('https://kapi.kakao.com/v2/user/me', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const { id: providerId, kakao_account } = userResponse.data;
            const { email, profile } = kakao_account;
            const nickname = profile?.nickname || email?.split('@')[0] || `User${providerId}`;
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        {
                            provider: 'KAKAO',
                            providerId: String(providerId)
                        }
                    ]
                },
            });
            if (existingUser) {
                throw new common_1.ConflictException('이미 가입된 사용자입니다. 로그인을 진행해주세요.');
            }
            const randomPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    nickname,
                    provider: 'KAKAO',
                    providerId: String(providerId),
                },
            });
            return {
                message: '카카오 회원가입이 완료되었습니다.',
            };
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            console.error('Kakao register error:', error);
            throw new common_1.UnauthorizedException('카카오 회원가입에 실패했습니다.');
        }
    }
    async kakaoLogin(code) {
        try {
            const tokenResponse = await axios_1.default.post('https://kauth.kakao.com/oauth/token', null, {
                params: {
                    grant_type: 'authorization_code',
                    client_id: process.env.KAKAO_CLIENT_ID,
                    client_secret: process.env.KAKAO_CLIENT_SECRET,
                    code,
                    redirect_uri: process.env.KAKAO_REDIRECT_URI,
                },
            });
            const { access_token } = tokenResponse.data;
            const userResponse = await axios_1.default.get('https://kapi.kakao.com/v2/user/me', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const { id: providerId, kakao_account } = userResponse.data;
            const { email } = kakao_account;
            const user = await this.prisma.user.findFirst({
                where: {
                    provider: 'KAKAO',
                    providerId: String(providerId)
                },
                include: { partner: true, couple: true },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('가입되지 않은 사용자입니다. 회원가입을 진행해주세요.');
            }
            const payload = {
                userId: user.id,
                email: user.email,
                nickname: user.nickname,
                partnerId: user.partnerId || (user.partner && user.partner.id),
                couple: user.couple ? { id: user.couple.id } : null,
            };
            const jwtToken = await this.jwtService.sign(payload);
            const { password: _, ...userWithoutPassword } = user;
            return {
                accessToken: jwtToken,
                user: userWithoutPassword,
            };
        }
        catch (error) {
            console.error('Kakao login error:', error);
            throw new common_1.UnauthorizedException('카카오 로그인에 실패했습니다.');
        }
    }
    async logout() {
        return { message: '성공적으로 로그아웃되었습니다.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map