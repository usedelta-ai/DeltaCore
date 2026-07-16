"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEAD_STATUSES = void 0;
exports.isValidLeadStatus = isValidLeadStatus;
exports.LEAD_STATUSES = ['NOVO', 'HUMANO', 'FINALIZADO', 'CONCLUIDO', 'CANCELADO'];
function isValidLeadStatus(status) {
    return exports.LEAD_STATUSES.includes(status);
}
