export declare class SocialAuthDto {
    code: string;
}
declare class UnauthDiagnosisDto {
    id: string;
    score: number;
    resultType: string;
    createdAt: string;
}
export declare class GoogleAuthDto {
    accessToken: string;
    unauthDiagnosis?: UnauthDiagnosisDto;
}
export {};
