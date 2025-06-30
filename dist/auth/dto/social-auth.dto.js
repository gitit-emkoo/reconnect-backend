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
exports.GoogleAuthDto = exports.SocialAuthDto = void 0;
const class_validator_1 = require("class-validator");
class SocialAuthDto {
}
exports.SocialAuthDto = SocialAuthDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '인증 코드는 필수입니다.' }),
    __metadata("design:type", String)
], SocialAuthDto.prototype, "code", void 0);
class UnauthDiagnosisDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnauthDiagnosisDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Number)
], UnauthDiagnosisDto.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnauthDiagnosisDto.prototype, "resultType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnauthDiagnosisDto.prototype, "createdAt", void 0);
class GoogleAuthDto {
}
exports.GoogleAuthDto = GoogleAuthDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '액세스 토큰은 필수입니다.' }),
    __metadata("design:type", String)
], GoogleAuthDto.prototype, "accessToken", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", UnauthDiagnosisDto)
], GoogleAuthDto.prototype, "unauthDiagnosis", void 0);
//# sourceMappingURL=social-auth.dto.js.map