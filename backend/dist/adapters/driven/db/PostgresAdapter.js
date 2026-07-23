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
const drizzle_orm_1 = require("drizzle-orm");
const schema = __importStar(require("../../../db/schema"));
class PostgresAdapter {
    async getEmpresas(companyId) {
        const conditions = [];
        if (companyId !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(schema.empresa.id, companyId));
        }
        const res = await db_1.db.select()
            .from(schema.empresa)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .orderBy((0, drizzle_orm_1.desc)(schema.empresa.id));
        return res.map((row) => {
            if (row.logo) {
                row.logo = Buffer.from(row.logo).toString('base64');
            }
            return row;
        });
    }
    async createEmpresa(name, logo) {
        const logoBuffer = logo ? Buffer.from(logo, 'base64') : null;
        const res = await db_1.db.insert(schema.empresa)
            .values({ name, logo: logoBuffer, active: true })
            .returning();
        const row = res[0];
        if (row.logo) {
            row.logo = Buffer.from(row.logo).toString('base64');
        }
        return row;
    }
    async updateEmpresa(id, name, logo) {
        const updateData = { name };
        if (logo !== undefined) {
            updateData.logo = logo ? Buffer.from(logo, 'base64') : null;
        }
        const res = await db_1.db.update(schema.empresa)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema.empresa.id, id))
            .returning();
        if (res.length === 0)
            throw new Error('Empresa not found');
        const row = res[0];
        if (row.logo) {
            row.logo = Buffer.from(row.logo).toString('base64');
        }
        return row;
    }
    async deleteEmpresa(id) {
        const res = await db_1.db.update(schema.empresa)
            .set({ active: false })
            .where((0, drizzle_orm_1.eq)(schema.empresa.id, id))
            .returning();
        return res.length > 0;
    }
    async getAgents(companyId) {
        const conditions = [];
        if (companyId !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(schema.agents.empresa_id, companyId));
        }
        const res = await db_1.db.select({
            id: schema.agents.id,
            name: schema.agents.name,
            prompt: schema.agents.prompt,
            phone_number: schema.agents.phone_number,
            instance_name: schema.agents.instance_name,
            status: schema.agents.status,
            empresa_id: schema.agents.empresa_id,
            upsert_lead: schema.agents.upsert_lead,
            translations: schema.agents.translations,
            search: schema.agents.search,
            search_data: schema.agents.search_data,
            validate: schema.agents.validate,
            validate_data: schema.agents.validate_data,
            custom_properties_schema: schema.agents.custom_properties_schema,
            created_at: schema.agents.created_at,
            updated_at: schema.agents.updated_at,
            empresa_name: schema.empresa.name,
        })
            .from(schema.agents)
            .innerJoin(schema.empresa, (0, drizzle_orm_1.eq)(schema.agents.empresa_id, schema.empresa.id))
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .orderBy((0, drizzle_orm_1.desc)(schema.agents.id));
        return res;
    }
    async getAgentById(id) {
        const res = await db_1.db.select()
            .from(schema.agents)
            .where((0, drizzle_orm_1.eq)(schema.agents.id, id));
        return res[0] || null;
    }
    async createAgent(agent) {
        const defaultJson = { itens: [], filters: {}, schema: {} };
        const res = await db_1.db.insert(schema.agents)
            .values({
            name: agent.name,
            prompt: agent.prompt,
            phone_number: agent.phone_number,
            instance_name: agent.instance_name,
            status: agent.status ?? 1,
            empresa_id: agent.empresa_id,
            upsert_lead: agent.upsert_lead ?? true,
            translations: agent.translations ?? null,
            search: agent.search ?? false,
            search_data: agent.search_data ?? defaultJson,
            validate: agent.validate ?? false,
            validate_data: agent.validate_data ?? defaultJson,
            custom_properties_schema: agent.custom_properties_schema ?? null,
        })
            .returning();
        return res[0];
    }
    async updateAgent(id, agent) {
        const current = await this.getAgentById(id);
        if (!current)
            throw new Error('Agent not found');
        const defaultJson = { itens: [], filters: {}, schema: {} };
        const res = await db_1.db.update(schema.agents)
            .set({
            name: agent.name ?? current.name,
            prompt: agent.prompt ?? current.prompt,
            phone_number: agent.phone_number ?? current.phone_number,
            instance_name: agent.instance_name ?? current.instance_name,
            status: agent.status ?? current.status,
            empresa_id: agent.empresa_id ?? current.empresa_id,
            upsert_lead: agent.upsert_lead ?? current.upsert_lead,
            translations: agent.translations !== undefined ? agent.translations : current.translations,
            search: agent.search ?? current.search,
            search_data: agent.search_data !== undefined ? (agent.search_data ?? defaultJson) : (current.search_data ?? defaultJson),
            validate: agent.validate ?? current.validate,
            validate_data: agent.validate_data !== undefined ? (agent.validate_data ?? defaultJson) : (current.validate_data ?? defaultJson),
            custom_properties_schema: agent.custom_properties_schema !== undefined ? agent.custom_properties_schema : current.custom_properties_schema,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.agents.id, id))
            .returning();
        return res[0];
    }
    async deleteAgent(id) {
        const res = await db_1.db.update(schema.agents)
            .set({ status: 0, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.agents.id, id))
            .returning();
        return res.length > 0;
    }
    async getFollowUpSettings(companyId) {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema.follow_up_settings.active, true),
            (0, drizzle_orm_1.sql) `${schema.agents.status} != 0`
        ];
        if (companyId !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(schema.agents.empresa_id, companyId));
        }
        const res = await db_1.db.select({
            id: schema.follow_up_settings.id,
            order: schema.follow_up_settings.order,
            message: schema.follow_up_settings.message,
            time: schema.follow_up_settings.time,
            agent_id: schema.follow_up_settings.agent_id,
            active: schema.follow_up_settings.active,
            created_at: schema.follow_up_settings.created_at,
            agent_name: schema.agents.name,
        })
            .from(schema.follow_up_settings)
            .innerJoin(schema.agents, (0, drizzle_orm_1.eq)(schema.follow_up_settings.agent_id, schema.agents.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.asc)(schema.follow_up_settings.agent_id), (0, drizzle_orm_1.asc)(schema.follow_up_settings.order));
        return res;
    }
    async createFollowUpSetting(setting) {
        const res = await db_1.db.insert(schema.follow_up_settings)
            .values({
            order: setting.order,
            message: setting.message,
            time: setting.time,
            agent_id: setting.agent_id,
            active: setting.active ?? true,
        })
            .returning();
        return res[0];
    }
    async updateFollowUpSetting(id, setting) {
        const currentRes = await db_1.db.select().from(schema.follow_up_settings).where((0, drizzle_orm_1.eq)(schema.follow_up_settings.id, id));
        if (currentRes.length === 0)
            throw new Error('Setting not found');
        const current = currentRes[0];
        const res = await db_1.db.update(schema.follow_up_settings)
            .set({
            order: setting.order ?? current.order,
            message: setting.message ?? current.message,
            time: setting.time ?? current.time,
            agent_id: setting.agent_id ?? current.agent_id,
            active: setting.active ?? current.active,
        })
            .where((0, drizzle_orm_1.eq)(schema.follow_up_settings.id, id))
            .returning();
        return res[0];
    }
    async deleteFollowUpSetting(id) {
        const res = await db_1.db.update(schema.follow_up_settings)
            .set({ active: false })
            .where((0, drizzle_orm_1.eq)(schema.follow_up_settings.id, id))
            .returning();
        return res.length > 0;
    }
    async getLeads(companyId, agentId, filters) {
        const conditions = ["l.status != 'CANCELADO'"];
        const params = [];
        let paramIndex = 1;
        if (companyId !== undefined) {
            conditions.push(`a.empresa_id = $${paramIndex++}`);
            params.push(companyId);
        }
        if (agentId !== undefined) {
            conditions.push(`l.agent_id = $${paramIndex++}`);
            params.push(agentId);
        }
        if (filters?.status) {
            conditions.push(`l.status = $${paramIndex++}`);
            params.push(filters.status);
        }
        if (filters?.search) {
            const searchPattern = `%${filters.search}%`;
            conditions.push(`(l.name ILIKE $${paramIndex} OR l.remote_jid_alt ILIKE $${paramIndex})`);
            params.push(searchPattern);
            paramIndex++;
        }
        if (filters?.month) {
            const [year, monthNum] = filters.month.split('-');
            const monthStart = `${year}-${monthNum}-01`;
            const nextM = Number(monthNum) === 12 ? 1 : Number(monthNum) + 1;
            const nextY = Number(monthNum) === 12 ? Number(year) + 1 : Number(year);
            const monthEnd = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
            conditions.push(`(l.status = 'HUMANO' OR (l.created_at >= $${paramIndex}::timestamp AND l.created_at < $${paramIndex + 1}::timestamp))`);
            params.push(monthStart, monthEnd);
            paramIndex += 2;
        }
        const whereClause = conditions.join(' AND ');
        // Use window function to get total count in same query (avoids double query)
        const selectColumns = `
      l.id, l.agent_id, l.remote_jid_alt, l.name, l.custom_properties, l.status,
      l.taken_over_at, l.take_over_expires_at, l.updated_at, l.created_at,
      l.taken_motive, l.value, l.lastmessage, l.follow_up_id, l.session_id,
      l.pessoa_id, l.finalized_by,
      a.name as agent_name, a.translations, a.status as agent_status,
      COUNT(*) OVER() as total_count
    `;
        let query = `
      SELECT ${selectColumns}
      FROM "lead" l
      LEFT JOIN "agents" a ON a.id = l.agent_id
      WHERE ${whereClause}
      ORDER BY l.updated_at DESC, l.id DESC
    `;
        const shouldPaginate = !filters?.month && filters?.page && filters?.pageSize;
        if (shouldPaginate) {
            const offset = (filters.page - 1) * filters.pageSize;
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(filters.pageSize, offset);
        }
        const result = await db_1.default.query(query, params);
        const rows = result.rows;
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
        const data = rows.map(row => {
            const { total_count, ...leadData } = row;
            return leadData;
        });
        return { data: data, total };
    }
    async getLeadsSummary(companyId, agentId, search, month) {
        const conditions = ["l.status != 'CANCELADO'"];
        const params = [];
        let paramIndex = 1;
        if (companyId !== undefined) {
            conditions.push(`a.empresa_id = $${paramIndex++}`);
            params.push(companyId);
        }
        if (agentId !== undefined) {
            conditions.push(`l.agent_id = $${paramIndex++}`);
            params.push(agentId);
        }
        if (search) {
            const pattern = `%${search}%`;
            conditions.push(`(l.name ILIKE $${paramIndex} OR l.remote_jid_alt ILIKE $${paramIndex})`);
            params.push(pattern);
            paramIndex++;
        }
        if (month) {
            const [year, monthNum] = month.split('-');
            const monthStart = `${year}-${monthNum}-01`;
            const nextM = Number(monthNum) === 12 ? 1 : Number(monthNum) + 1;
            const nextY = Number(monthNum) === 12 ? Number(year) + 1 : Number(year);
            const monthEnd = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
            conditions.push(`(l.status = 'HUMANO' OR (l.created_at >= $${paramIndex}::timestamp AND l.created_at < $${paramIndex + 1}::timestamp))`);
            params.push(monthStart, monthEnd);
            paramIndex += 2;
        }
        const sql = `
      SELECT l.status, COUNT(*)::int as total, COALESCE(SUM(COALESCE(l.value, 0)), 0) as value
      FROM "lead" l
      LEFT JOIN "agents" a ON a.id = l.agent_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY l.status
    `;
        const result = await db_1.default.query(sql, params);
        const rows = result.rows;
        const summary = {
            NOVO: { total: 0, value: 0 },
            HUMANO: { total: 0, value: 0 },
            FINALIZADO: { total: 0, value: 0 },
            CONCLUIDO: { total: 0, value: 0 },
        };
        for (const row of rows) {
            if (summary[row.status]) {
                summary[row.status] = { total: Number(row.total), value: Number(row.value) };
            }
        }
        return summary;
    }
    async getLeadById(id) {
        const res = await db_1.db.select({
            id: schema.lead.id,
            agent_id: schema.lead.agent_id,
            remote_jid_alt: schema.lead.remote_jid_alt,
            name: schema.lead.name,
            custom_properties: schema.lead.custom_properties,
            status: schema.lead.status,
            taken_over_at: schema.lead.taken_over_at,
            take_over_expires_at: schema.lead.take_over_expires_at,
            updated_at: schema.lead.updated_at,
            created_at: schema.lead.created_at,
            taken_motive: schema.lead.taken_motive,
            value: schema.lead.value,
            lastmessage: schema.lead.lastmessage,
            follow_up_id: schema.lead.follow_up_id,
            session_id: schema.lead.session_id,
            pessoa_id: schema.lead.pessoa_id,
            finalized_by: schema.lead.finalized_by,
            finalized_by_name: schema.users.name,
        })
            .from(schema.lead)
            .leftJoin(schema.users, (0, drizzle_orm_1.eq)(schema.lead.finalized_by, schema.users.id))
            .where((0, drizzle_orm_1.eq)(schema.lead.id, id));
        return res[0] || null;
    }
    async getLeadsByIds(ids) {
        if (ids.length === 0)
            return [];
        const res = await db_1.db.select({
            id: schema.lead.id,
            agent_id: schema.lead.agent_id,
            remote_jid_alt: schema.lead.remote_jid_alt,
            name: schema.lead.name,
            custom_properties: schema.lead.custom_properties,
            status: schema.lead.status,
            taken_over_at: schema.lead.taken_over_at,
            take_over_expires_at: schema.lead.take_over_expires_at,
            updated_at: schema.lead.updated_at,
            created_at: schema.lead.created_at,
            taken_motive: schema.lead.taken_motive,
            value: schema.lead.value,
            lastmessage: schema.lead.lastmessage,
            follow_up_id: schema.lead.follow_up_id,
            session_id: schema.lead.session_id,
            pessoa_id: schema.lead.pessoa_id,
            finalized_by: schema.lead.finalized_by,
        })
            .from(schema.lead)
            .where((0, drizzle_orm_1.inArray)(schema.lead.id, ids));
        return res;
    }
    async createLead(lead) {
        const res = await db_1.db.insert(schema.lead)
            .values({
            agent_id: lead.agent_id,
            remote_jid_alt: lead.remote_jid_alt,
            name: lead.name,
            custom_properties: lead.custom_properties ?? null,
            status: lead.status ?? 'NOVO',
            taken_over_at: lead.taken_over_at,
            take_over_expires_at: lead.take_over_expires_at,
            taken_motive: lead.taken_motive,
            value: lead.value,
            lastmessage: lead.lastmessage,
            follow_up_id: lead.follow_up_id,
            session_id: lead.session_id || null,
            pessoa_id: lead.pessoa_id ?? null,
            finalized_by: lead.finalized_by ?? null,
        })
            .returning();
        return res[0];
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
        const res = await db_1.db.update(schema.lead)
            .set({
            agent_id: lead.agent_id ?? oldLead.agent_id,
            remote_jid_alt: lead.remote_jid_alt ?? oldLead.remote_jid_alt,
            name: lead.name ?? oldLead.name,
            custom_properties: lead.custom_properties !== undefined ? lead.custom_properties : oldLead.custom_properties,
            status: lead.status ?? oldLead.status,
            taken_over_at: finalTakenOverAt,
            take_over_expires_at: lead.take_over_expires_at ?? oldLead.take_over_expires_at,
            taken_motive: lead.taken_motive ?? oldLead.taken_motive,
            value: lead.value ?? oldLead.value,
            lastmessage: lead.lastmessage ?? oldLead.lastmessage,
            follow_up_id: lead.follow_up_id !== undefined ? lead.follow_up_id : oldLead.follow_up_id,
            session_id: lead.session_id !== undefined ? (lead.session_id || null) : oldLead.session_id,
            pessoa_id: lead.pessoa_id !== undefined ? lead.pessoa_id : oldLead.pessoa_id,
            finalized_by: lead.finalized_by !== undefined ? lead.finalized_by : oldLead.finalized_by,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.lead.id, id))
            .returning();
        return res[0];
    }
    async deleteLead(id) {
        const res = await db_1.db.update(schema.lead)
            .set({ status: 'CANCELADO', updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.lead.id, id))
            .returning();
        return res.length > 0;
    }
    async checkTableExists(tableName) {
        return (0, db_1.checkTableExists)(tableName);
    }
    async getDynamicTableMessages(tableName, sessionId) {
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
        const res = await db_1.db.select()
            .from(schema.messages)
            .where((0, drizzle_orm_1.eq)(schema.messages.agent_id, agentId))
            .orderBy((0, drizzle_orm_1.asc)(schema.messages.created_at));
        return res.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            content: row.content,
            role: row.role,
            source: row.source,
            createdAt: row.created_at || new Date(),
            remoteJid: row.remote_jid,
            quoted_message_text: row.quote_message_content || undefined,
            messageType: row.message_type,
            messageId: row.message_id,
        }));
    }
    async getLeadStandardMessages(sessionId) {
        const bare = sessionId.replace(/@[^@]+$/, '');
        const res = await db_1.db.select()
            .from(schema.messages)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema.messages.session_id, sessionId), (0, drizzle_orm_1.eq)(schema.messages.session_id, bare)))
            .orderBy((0, drizzle_orm_1.asc)(schema.messages.created_at));
        return res.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            content: row.content,
            role: row.role,
            source: row.source,
            createdAt: row.created_at || new Date(),
            remoteJid: row.remote_jid,
            quoted_message_text: row.quote_message_content || undefined,
            messageType: row.message_type,
            messageId: row.message_id,
        }));
    }
    async getMessageById(id) {
        const res = await db_1.db.select().from(schema.messages).where((0, drizzle_orm_1.eq)(schema.messages.id, id));
        return res[0] || null;
    }
    async createMessage(message) {
        const res = await db_1.db.insert(schema.messages)
            .values({
            agent_id: message.agent_id,
            session_id: message.session_id,
            content: message.content,
            role: message.role,
            source: message.source,
            remote_jid: message.remote_jid,
            message_type: message.message_type,
            message_id: message.message_id,
            quote_message_content: message.quote_message_content || null,
            user_id: message.user_id ?? null,
        })
            .returning();
        const row = res[0];
        return {
            id: row.id,
            sessionId: row.session_id,
            content: row.content,
            role: row.role,
            source: row.source,
            createdAt: row.created_at || new Date(),
            remoteJid: row.remote_jid,
            quoted_message_text: row.quote_message_content || undefined,
            messageType: row.message_type,
            messageId: row.message_id,
        };
    }
    async getUsers(companyId) {
        const conditions = [(0, drizzle_orm_1.eq)(schema.users.active, true)];
        if (companyId !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(schema.users.empresa_id, companyId));
        }
        const res = await db_1.db.select()
            .from(schema.users)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema.users.id));
        return res;
    }
    async getUserByEmail(email) {
        const res = await db_1.db.select()
            .from(schema.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.users.email, email), (0, drizzle_orm_1.eq)(schema.users.active, true)));
        return res[0] || null;
    }
    async createUser(user) {
        const res = await db_1.db.insert(schema.users)
            .values({
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role,
            empresa_id: user.empresa_id || null,
            active: true,
        })
            .returning();
        return res[0];
    }
    async updateUser(id, user) {
        const currentRes = await db_1.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, id));
        if (currentRes.length === 0)
            throw new Error('User not found');
        const current = currentRes[0];
        const res = await db_1.db.update(schema.users)
            .set({
            name: user.name ?? current.name,
            email: user.email ?? current.email,
            password: user.password ?? current.password,
            role: (user.role ?? current.role),
            empresa_id: user.empresa_id !== undefined ? user.empresa_id : current.empresa_id,
            active: user.active ?? current.active,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.users.id, id))
            .returning();
        return res[0];
    }
    async deleteUser(id) {
        const res = await db_1.db.update(schema.users)
            .set({ active: false, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.users.id, id))
            .returning();
        return res.length > 0;
    }
    async getLeadHistoryChanges(leadId) {
        const res = await db_1.db.select({
            id: schema.lead_history.id,
            lead_id: schema.lead_history.lead_id,
            user_id: schema.lead_history.user_id,
            agent_id: schema.lead_history.agent_id,
            changed_by_agent: schema.lead_history.changed_by_agent,
            field_name: schema.lead_history.field_name,
            old_value: schema.lead_history.old_value,
            new_value: schema.lead_history.new_value,
            created_at: schema.lead_history.created_at,
            user_name: schema.users.name,
            agent_name: schema.agents.name
        })
            .from(schema.lead_history)
            .leftJoin(schema.users, (0, drizzle_orm_1.eq)(schema.lead_history.user_id, schema.users.id))
            .leftJoin(schema.agents, (0, drizzle_orm_1.eq)(schema.lead_history.agent_id, schema.agents.id))
            .where((0, drizzle_orm_1.eq)(schema.lead_history.lead_id, leadId))
            .orderBy((0, drizzle_orm_1.asc)(schema.lead_history.created_at));
        return res;
    }
    async insertLeadHistoryLog(log) {
        await db_1.db.insert(schema.lead_history)
            .values({
            lead_id: log.lead_id,
            user_id: log.user_id ?? null,
            agent_id: log.agent_id ?? null,
            changed_by_agent: log.changed_by_agent,
            field_name: log.field_name,
            old_value: log.old_value,
            new_value: log.new_value
        });
    }
    // Pessoas CRUD implementations
    async getPessoas() {
        const res = await db_1.db.select().from(schema.pessoa).orderBy((0, drizzle_orm_1.desc)(schema.pessoa.id));
        return res;
    }
    async getPessoaById(id) {
        const res = await db_1.db.select().from(schema.pessoa).where((0, drizzle_orm_1.eq)(schema.pessoa.id, id));
        return res[0] || null;
    }
    async getPessoaByPhone(phone) {
        const res = await db_1.db.select().from(schema.pessoa).where((0, drizzle_orm_1.eq)(schema.pessoa.phone, phone));
        return res[0] || null;
    }
    async createPessoa(pessoa) {
        const res = await db_1.db.insert(schema.pessoa)
            .values({
            name: pessoa.name,
            phone: pessoa.phone,
        })
            .returning();
        return res[0];
    }
    async updatePessoa(id, pessoa) {
        const res = await db_1.db.update(schema.pessoa)
            .set({
            name: pessoa.name,
            phone: pessoa.phone,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.pessoa.id, id))
            .returning();
        if (res.length === 0)
            throw new Error('Pessoa not found');
        return res[0];
    }
    async deletePessoa(id) {
        const res = await db_1.db.delete(schema.pessoa).where((0, drizzle_orm_1.eq)(schema.pessoa.id, id)).returning();
        return res.length > 0;
    }
    async getLeadsByPessoaId(pessoaId) {
        const res = await db_1.db.select({
            id: schema.lead.id,
            agent_id: schema.lead.agent_id,
            remote_jid_alt: schema.lead.remote_jid_alt,
            name: schema.lead.name,
            custom_properties: schema.lead.custom_properties,
            status: schema.lead.status,
            taken_over_at: schema.lead.taken_over_at,
            take_over_expires_at: schema.lead.take_over_expires_at,
            updated_at: schema.lead.updated_at,
            created_at: schema.lead.created_at,
            taken_motive: schema.lead.taken_motive,
            value: schema.lead.value,
            lastmessage: schema.lead.lastmessage,
            follow_up_id: schema.lead.follow_up_id,
            session_id: schema.lead.session_id,
            pessoa_id: schema.lead.pessoa_id,
            agent_name: schema.agents.name,
        })
            .from(schema.lead)
            .leftJoin(schema.agents, (0, drizzle_orm_1.eq)(schema.lead.agent_id, schema.agents.id))
            .where((0, drizzle_orm_1.eq)(schema.lead.pessoa_id, pessoaId))
            .orderBy((0, drizzle_orm_1.desc)(schema.lead.id));
        return res;
    }
    async getLeadsByPhone(phone) {
        const res = await db_1.db.select({
            id: schema.lead.id,
            agent_id: schema.lead.agent_id,
            remote_jid_alt: schema.lead.remote_jid_alt,
            name: schema.lead.name,
            custom_properties: schema.lead.custom_properties,
            status: schema.lead.status,
            taken_over_at: schema.lead.taken_over_at,
            take_over_expires_at: schema.lead.take_over_expires_at,
            updated_at: schema.lead.updated_at,
            created_at: schema.lead.created_at,
            taken_motive: schema.lead.taken_motive,
            value: schema.lead.value,
            lastmessage: schema.lead.lastmessage,
            follow_up_id: schema.lead.follow_up_id,
            session_id: schema.lead.session_id,
            pessoa_id: schema.lead.pessoa_id,
            agent_name: schema.agents.name,
        })
            .from(schema.lead)
            .leftJoin(schema.agents, (0, drizzle_orm_1.eq)(schema.lead.agent_id, schema.agents.id))
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema.lead.remote_jid_alt, phone), (0, drizzle_orm_1.eq)(schema.lead.remote_jid_alt, `${phone}@s.whatsapp.net`)))
            .orderBy((0, drizzle_orm_1.desc)(schema.lead.id));
        return res;
    }
}
exports.PostgresAdapter = PostgresAdapter;
