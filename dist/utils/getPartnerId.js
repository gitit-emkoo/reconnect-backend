"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartnerId = getPartnerId;
function getPartnerId(user) {
    return user?.partnerId || user?.partner?.id;
}
//# sourceMappingURL=getPartnerId.js.map