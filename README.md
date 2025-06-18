# ReConnect Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 💖 프로젝트 소개
ReConnect 프로젝트의 백엔드 서버입니다. NestJS 프레임워크를 기반으로 구축되었으며, 사용자 인증, 데이터 관리, API 제공 등 핵심 비즈니스 로직을 담당합니다.

## ✨ 주요 기능
- 사용자 인증 (JWT, 소셜 로그인)
- 파트너 연결 및 관리
- 감정 카드, 감정 일기, 챌린지 등 핵심 기능 API
- 콘텐츠 관리 (Admin 전용)
- 이미지 업로드

## 🛠️ 기술 스택
- **Framework**: [NestJS](https://nestjs.com/), [Express](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Prisma](https://www.prisma.io/) ORM
- **Authentication**: [JWT](https://jwt.io/), [Passport.js](http://www.passportjs.org/)
- **Validation**: `class-validator`, `class-transformer`

---

## 🚀 시작하기

### 1. 의존성 설치
```bash
# reconnect-be 디렉토리에서 실행
npm install
```

### 2. 환경 변수 설정
프로젝트를 실행하기 위해, 루트 디렉토리(`reconnect-be/`)에 `.env` 파일을 생성하고 아래 내용을 채워야 합니다.

```env
# 데이터베이스 연결 정보 (MongoDB Atlas 또는 로컬 MongoDB)
DATABASE_URL="mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/reconnect?retryWrites=true&w=majority"

# JWT 토큰 암호화를 위한 시크릿 키 (아무 문자열이나 가능)
JWT_SECRET="your-super-secret-jwt-key"

# Google 소셜 로그인을 위한 클라이언트 ID 및 시크릿
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 서버 포트 (기본값: 3000)
PORT=3000
```

### 3. Prisma 클라이언트 생성
환경 변수 설정 후, Prisma 클라이언트를 생성해야 데이터베이스와 통신할 수 있습니다.

```bash
npx prisma generate
```

### 4. 개발 서버 실행
```bash
# 일반 모드
npm run start

# 실시간 변경 감지 모드
npm run start:dev
```

---

## 🏗️ 프로젝트 구조
```
reconnect-be/
├── prisma/         # Prisma 스키마 및 시드
├── src/
│   ├── auth/         # 인증 (로그인, 회원가입)
│   ├── users/        # 사용자 정보
│   ├── community/    # 커뮤니티 (게시글)
│   ├── content/      # 콘텐츠 (관계 가이드)
│   ├── diary/        # 감정 일기
│   ├── challenges/   # 챌린지
│   └── ...           # 기타 기능 모듈
├── uploads/        # 이미지 업로드 폴더
└── .env.example    # 환경 변수 예시
```

## 📜 API 문서
API 엔드포인트에 대한 문서는 Postman 또는 Swagger를 통해 제공될 예정입니다. (현재 준비 중)

© 2024 ReConnect. All Rights Reserved.
