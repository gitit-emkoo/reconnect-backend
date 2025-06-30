import { Provider } from '@prisma/client';
declare class UnauthDiagnosisDto {
    id: string;
    score: number;
    resultType: string;
    createdAt: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    nickname: string;
    provider?: Provider;
    socialId?: string;
    diagnosisId?: string;
    answers?: number[];
    unauthDiagnosis?: UnauthDiagnosisDto;
}
export {};
