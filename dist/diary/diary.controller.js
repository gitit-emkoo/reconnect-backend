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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaryController = void 0;
const common_1 = require("@nestjs/common");
const diary_service_1 = require("./diary.service");
const create_diary_dto_1 = require("./dto/create-diary.dto");
const update_diary_dto_1 = require("./dto/update-diary.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let DiaryController = class DiaryController {
    constructor(diaryService) {
        this.diaryService = diaryService;
        console.log('DiaryController loaded!');
    }
    async create(createDiaryDto, req, res) {
        const { userId } = req.user;
        const diary = await this.diaryService.create({ ...createDiaryDto, userId });
        return res.status(common_1.HttpStatus.CREATED).json(diary);
    }
    async findAll(req, res) {
        const { userId } = req.user;
        const diaries = await this.diaryService.findAll(userId);
        return res.status(common_1.HttpStatus.OK).json(diaries);
    }
    async findByDate(date, req, res) {
        const { userId } = req.user;
        const diary = await this.diaryService.findByDate(userId, date);
        if (!diary) {
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'Diary not found' });
        }
        return res.status(common_1.HttpStatus.OK).json(diary);
    }
    async update(id, updateDiaryDto, req, res) {
        const diary = await this.diaryService.update(id, updateDiaryDto);
        return res.status(common_1.HttpStatus.OK).json(diary);
    }
    async remove(id, req, res) {
        await this.diaryService.remove(id);
        return res.status(common_1.HttpStatus.NO_CONTENT).send();
    }
};
exports.DiaryController = DiaryController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_diary_dto_1.CreateDiaryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], DiaryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DiaryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':date'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('date')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DiaryController.prototype, "findByDate", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_diary_dto_1.UpdateDiaryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], DiaryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DiaryController.prototype, "remove", null);
exports.DiaryController = DiaryController = __decorate([
    (0, common_1.Controller)('diaries'),
    __metadata("design:paramtypes", [diary_service_1.DiaryService])
], DiaryController);
//# sourceMappingURL=diary.controller.js.map