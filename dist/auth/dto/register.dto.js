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
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: '유효한 이메일 형식이 아닙니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '이메일은 필수 입력 항목입니다.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '비밀번호는 문자열이어야 합니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '비밀번호는 필수 입력 항목입니다.' }),
    (0, class_validator_1.MinLength)(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '닉네임은 문자열이어야 합니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '닉네임은 필수 입력 항목입니다.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Provider, { message: '유효한 제공자가 아닙니다.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '소셜 ID는 문자열이어야 합니다.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "socialId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "diagnosisId", void 0);
//# sourceMappingURL=register.dto.js.map