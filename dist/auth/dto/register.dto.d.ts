import { Provider } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    nickname: string;
    provider?: Provider;
    socialId?: string;
    diagnosisId?: string;
}
