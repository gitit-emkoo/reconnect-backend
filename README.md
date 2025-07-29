# ReConnect Backend (리커넥트 백엔드)

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 🎯 프로젝트 소개
ReConnect 프로젝트의 백엔드 서버입니다. NestJS 프레임워크를 기반으로 구축되었으며, 사용자 인증, 데이터 관리, API 제공 등 핵심 비즈니스 로직을 담당합니다.

## ✅ 완성된 기능

### 🔐 인증 시스템
- **JWT 토큰 기반 인증**: 안전한 세션 관리
- **소셜 로그인**: 카카오, 애플, 구글 OAuth 지원
- **자동 로그인**: 토큰 갱신 및 자동 인증
- **권한 관리**: 역할 기반 접근 제어

### 👥 사용자 관리
- **회원가입/로그인**: 소셜 로그인 통합
- **프로필 관리**: 사용자 정보 CRUD
- **파트너 연결**: 관계 설정 및 관리
- **비밀번호 변경**: 보안 강화

### 📝 핵심 기능 API
- **관계 진단**: 진단 결과 저장 및 분석
- **감정 일기**: 일일 감정 기록 관리
- **커뮤니티**: 게시글, 댓글, 좋아요 기능
- **전문가 상담**: 상담사 연결 및 관리
- **콘텐츠 센터**: 관계 개선 콘텐츠 제공
- **합의서**: 디지털 합의서 생성 및 관리

### 🛠️ 관리자 기능
- **콘텐츠 관리**: Admin 전용 콘텐츠 CRUD
- **사용자 관리**: 전체 사용자 조회 및 관리
- **통계 대시보드**: 사용 현황 분석

### 📁 파일 관리
- **이미지 업로드**: 멀티파트 파일 처리
- **파일 저장**: 클라우드 스토리지 연동
- **이미지 최적화**: 자동 리사이징 및 압축

## 🛠️ 기술 스택

### Core Framework
- **NestJS**: 엔터프라이즈급 Node.js 프레임워크
- **TypeScript**: 타입 안정성 및 개발 생산성
- **Express**: HTTP 서버 (NestJS 기본 어댑터)

### Database & ORM
- **MongoDB**: NoSQL 데이터베이스
- **Prisma**: 타입 안전한 ORM
- **MongoDB Atlas**: 클라우드 데이터베이스 호스팅

### Authentication & Security
- **JWT**: JSON Web Token 인증
- **Passport.js**: 인증 미들웨어
- **bcrypt**: 비밀번호 해싱
- **class-validator**: 데이터 검증

### Social Login
- **Kakao OAuth**: 카카오 로그인
- **Apple OAuth**: 애플 로그인
- **Google OAuth**: 구글 로그인

### File Handling
- **Multer**: 파일 업로드 처리
- **Sharp**: 이미지 처리 및 최적화

### Development & Testing
- **Jest**: 단위 테스트
- **Supertest**: API 테스트
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅

## 🚀 시작하기

### 1. 저장소 클론
```bash
git clone https://github.com/gitit-emkoo/reconnect.git
cd reconnect/reconnect-be
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Prisma 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 (필요시)
npx prisma db push

# Prisma Studio 실행 (데이터베이스 GUI)
npx prisma studio
```

### 4. 개발 서버 실행
```bash
# 개발 모드 (실시간 변경 감지)
npm run start:dev

# 프로덕션 모드
npm run start:prod

# 디버그 모드
npm run start:debug
```

