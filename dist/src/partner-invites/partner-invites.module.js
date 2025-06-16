"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerInvitesModule = void 0;
const common_1 = require("@nestjs/common");
const partner_invites_controller_1 = require("./partner-invites.controller");
const partner_invites_service_1 = require("./partner-invites.service");
const prisma_module_1 = require("../prisma/prisma.module");
let PartnerInvitesModule = class PartnerInvitesModule {
};
exports.PartnerInvitesModule = PartnerInvitesModule;
exports.PartnerInvitesModule = PartnerInvitesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [partner_invites_controller_1.PartnerInvitesController],
        providers: [partner_invites_service_1.PartnerInvitesService],
        exports: [partner_invites_service_1.PartnerInvitesService],
    })
], PartnerInvitesModule);
//# sourceMappingURL=partner-invites.module.js.map