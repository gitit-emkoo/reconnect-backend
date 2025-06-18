"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users.module");
const emotion_cards_module_1 = require("./emotion-cards/emotion-cards.module");
const community_module_1 = require("./community/community.module");
const core_1 = require("@nestjs/core");
const uploads_module_1 = require("./uploads/uploads.module");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const partner_invites_module_1 = require("./partner-invites/partner-invites.module");
const diary_module_1 = require("./diary/diary.module");
console.log('DiaryModule:', diary_module_1.DiaryModule);
const challenges_module_1 = require("./challenges/challenges.module");
const schedules_module_1 = require("./schedules/schedules.module");
const content_module_1 = require("./content/content.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            emotion_cards_module_1.EmotionCardsModule,
            community_module_1.CommunityModule,
            partner_invites_module_1.PartnerInvitesModule,
            uploads_module_1.UploadsModule,
            diary_module_1.DiaryModule,
            challenges_module_1.ChallengesModule,
            schedules_module_1.SchedulesModule,
            content_module_1.ContentModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_PIPE,
                useClass: common_1.ValidationPipe,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map