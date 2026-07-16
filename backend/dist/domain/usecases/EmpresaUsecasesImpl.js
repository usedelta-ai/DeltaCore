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
    async getPublicEmpresa(base64Id) {
        let companyId;
        try {
            const decoded = Buffer.from(base64Id, 'base64').toString('ascii');
            companyId = parseInt(decoded, 10);
            if (isNaN(companyId)) {
                throw new Error('Invalid ID');
            }
        }
        catch (e) {
            throw new Error('Identificador de empresa inválido');
        }
        const empresas = await this.db.getEmpresas(companyId);
        if (!empresas || empresas.length === 0 || !empresas[0].active) {
            throw new Error('Empresa não encontrada ou inativa');
        }
        return empresas[0];
    }
}
exports.EmpresaUsecasesImpl = EmpresaUsecasesImpl;
