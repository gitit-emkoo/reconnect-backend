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
        const { email, password, nickname, diagnosisId } = registerDto;
        const existingUserByEmail = await this.prisma.user.findUnique({ where: { email } });
        if (existingUserByEmail) {
            throw new common_1.ConflictException('이미 사용중인 이메일입니다.');
        }
        const existingUserByNickname = await this.prisma.user.findUnique({ where: { nickname } });
        if (existingUserByNickname) {
            throw new common_1.ConflictException('이미 사용중인 닉네임입니다.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    nickname,
                    provider: 'EMAIL',
                },
            });
            if (diagnosisId) {
                await tx.diagnosisResult.update({
                    where: { id: diagnosisId },
                    data: { userId: user.id },
                });
            }
            return user;
        });
        const { password: userPassword, ...result } = newUser;
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
        let partnerId = null;
        if (user.partnerId) {
            partnerId = user.partnerId;
        }
        else if (user.partner && typeof user.partner === 'object' && user.partner.id) {
            partnerId = user.partner.id;
        }
        else if (typeof user.partner === 'string') {
            partnerId = user.partner;
        }
        const payload = {
            userId: user.id,
            email: user.email,
            nickname: user.nickname,
            role: user.role,
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
    async googleLogin(googleAccessToken) {
        const googleUserInfo = await this.getGoogleUserInfo(googleAccessToken);
        const { email, name, sub: providerId } = googleUserInfo;
        if (!email) {
            throw new common_1.BadRequestException('구글 계정에서 이메일 정보를 가져올 수 없습니다. 동의 항목을 확인해주세요.');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        let user;
        if (!existingUser) {
            const randomPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    nickname: name || email.split('@')[0],
                    provider: 'GOOGLE',
                    providerId,
                },
            });
        }
        else if (existingUser.provider !== 'GOOGLE') {
            user = await this.prisma.user.update({
                where: { email },
                data: {
                    provider: 'GOOGLE',
                    providerId,
                },
            });
        }
        else {
            user = existingUser;
        }
        const userWithDetails = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: { partner: true, couple: true },
        });
        if (!userWithDetails) {
            throw new common_1.UnauthorizedException('사용자 정보를 찾는 데 실패했습니다.');
        }
        const payload = {
            userId: userWithDetails.id,
            email: userWithDetails.email,
            nickname: userWithDetails.nickname,
            role: userWithDetails.role,
            partnerId: userWithDetails.partner?.id ?? null,
            couple: userWithDetails.couple ? { id: userWithDetails.couple.id } : null,
        };
        const accessToken = this.jwtService.sign(payload);
        const { password, ...result } = userWithDetails;
        return {
            accessToken,
            user: result,
        };
    }
    async getGoogleUserInfo(accessToken) {
        try {
            const { data } = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            return data;
        }
        catch (error) {
            this.handleOAuthError('Google', error);
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
            let partnerId = null;
            if (user.partnerId) {
                partnerId = user.partnerId;
            }
            else if (user.partner && typeof user.partner === 'object' && user.partner.id) {
                partnerId = user.partner.id;
            }
            else if (typeof user.partner === 'string') {
                partnerId = user.partner;
            }
            const payload = {
                userId: user.id,
                email: user.email,
                nickname: user.nickname,
                role: user.role,
                partnerId: partnerId ?? null,
                couple: user.couple ? { id: user.couple.id } : null,
            };
            const accessToken = this.jwtService.sign(payload);
            const { password: _, ...userWithoutPassword } = user;
            return {
                accessToken,
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
    handleOAuthError(provider, error) {
        if (error instanceof common_1.ConflictException || error instanceof common_1.UnauthorizedException) {
            throw error;
        }
        console.error(`${provider} auth error:`, error.response?.data || error.message);
        throw new common_1.UnauthorizedException(`${provider} 인증에 실패했습니다.`);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map