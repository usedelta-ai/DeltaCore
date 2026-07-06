"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpresaUsecasesImpl = void 0;
class EmpresaUsecasesImpl {
    db;
    constructor(db) {
        this.db = db;
    }
    checkSuperAdmin(user) {
        if (user.role !== 'superadmin') {
            throw new Error('Unauthorized: Requires superadmin role');
        }
    }
    async getEmpresas(user) {
        if (user.role === 'superadmin') {
            return this.db.getEmpresas();
        }
        if (user.companyId !== undefined) {
            return this.db.getEmpresas(user.companyId);
        }
        return [];
    }
    async createEmpresa(user, name, logo) {
        this.checkSuperAdmin(user);
        return this.db.createEmpresa(name, logo);
    }
    async updateEmpresa(user, id, name, logo) {
        this.checkSuperAdmin(user);
        return this.db.updateEmpresa(id, name, logo);
    }
    async deleteEmpresa(user, id) {
        this.checkSuperAdmin(user);
        return this.db.deleteEmpresa(id);
    }
}
exports.EmpresaUsecasesImpl = EmpresaUsecasesImpl;
