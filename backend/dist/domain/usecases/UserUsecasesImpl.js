"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserUsecasesImpl = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
class UserUsecasesImpl {
    db;
    constructor(db) {
        this.db = db;
    }
    getPassKey() {
        const key = process.env.PASS_KEY;
        if (!key) {
            throw new Error('PASS_KEY environment variable is not defined');
        }
        return key;
    }
    checkSuperAdmin(user) {
        if (user.role !== 'superadmin') {
            throw new Error('Unauthorized: Requires superadmin role');
        }
    }
    hashPassword(password) {
        const passKey = this.getPassKey();
        const peppered = crypto_1.default.createHmac('sha256', passKey).update(password).digest('hex');
        return bcryptjs_1.default.hashSync(peppered, 10);
    }
    verifyPassword(password, hash) {
        const passKey = this.getPassKey();
        const peppered = crypto_1.default.createHmac('sha256', passKey).update(password).digest('hex');
        return bcryptjs_1.default.compareSync(peppered, hash);
    }
    generateJWT(payload) {
        const passKey = this.getPassKey();
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto_1.default.createHmac('sha256', passKey).update(`${header}.${data}`).digest('base64url');
        return `${header}.${data}.${signature}`;
    }
    async getUsers(user) {
        this.checkSuperAdmin(user);
        return this.db.getUsers();
    }
    async createUser(user, userData) {
        this.checkSuperAdmin(user);
        const existing = await this.db.getUserByEmail(userData.email);
        if (existing) {
            throw new Error('Email already registered');
        }
        const hashedPassword = this.hashPassword(userData.password);
        return this.db.createUser({
            ...userData,
            password: hashedPassword
        });
    }
    async updateUser(user, id, userData) {
        this.checkSuperAdmin(user);
        const payload = { ...userData };
        if (userData.password) {
            payload.password = this.hashPassword(userData.password);
        }
        return this.db.updateUser(id, payload);
    }
    async deleteUser(user, id) {
        this.checkSuperAdmin(user);
        return this.db.deleteUser(id);
    }
    async login(email, password, empresaId) {
        const user = await this.db.getUserByEmail(email);
        if (!user || !this.verifyPassword(password, user.password)) {
            throw new Error('Invalid email or password');
        }
        if (empresaId !== undefined && user.role !== 'superadmin' && user.empresa_id !== empresaId) {
            throw new Error('Acesso não autorizado para esta empresa');
        }
        let empresaName = null;
        let empresaLogo = null;
        const activeEmpresaId = user.empresa_id || empresaId;
        if (activeEmpresaId) {
            const empresas = await this.db.getEmpresas(activeEmpresaId);
            if (empresas && empresas.length > 0) {
                empresaName = empresas[0].name;
                empresaLogo = empresas[0].logo || null;
            }
        }
        const payload = {
            userId: user.id,
            role: user.role,
            companyId: activeEmpresaId,
            exp: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
        };
        const token = this.generateJWT(payload);
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                empresa_id: activeEmpresaId,
                empresa_name: empresaName,
                empresa_logo: empresaLogo
            }
        };
    }
}
exports.UserUsecasesImpl = UserUsecasesImpl;
