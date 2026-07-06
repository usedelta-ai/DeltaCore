"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresAdapter = void 0;
const db_1 = __importStar(require("../../../db"));
class PostgresAdapter {
    async getEmpresas(companyId) {
        let query = 'SELECT * FROM public.empresa';
        const params = [];
        if (companyId !== undefined) {
            query += ' WHERE id = $1';
            params.push(companyId);
        }
        query += ' ORDER BY id DESC';
        const res = await db_1.default.query(query, params);
        return res.rows.map((row) => {
            if (row.logo) {
                row.logo = Buffer.from(row.logo).toString('base64');
            }
            return row;
        });
    }
    async createEmpresa(name, logo) {
        const logoBuffer = logo ? Buffer.from(logo, 'base64') : null;
        const res = await db_1.default.query('INSERT INTO public.empresa (name, logo, active) VALUES ($1, $2, true) RETURNING *', [name, logoBuffer]);
        const row = res.rows[0];
        if (row.logo) {
            row.logo = Buffer.from(row.logo).toString('base64');
        }
        return row;
    }
    async updateEmpresa(id, name, logo) {
        let res;
        if (logo !== undefined) {
            const logoBuffer = logo ? Buffer.from(logo, 'base64') : null;
            res = await db_1.default.query('UPDATE public.empresa SET name = $1, logo = $2 WHERE id = $3 RETURNING *', [name, logoBuffer, id]);
        }
        else {
            res = await db_1.default.query('UPDATE public.empresa SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
        }
        if (res.rows.length === 0)
            throw new Error('Empresa not found');
        const row = res.rows[0];
        if (row.logo) {
            row.logo = Buffer.from(row.logo).toString('base64');
        }
        return row;
    }
    async deleteEmpresa(id) {
        const res = await db_1.default.query('UPDATE public.empresa SET active = false WHERE id = $1 RETURNING *', [id]);
        return res.rows.length > 0;
    }
    async getAgents(companyId) {
        let query = `
      SELECT a.*, e.name as empresa_name 
      FROM public.agents a
      JOIN public.empresa e ON a.empresa_id = e.id
    `;
        const params = [];
        if (companyId !== undefined) {
            query += ' WHERE a.empresa_id = $1';
            params.push(companyId);
        }
        query += ' ORDER BY a.id DESC';
        const res = await db_1.default.query(query, params);
        return res.rows;
    }
    async getAgentById(id) {
        const res = await db_1.default.query('SELECT * FROM public.agents WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async createAgent(agent) {
        const defaultJson = { itens: [], filters: {}, schema: {} };
        const res = await db_1.default.query(`INSERT INTO public.agents 
      (name, prompt, phone_number, instance_name, status, empresa_id, upsert_lead, translations, search, search_data, validate, validate_data, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING *`, [
            agent.name, agent.prompt, agent.phone_number, agent.instance_name, agent.status ?? 1, agent.empresa_id,
            agent.upsert_lead ?? true, agent.translations ? JSON.stringify(agent.translations) : null,
            agent.search ?? false, agent.search_data ? JSON.stringify(agent.search_data) : JSON.stringify(defaultJson),
            agent.validate ?? false, agent.validate_data ? JSON.stringify(agent.validate_data) : JSON.stringify(defaultJson)
        ]);
        return res.rows[0];
    }
    async updateAgent(id, agent) {
        const current = await this.getAgentById(id);
        if (!current)
            throw new Error('Agent not found');
        const defaultJson = { itens: [], filters: {}, schema: {} };
        const res = await db_1.default.query(`UPDATE public.agents SET 
        name = $1, prompt = $2, phone_number = $3, instance_name = $4, 
        status = $5, empresa_id = $6, upsert_lead = $7, translations = $8, 
        search = $9, search_data = $10, validate = $11, validate_data = $12, updated_at = NOW() 
      WHERE id = $13 RETURNING *`, [
            agent.name ?? current.name,
            agent.prompt ?? current.prompt,
            agent.phone_number ?? current.phone_number,
            agent.instance_name ?? current.instance_name,
            agent.status ?? current.status,
            agent.empresa_id ?? current.empresa_id,
            agent.upsert_lead ?? current.upsert_lead,
            agent.translations !== undefined ? (agent.translations ? JSON.stringify(agent.translations) : null) : (current.translations ? JSON.stringify(current.translations) : null),
            agent.search ?? current.search,
            agent.search_data !== undefined ? (agent.search_data ? JSON.stringify(agent.search_data) : JSON.stringify(defaultJson)) : (current.search_data ? JSON.stringify(current.search_data) : JSON.stringify(defaultJson)),
            agent.validate ?? current.validate,
            agent.validate_data !== undefined ? (agent.validate_data ? JSON.stringify(agent.validate_data) : JSON.stringify(defaultJson)) : (current.validate_data ? JSON.stringify(current.validate_data) : JSON.stringify(defaultJson)),
            id
        ]);
        return res.rows[0];
    }
    async deleteAgent(id) {
        const res = await db_1.default.query('UPDATE public.agents SET status = 0, updated_at = NOW() WHERE id = $1 RETURNING *', [id]);
        return res.rows.length > 0;
    }
    async getFollowUpSettings(companyId) {
        let query = `
      SELECT f.*, a.name as agent_name 
      FROM public.follow_up_settings f
      JOIN public.agents a ON f.agent_id = a.id
      WHERE f.active = true AND a.status != 0
    `;
        const params = [];
        if (companyId !== undefined) {
            query += ' AND a.empresa_id = $1';
            params.push(companyId);
        }
        query += ' ORDER BY f.agent_id, f.order ASC';
        const res = await db_1.default.query(query, params);
        return res.rows;
    }
    async createFollowUpSetting(setting) {
        const res = await db_1.default.query(`INSERT INTO public.follow_up_settings ("order", message, "time", agent_id, active, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`, [setting.order, setting.message, setting.time, setting.agent_id, setting.active ?? true]);
        return res.rows[0];
    }
    async updateFollowUpSetting(id, setting) {
        const currentRes = await db_1.default.query('SELECT * FROM public.follow_up_settings WHERE id = $1', [id]);
        if (currentRes.rows.length === 0)
            throw new Error('Setting not found');
        const current = currentRes.rows[0];
        const res = await db_1.default.query(`UPDATE public.follow_up_settings SET 
        "order" = $1, message = $2, "time" = $3, agent_id = $4, active = $5 
      WHERE id = $6 RETURNING *`, [
            setting.order ?? current.order,
            setting.message ?? current.message,
            setting.time ?? current.time,
            setting.agent_id ?? current.agent_id,
            setting.active ?? current.active,
            id
        ]);
        return res.rows[0];
    }
    async deleteFollowUpSetting(id) {
        const res = await db_1.default.query('UPDATE public.follow_up_settings SET active = false WHERE id = $1 RETURNING *', [id]);
        return res.rows.length > 0;
    }
    async getLeads(companyId, agentId) {
        const params = [];
        let paramCount = 1;
        // When filtering by company use the optimized empresa → agents → lead join
        if (companyId !== undefined) {
            params.push(companyId); // $1 = empresa_id
            let query = `
        SELECT DISTINCT
          l.*,
          a.translations,
          a.name   AS agent_name,
          a.status AS agent_status,
          f.message AS follow_up_message
        FROM public.empresa e
        INNER JOIN public.agents a ON a.empresa_id = $${paramCount}
        INNER JOIN public.lead l   ON l.agent_id = a.id
        LEFT  JOIN public.follow_up_settings f ON l.follow_up_id = f.id
        WHERE e.id = $${paramCount}
          AND l.status NOT IN ('CANCELADO')
      `;
            if (agentId !== undefined) {
                paramCount++;
                query += ` AND l.agent_id = $${paramCount}`;
                params.push(agentId);
            }
            query += ' ORDER BY l.id DESC';
            const res = await db_1.default.query(query, params);
            return res.rows;
        }
        // Superadmin without company filter — plain join, optional agentId
        let query = `
      SELECT DISTINCT
        l.*,
        a.translations,
        a.name   AS agent_name,
        a.status AS agent_status,
        f.message AS follow_up_message
      FROM public.lead l
      LEFT JOIN public.agents a ON l.agent_id = a.id
      LEFT JOIN public.follow_up_settings f ON l.follow_up_id = f.id
      WHERE l.status NOT IN ('CANCELADO')
    `;
        if (agentId !== undefined) {
            query += ` AND l.agent_id = $${paramCount++}`;
            params.push(agentId);
        }
        query += ' ORDER BY l.id DESC';
        const res = await db_1.default.query(query, params);
        return res.rows;
    }
    async getLeadById(id) {
        const res = await db_1.default.query('SELECT * FROM public.lead WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async createLead(lead) {
        const res = await db_1.default.query(`INSERT INTO public.lead 
      (agent_id, remote_jid_alt, name, custom_properties, status, taken_over_at, 
       take_over_expires_at, updated_at, created_at, taken_motive, value, lastmessage, follow_up_id, session_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10, $11, $12) RETURNING *`, [
            lead.agent_id, lead.remote_jid_alt, lead.name, lead.custom_properties ? JSON.stringify(lead.custom_properties) : null,
            lead.status ?? 'NOVO', lead.taken_over_at, lead.take_over_expires_at, lead.taken_motive, lead.value, lead.lastmessage, lead.follow_up_id, lead.session_id || null
        ]);
        return res.rows[0];
    }
    async updateLead(id, lead) {
        const oldLead = await this.getLeadById(id);
        if (!oldLead)
            throw new Error('Lead not found');
        let finalTakenOverAt = lead.taken_over_at;
        if (lead.status === 'HUMANO' && oldLead.status !== 'HUMANO') {
            finalTakenOverAt = new Date();
        }
        else if (lead.taken_over_at === undefined) {
            finalTakenOverAt = oldLead.taken_over_at;
        }
        const res = await db_1.default.query(`UPDATE public.lead SET 
        agent_id = $1, remote_jid_alt = $2, name = $3, 
        custom_properties = $4, status = $5, taken_over_at = $6, 
        take_over_expires_at = $7, taken_motive = $8, value = $9, 
        lastmessage = $10, follow_up_id = $11, session_id = $12, updated_at = NOW() 
      WHERE id = $13 RETURNING *`, [
            lead.agent_id ?? oldLead.agent_id,
            lead.remote_jid_alt ?? oldLead.remote_jid_alt,
            lead.name ?? oldLead.name,
            lead.custom_properties !== undefined ? (lead.custom_properties ? JSON.stringify(lead.custom_properties) : null) : (oldLead.custom_properties ? JSON.stringify(oldLead.custom_properties) : null),
            lead.status ?? oldLead.status,
            finalTakenOverAt,
            lead.take_over_expires_at ?? oldLead.take_over_expires_at,
            lead.taken_motive ?? oldLead.taken_motive,
            lead.value ?? oldLead.value,
            lead.lastmessage ?? oldLead.lastmessage,
            lead.follow_up_id !== undefined ? lead.follow_up_id : oldLead.follow_up_id,
            lead.session_id !== undefined ? (lead.session_id || null) : oldLead.session_id,
            id
        ]);
        return res.rows[0];
    }
    async deleteLead(id) {
        const res = await db_1.default.query("UPDATE public.lead SET status = 'CANCELADO', updated_at = NOW() WHERE id = $1 RETURNING *", [id]);
        return res.rows.length > 0;
    }
    async checkTableExists(tableName) {
        return (0, db_1.checkTableExists)(tableName);
    }
    async getDynamicTableMessages(tableName, sessionId) {
        // Sanitized dynamic tables
        const sanitizedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
        let query = `SELECT * FROM public."${sanitizedTableName}"`;
        const params = [];
        if (sessionId) {
            query += ` WHERE session_id = $1`;
            params.push(sessionId);
        }
        query += ` ORDER BY id ASC`;
        const res = await db_1.default.query(query, params);
        return res.rows;
    }
    async getStandardMessages(agentId) {
        const res = await db_1.default.query('SELECT * FROM public.messages WHERE agent_id = $1 ORDER BY created_at ASC', [agentId]);
        return res.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            content: row.content,
            role: row.role,
            source: row.source,
            createdAt: row.created_at,
            remoteJid: row.remote_jid,
            quoted_message_text: row.quote_message_content,
            messageType: row.message_type,
            messageId: row.message_id,
        }));
    }
    async getLeadStandardMessages(sessionId) {
        // Normalise: strip @s.whatsapp.net suffix for looser matching
        const bare = sessionId.replace(/@[^@]+$/, '');
        const res = await db_1.default.query(`SELECT * FROM public.messages
       WHERE session_id = $1::text
          OR session_id = $2::text
       ORDER BY created_at ASC`, [sessionId, bare]);
        return res.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            content: row.content,
            role: row.role,
            source: row.source,
            createdAt: row.created_at,
            remoteJid: row.remote_jid,
            quoted_message_text: row.quote_message_content,
            messageType: row.message_type,
            messageId: row.message_id,
        }));
    }
    async getMessageById(id) {
        const msgRes = await db_1.default.query('SELECT * FROM public.messages WHERE id = $1', [id]);
        return msgRes.rows[0] || null;
    }
    async createMessage(message) {
        const res = await db_1.default.query(`INSERT INTO public.messages 
      (agent_id, session_id, content, role, source, remote_jid, message_type, message_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`, [
            message.agent_id,
            message.session_id,
            message.content,
            message.role,
            message.source,
            message.remote_jid,
            message.message_type,
            message.message_id
        ]);
        return res.rows[0];
    }
    async getUsers(companyId) {
        let query = 'SELECT * FROM public.users WHERE active = true';
        const params = [];
        if (companyId !== undefined) {
            query += ' AND empresa_id = $1';
            params.push(companyId);
        }
        query += ' ORDER BY id DESC';
        const res = await db_1.default.query(query, params);
        return res.rows;
    }
    async getUserByEmail(email) {
        const res = await db_1.default.query('SELECT * FROM public.users WHERE email = $1 AND active = true', [email]);
        return res.rows[0] || null;
    }
    async createUser(user) {
        const res = await db_1.default.query(`INSERT INTO public.users (name, email, password, role, empresa_id, active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW()) RETURNING *`, [user.name, user.email, user.password, user.role, user.empresa_id || null]);
        return res.rows[0];
    }
    async updateUser(id, user) {
        const currentRes = await db_1.default.query('SELECT * FROM public.users WHERE id = $1', [id]);
        if (currentRes.rows.length === 0)
            throw new Error('User not found');
        const current = currentRes.rows[0];
        const res = await db_1.default.query(`UPDATE public.users SET 
        name = $1, email = $2, password = $3, role = $4, empresa_id = $5, active = $6, updated_at = NOW() 
       WHERE id = $7 RETURNING *`, [
            user.name ?? current.name,
            user.email ?? current.email,
            user.password ?? current.password,
            user.role ?? current.role,
            user.empresa_id !== undefined ? user.empresa_id : current.empresa_id,
            user.active ?? current.active,
            id
        ]);
        return res.rows[0];
    }
    async deleteUser(id) {
        const res = await db_1.default.query('UPDATE public.users SET active = false, updated_at = NOW() WHERE id = $1 RETURNING *', [id]);
        return res.rows.length > 0;
    }
}
exports.PostgresAdapter = PostgresAdapter;