### 5. 테스트 실행
```bash
# 단위 테스트
npm run test

# e2e 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

## 📁 프로젝트 구조

```
reconnect-be/
├── prisma/                    # Prisma 설정 및 스키마
│   ├── schema.prisma         # 데이터베이스 스키마
│   └── seed.ts               # 초기 데이터 시드
├── src/
│   ├── auth/                 # 인증 모듈
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── users/                # 사용자 관리
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── community/            # 커뮤니티 기능
│   │   ├── community.controller.ts
│   │   ├── community.service.ts
│   │   └── community.module.ts
│   ├── diary/                # 감정 일기
│   │   ├── diary.controller.ts
│   │   ├── diary.service.ts
│   │   └── diary.module.ts
│   ├── content/              # 콘텐츠 관리
│   │   ├── content.controller.ts
│   │   ├── content.service.ts
│   │   └── content.module.ts
│   ├── agreement/            # 합의서 관리
│   │   ├── agreement.controller.ts
│   │   ├── agreement.service.ts
│   │   └── agreement.module.ts
│   ├── common/               # 공통 모듈
│   │   ├── guards/           # 가드
│   │   ├── interceptors/     # 인터셉터
│   │   ├── decorators/       # 커스텀 데코레이터
│   │   └── filters/          # 예외 필터
│   ├── config/               # 설정 파일
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   ├── app.module.ts         # 루트 모듈
│   ├── main.ts               # 애플리케이션 진입점
│   └── app.controller.ts     # 루트 컨트롤러
├── uploads/                  # 파일 업로드 디렉토리
├── test/                     # 테스트 파일
├── .env.example              # 환경 변수 예시
└── package.json              # 프로젝트 설정
```

## 🔧 API 문서

### Swagger UI
개발 서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:
```
http://localhost:3000/api-docs
```

### 주요 API 엔드포인트

#### 인증
- `POST /auth/login` - 로그인
- `POST /auth/register` - 회원가입
- `POST /auth/refresh` - 토큰 갱신
- `POST /auth/logout` - 로그아웃

#### 사용자
- `GET /users/profile` - 프로필 조회
- `PUT /users/profile` - 프로필 수정
- `PUT /users/password` - 비밀번호 변경

#### 커뮤니티
- `GET /community/posts` - 게시글 목록
- `POST /community/posts` - 게시글 작성
- `GET /community/posts/:id` - 게시글 상세
- `PUT /community/posts/:id` - 게시글 수정
- `DELETE /community/posts/:id` - 게시글 삭제

#### 감정 일기
- `GET /diary/entries` - 일기 목록
- `POST /diary/entries` - 일기 작성
- `GET /diary/entries/:id` - 일기 상세
- `PUT /diary/entries/:id` - 일기 수정
- `DELETE /diary/entries/:id` - 일기 삭제

## 🔒 보안

### 인증 및 권한
- **JWT 토큰**: 안전한 세션 관리
- **Role-based Access Control**: 역할 기반 접근 제어
- **CORS 설정**: 허용된 도메인만 접근 가능

### 데이터 보호
- **bcrypt 해싱**: 비밀번호 암호화
- **입력 검증**: class-validator를 통한 데이터 검증
- **SQL Injection 방지**: Prisma ORM 사용

### 환경 변수
- **민감한 정보**: 환경 변수로 관리
- **프로덕션 설정**: 별도 환경 변수 파일 사용

## 🚀 배포

### Render 배포
- **URL**: https://reconnect-backend.onrender.com
- **자동 배포**: main 브랜치 푸시 시 자동 배포
- **환경 변수**: Render 대시보드에서 설정

### 환경별 설정
- **Development**: `http://localhost:3000`
- **Production**: `https://reconnect-backend.onrender.com`

## 🐛 문제 해결

### 일반적인 이슈
1. **데이터베이스 연결 실패**: DATABASE_URL 확인
2. **JWT 토큰 오류**: JWT_SECRET 설정 확인
3. **CORS 에러**: CORS_ORIGIN 설정 확인
4. **파일 업로드 실패**: UPLOAD_DEST 디렉토리 권한 확인

### 로그 확인
```bash
# 개발 모드에서 로그 확인
npm run start:dev

# 프로덕션 로그
npm run start:prod
```

## 📊 성능 최적화

### 데이터베이스
- **인덱싱**: 자주 조회되는 필드에 인덱스 설정
- **쿼리 최적화**: Prisma 쿼리 최적화
- **연결 풀링**: 데이터베이스 연결 관리

### 캐싱
- **Redis**: 세션 및 캐시 저장소 (향후 도입 예정)
- **메모리 캐싱**: 자주 사용되는 데이터 캐싱

### 파일 처리
- **이미지 압축**: Sharp를 통한 이미지 최적화
- **비동기 처리**: 파일 업로드 비동기 처리

## 🤝 기여하기

이 프로젝트는 현재 유지보수 및 개선 단계입니다. 버그 리포트나 개선 제안은 이슈를 통해 제출해주세요.

## 📄 라이선스

© 2024 ReConnect. All Rights Reserved.
