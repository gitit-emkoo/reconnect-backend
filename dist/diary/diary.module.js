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
exports.DiaryModule = void 0;
const common_1 = require("@nestjs/common");
const diary_controller_1 = require("./diary.controller");
const diary_service_1 = require("./diary.service");
const prisma_service_1 = require("../prisma/prisma.service");
let DiaryModule = class DiaryModule {
    constructor() {
        console.log('DiaryModule loaded!');
    }
};
exports.DiaryModule = DiaryModule;
exports.DiaryModule = DiaryModule = __decorate([
    (0, common_1.Module)({
        controllers: [diary_controller_1.DiaryController],
        providers: [diary_service_1.DiaryService, prisma_service_1.PrismaService],
    }),
    __metadata("design:paramtypes", [])
], DiaryModule);
//# sourceMappingURL=diary.module.js.map