import { Controller, Get, Post, Body, Res } from '@nestjs/common'; // Res 데코레이터 추가
import { AppService } from './app.service';
import { User } from '@prisma/client'; // User 타입 임포트
import { Response } from 'express'; // Response 타입 추가

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    console.log('Health check requested at:', new Date().toISOString());
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  getHello(@Res() res: Response): void {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reconnect Backend API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 3rem;
            text-align: center;
            max-width: 600px;
            width: 90%;
            animation: fadeInUp 0.8s ease-out;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .logo {
            font-size: 3rem;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
        }
        
        .title {
            font-size: 2rem;
            color: #333;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        
        .subtitle {
            color: #666;
            font-size: 1.1rem;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        
        .status {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            border-left: 4px solid #28a745;
        }
        
        .status-title {
            font-weight: 600;
            color: #28a745;
            margin-bottom: 0.5rem;
        }
        
        .status-text {
            color: #666;
        }
        
        .api-info {
            background: #e3f2fd;
            border-radius: 10px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            border-left: 4px solid #2196f3;
        }
        
        .api-title {
            font-weight: 600;
            color: #2196f3;
            margin-bottom: 0.5rem;
        }
        
        .api-text {
            color: #666;
            font-family: 'Courier New', monospace;
            background: #f5f5f5;
            padding: 0.5rem;
            border-radius: 5px;
            margin-top: 0.5rem;
        }
        
        .footer {
            color: #999;
            font-size: 0.9rem;
            margin-top: 2rem;
        }
        
        .heart {
            color: #e91e63;
            animation: heartbeat 1.5s ease-in-out infinite;
        }
        
        @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔗</div>
        <h1 class="title">Reconnect Backend API</h1>
        <p class="subtitle">
            커플을 위한 감정 공유 및 소통 플랫폼의 백엔드 서버입니다.<br>
            안전하고 신뢰할 수 있는 API 서비스를 제공합니다.
        </p>
        
        <div class="status">
            <div class="status-title">✅ 서버 상태</div>
            <div class="status-text">정상적으로 실행 중입니다</div>
        </div>
        
        <div class="api-info">
            <div class="api-title">🌐 API 엔드포인트</div>
            <div class="api-text">https://reconnect-backend.onrender.com/api</div>
        </div>
        
        <div class="footer">
            Made with <span class="heart">❤️</span> for better relationships
        </div>
    </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Post('users') // POST 요청으로 /users 경로에 접근
  async createUser(@Body() userData: { email: string; nickname: string }): Promise<User> {
    return this.appService.createTestUser(userData.email, userData.nickname);
  }

  @Get('users') // GET 요청으로 /users 경로에 접근
  async getUsers(): Promise<User[]> {
    return this.appService.getAllUsers();
  }
}