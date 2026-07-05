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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const db_1 = __importStar(require("./db"));
const app = (0, fastify_1.default)({ logger: true });
// Enable CORS
app.register(cors_1.default, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
});
// Utility to slugify agent name to match table naming convention
function getAgentTableNames(identifier) {
    const sanitized = identifier.toLowerCase().replace(/[^a-z0-9_]/g, '');
    return [
        `n8n_chat_histories_${sanitized}`,
        `n8n_history_${sanitized}`,
    ];
}
// Evolution API Integration Config
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
async function evolutionRequest(path, options = {}) {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        throw new Error('Evolution API URL or API Key is not configured in .env');
    }
    const url = `${EVOLUTION_API_URL}${path}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }
    return response.json();
}
// ---------------------------------------------------------------------------
// EMPRESA ROUTES
// ---------------------------------------------------------------------------
app.get('/api/empresas', async (request, reply) => {
    try {
        const res = await db_1.default.query('SELECT * FROM public.empresa ORDER BY id DESC');
        const rows = res.rows.map((row) => {
            if (row.logo) {
                row.logo = Buffer.from(row.logo).toString('base64');
            }
            return row;
        });
        return rows;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to fetch empresas.' });
    }
});
app.post('/api/empresas', async (request, reply) => {
    const { name, logo } = request.body;
    try {
        // logo can be base64 string or null; insert as bytea
        const logoBuffer = logo ? Buffer.from(logo, 'base64') : null;
        const res = await db_1.default.query('INSERT INTO public.empresa (name, logo, active) VALUES ($1, $2, true) RETURNING *', [name, logoBuffer]);
        const row = res.rows[0];
        if (row.logo) {
            row.logo = Buffer.from(row.logo).toString('base64');
        }
        return row;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to create empresa' });
    }
});
app.put('/api/empresas/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, logo } = request.body;
    try {
        let res;
        if (logo !== undefined) {
            const logoBuffer = logo ? Buffer.from(logo, 'base64') : null;
            res = await db_1.default.query('UPDATE public.empresa SET name = $1, logo = $2 WHERE id = $3 RETURNING *', [name, logoBuffer, id]);
        }
        else {
            res = await db_1.default.query('UPDATE public.empresa SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
        }
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Empresa not found' });
        const row = res.rows[0];
        if (row.logo) {
            row.logo = Buffer.from(row.logo).toString('base64');
        }
        return row;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to update empresa' });
    }
});
app.delete('/api/empresas/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const res = await db_1.default.query('UPDATE public.empresa SET active = false WHERE id = $1 RETURNING *', [id]);
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Empresa not found' });
        return { message: 'Empresa inactivated successfully' };
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to delete (inactivate) empresa' });
    }
});
// ---------------------------------------------------------------------------
// AGENTS ROUTES
// ---------------------------------------------------------------------------
app.get('/api/agents', async (request, reply) => {
    try {
        const res = await db_1.default.query(`
      SELECT a.*, e.name as empresa_name 
      FROM public.agents a
      JOIN public.empresa e ON a.empresa_id = e.id
      ORDER BY a.id DESC
    `);
        // Fetch instances from Evolution API
        let evolutionInstances = [];
        try {
            if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
                const data = (await evolutionRequest('/instance/fetchInstances'));
                if (Array.isArray(data)) {
                    evolutionInstances = data;
                }
                else if (data && Array.isArray(data.instances)) {
                    evolutionInstances = data.instances;
                }
            }
        }
        catch (evoErr) {
            app.log.warn('Could not fetch instances from Evolution API: ' + evoErr.message);
        }
        // Map evolution status to agents
        const agents = res.rows.map((row) => {
            const matched = evolutionInstances.find((inst) => {
                const instName = inst.instanceName || inst.name || inst.instance?.instanceName || inst.instance?.name || '';
                return instName.toLowerCase() === row.instance_name?.toLowerCase();
            });
            // Append evolution status
            row.evolution_status = matched?.connectionStatus || matched?.instance?.connectionStatus || matched?.status || matched?.instance?.status || 'desconectado';
            return row;
        });
        return agents;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to fetch agents' });
    }
});
app.post('/api/agents', async (request, reply) => {
    const { name, prompt, phone_number, instance_name, status, empresa_id, upsert_lead, translations, search, search_data, validate, validate_data } = request.body;
    const defaultJson = { itens: [], filters: {}, schema: {} };
    try {
        const res = await db_1.default.query(`INSERT INTO public.agents 
      (name, prompt, phone_number, instance_name, status, empresa_id, upsert_lead, translations, search, search_data, validate, validate_data, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING *`, [
            name, prompt, phone_number, instance_name, status ?? 1, empresa_id,
            upsert_lead ?? true, translations ? JSON.stringify(translations) : null,
            search ?? false, search_data ? JSON.stringify(search_data) : JSON.stringify(defaultJson),
            validate ?? false, validate_data ? JSON.stringify(validate_data) : JSON.stringify(defaultJson)
        ]);
        return res.rows[0];
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to create agent' });
    }
});
app.put('/api/agents/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, prompt, phone_number, instance_name, status, empresa_id, upsert_lead, translations, search, search_data, validate, validate_data } = request.body;
    const defaultJson = { itens: [], filters: {}, schema: {} };
    try {
        const res = await db_1.default.query(`UPDATE public.agents SET 
        name = $1, prompt = $2, phone_number = $3, instance_name = $4, 
        status = $5, empresa_id = $6, upsert_lead = $7, translations = $8, 
        search = $9, search_data = $10, validate = $11, validate_data = $12, updated_at = NOW() 
      WHERE id = $13 RETURNING *`, [
            name, prompt, phone_number, instance_name, status, empresa_id,
            upsert_lead, translations ? JSON.stringify(translations) : null,
            search ?? false, search_data ? JSON.stringify(search_data) : JSON.stringify(defaultJson),
            validate ?? false, validate_data ? JSON.stringify(validate_data) : JSON.stringify(defaultJson),
            id
        ]);
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Agent not found' });
        return res.rows[0];
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to update agent' });
    }
});
app.delete('/api/agents/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const res = await db_1.default.query('UPDATE public.agents SET status = 0, updated_at = NOW() WHERE id = $1 RETURNING *', [id]);
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Agent not found' });
        return { message: 'Agent inactivated successfully' };
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to delete (inactivate) agent' });
    }
});
// ---------------------------------------------------------------------------
// FOLLOW-UP SETTINGS ROUTES
// ---------------------------------------------------------------------------
app.get('/api/follow-up-settings', async (request, reply) => {
    try {
        const res = await db_1.default.query(`
      SELECT f.*, a.name as agent_name 
      FROM public.follow_up_settings f
      JOIN public.agents a ON f.agent_id = a.id
      WHERE f.active = true AND a.status != 0
      ORDER BY f.agent_id, f.order ASC
    `);
        return res.rows;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to fetch follow-up settings' });
    }
});
app.post('/api/follow-up-settings', async (request, reply) => {
    const { order, message, time, agent_id, active } = request.body;
    try {
        const res = await db_1.default.query(`INSERT INTO public.follow_up_settings ("order", message, "time", agent_id, active, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`, [order, message, time, agent_id, active ?? true]);
        return res.rows[0];
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to create follow-up setting' });
    }
});
app.put('/api/follow-up-settings/:id', async (request, reply) => {
    const { id } = request.params;
    const { order, message, time, agent_id, active } = request.body;
    try {
        const res = await db_1.default.query(`UPDATE public.follow_up_settings SET 
        "order" = $1, message = $2, "time" = $3, agent_id = $4, active = $5 
      WHERE id = $6 RETURNING *`, [order, message, time, agent_id, active, id]);
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Setting not found' });
        return res.rows[0];
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to update follow-up setting' });
    }
});
app.delete('/api/follow-up-settings/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const res = await db_1.default.query('UPDATE public.follow_up_settings SET active = false WHERE id = $1 RETURNING *', [id]);
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Setting not found' });
        return { message: 'Follow-up setting inactivated successfully' };
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to delete (inactivate) follow-up setting' });
    }
});
// ---------------------------------------------------------------------------
// LEADS ROUTES
// ---------------------------------------------------------------------------
app.get('/api/leads', async (request, reply) => {
    try {
        const res = await db_1.default.query(`
      SELECT l.*, a.name as agent_name, a.status as agent_status, f.message as follow_up_message
      FROM public.lead l
      LEFT JOIN public.agents a ON l.agent_id = a.id
      LEFT JOIN public.follow_up_settings f ON l.follow_up_id = f.id
      WHERE l.status != 'CANCELADO'
      ORDER BY l.id DESC
    `);
        return res.rows;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to fetch leads' });
    }
});
app.post('/api/leads', async (request, reply) => {
    const { agent_id, remote_jid_alt, name, custom_properties, status, taken_over_at, take_over_expires_at, taken_motive, value, lastmessage, follow_up_id, session_id } = request.body;
    try {
        const res = await db_1.default.query(`INSERT INTO public.lead 
      (agent_id, remote_jid_alt, name, custom_properties, status, taken_over_at, 
       take_over_expires_at, updated_at, created_at, taken_motive, value, lastmessage, follow_up_id, session_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10, $11, $12) RETURNING *`, [
            agent_id, remote_jid_alt, name, custom_properties ? JSON.stringify(custom_properties) : null,
            status ?? 'NOVO', taken_over_at, take_over_expires_at, taken_motive, value, lastmessage, follow_up_id, session_id || null
        ]);
        return res.rows[0];
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to create lead' });
    }
});
app.put('/api/leads/:id', async (request, reply) => {
    const { id } = request.params;
    const { agent_id, remote_jid_alt, name, custom_properties, status, taken_over_at, take_over_expires_at, taken_motive, value, lastmessage, follow_up_id, session_id } = request.body;
    try {
        // Get existing lead to check status and preserve taken_over_at
        const currentLeadRes = await db_1.default.query('SELECT status, taken_over_at FROM public.lead WHERE id = $1', [id]);
        if (currentLeadRes.rows.length === 0)
            return reply.status(404).send({ error: 'Lead not found' });
        const oldLead = currentLeadRes.rows[0];
        let finalTakenOverAt = taken_over_at;
        if (status === 'HUMANO' && oldLead.status !== 'HUMANO') {
            finalTakenOverAt = new Date();
        }
        else if (taken_over_at === undefined) {
            finalTakenOverAt = oldLead.taken_over_at;
        }
        const res = await db_1.default.query(`UPDATE public.lead SET 
        agent_id = $1, remote_jid_alt = $2, name = $3, 
        custom_properties = $4, status = $5, taken_over_at = $6, 
        take_over_expires_at = $7, taken_motive = $8, value = $9, 
        lastmessage = $10, follow_up_id = $11, session_id = $12, updated_at = NOW() 
      WHERE id = $13 RETURNING *`, [
            agent_id, remote_jid_alt, name, custom_properties ? JSON.stringify(custom_properties) : null,
            status, finalTakenOverAt, take_over_expires_at, taken_motive, value, lastmessage, follow_up_id, session_id || null, id
        ]);
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Lead not found' });
        return res.rows[0];
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to update lead' });
    }
});
app.delete('/api/leads/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const res = await db_1.default.query("UPDATE public.lead SET status = 'CANCELADO', updated_at = NOW() WHERE id = $1 RETURNING *", [id]);
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Lead not found' });
        return { message: 'Lead cancelled successfully' };
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to delete (cancel) lead' });
    }
});
// ---------------------------------------------------------------------------
// MESSAGES / HISTORY ROUTES (READ-ONLY)
// ---------------------------------------------------------------------------
// Get message history for a specific agent (checks both n8n chat histories and default messages table)
app.get('/api/agents/:agentId/history', async (request, reply) => {
    const { agentId } = request.params;
    try {
        // 1. Get agent name to check dynamic tables
        const agentRes = await db_1.default.query('SELECT name, instance_name FROM public.agents WHERE id = $1', [agentId]);
        if (agentRes.rows.length === 0) {
            return reply.status(404).send({ error: 'Agent not found' });
        }
        const agent = agentRes.rows[0];
        const possibleTables = getAgentTableNames(agent.instance_name || agent.name);
        // Check if any of the dynamic tables exist
        let dynamicTableName = null;
        for (const tableName of possibleTables) {
            const exists = await (0, db_1.checkTableExists)(tableName);
            if (exists) {
                dynamicTableName = tableName;
                break;
            }
        }
        if (dynamicTableName) {
            // Query from the n8n dynamic table
            // n8n schema has session_id, message (jsonb) or content, etc.
            // We will select id, session_id, message from public.<dynamicTableName>
            // Let's safe-query (using dynamic table name) - table name is sanitized, so SQL injection is prevented.
            const query = `SELECT * FROM public."${dynamicTableName}" ORDER BY id ASC`;
            const res = await db_1.default.query(query);
            return {
                source: 'dynamic_n8n_table',
                tableName: dynamicTableName,
                messages: res.rows.map(row => {
                    // n8n message schema often has message: { role: 'user'|'assistant', text: '...' } or message: [{role: ..., text: ...}]
                    // Let's return the raw message format and parsed components
                    return {
                        id: row.id,
                        sessionId: row.session_id || row.session_id_alt,
                        content: typeof row.message === 'string' ? row.message : JSON.stringify(row.message),
                        rawMessage: row.message,
                        createdAt: row.created_at || new Date(),
                    };
                }),
            };
        }
        else {
            // Fallback: Query from standard messages table
            const res = await db_1.default.query('SELECT * FROM public.messages WHERE agent_id = $1 ORDER BY created_at ASC', [agentId]);
            return {
                source: 'standard_messages_table',
                messages: res.rows.map(row => ({
                    id: row.id,
                    sessionId: row.session_id,
                    content: row.content,
                    role: row.role,
                    source: row.source,
                    createdAt: row.created_at,
                    remoteJid: row.remote_jid,
                    quoted_message_text: row.quote_message_content,
                })),
            };
        }
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to retrieve agent history' });
    }
});
// Get message history for a specific lead (session and JID matching)
app.get('/api/leads/:leadId/history', async (request, reply) => {
    const { leadId } = request.params;
    try {
        // 1. Get lead information
        const leadRes = await db_1.default.query('SELECT * FROM public.lead WHERE id = $1', [leadId]);
        if (leadRes.rows.length === 0) {
            return reply.status(404).send({ error: 'Lead not found' });
        }
        const lead = leadRes.rows[0];
        // 2. Get agent information
        const agentRes = await db_1.default.query('SELECT name, instance_name FROM public.agents WHERE id = $1', [lead.agent_id]);
        if (agentRes.rows.length === 0) {
            return reply.status(404).send({ error: 'Agent not found for this lead' });
        }
        const agent = agentRes.rows[0];
        const possibleTables = getAgentTableNames(agent.instance_name || agent.name);
        let dynamicTableName = null;
        for (const tableName of possibleTables) {
            const exists = await (0, db_1.checkTableExists)(tableName);
            if (exists) {
                dynamicTableName = tableName;
                break;
            }
        }
        if (dynamicTableName) {
            const sessionSearch = lead.session_id;
            if (!sessionSearch) {
                return reply.status(400).send({ error: 'Lead has no session_id' });
            }
            // 1. Fetch dynamic n8n messages (keep only AI/assistant messages)
            const query = `SELECT * FROM public."${dynamicTableName}" WHERE session_id = $1 ORDER BY id ASC`;
            const dynRes = await db_1.default.query(query, [sessionSearch]);
            const rawAiMessages = dynRes.rows.map(row => {
                let isHuman = false;
                try {
                    const raw = typeof row.message === 'string' ? JSON.parse(row.message) : row.message;
                    if (raw && typeof raw === 'object') {
                        if (raw.type) {
                            isHuman = raw.type === 'human' || raw.type === 'user';
                        }
                    }
                }
                catch (_) { }
                return {
                    id: row.id,
                    sessionId: row.session_id,
                    content: typeof row.message === 'string' ? row.message : JSON.stringify(row.message),
                    rawMessage: row.message,
                    createdAt: row.created_at || null,
                    isHuman
                };
            }).filter(msg => !msg.isHuman);
            // 2. Fetch User and Attendant messages from public.messages table (session_id only)
            const userMsgsRes = await db_1.default.query(`SELECT * FROM public.messages 
         WHERE session_id = $1::text
         ORDER BY created_at ASC`, [sessionSearch]);
            const userMessages = userMsgsRes.rows.map(row => ({
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
            })).filter(row => {
                const role = (row.role || '').toLowerCase();
                const source = (row.source || '').toLowerCase();
                const isAi = role === 'assistant' || role === 'bot' || role === 'ai' || source === 'bot' || source === 'ai';
                if (!isAi)
                    return true;
                // Deduplicate against rawAiMessages from the dynamic n8n table
                const rowContent = (row.content || '').trim();
                if (!rowContent)
                    return false;
                const existsInDynamic = rawAiMessages.some(dynMsg => {
                    const dynContent = (dynMsg.content || '').trim();
                    return dynContent.includes(rowContent) || rowContent.includes(dynContent);
                });
                return !existsInDynamic;
            });
            // 3. Match AI messages with user messages to calculate proper timestamps
            let lastMatchIndex = -1;
            const aiMessages = rawAiMessages.map(aiMsg => {
                let userText = '';
                try {
                    const raw = typeof aiMsg.rawMessage === 'string' ? JSON.parse(aiMsg.rawMessage) : aiMsg.rawMessage;
                    const parsedObj = raw;
                    if (parsedObj && typeof parsedObj === 'object') {
                        const arr = Array.isArray(parsedObj) ? parsedObj : [parsedObj];
                        let itemsArray = arr;
                        if (parsedObj.content && typeof parsedObj.content === 'string' && (parsedObj.content.startsWith('[') || parsedObj.content.startsWith('{'))) {
                            itemsArray = JSON.parse(parsedObj.content);
                        }
                        const userItem = itemsArray.find((x) => x.role === 'user' || x.role === 'human' || x.type === 'user' || x.type === 'human');
                        if (userItem) {
                            userText = userItem.content || '';
                        }
                    }
                }
                catch (_) { }
                let matchedCreatedAt = aiMsg.createdAt;
                if (!matchedCreatedAt && userText) {
                    const cleanUserText = userText
                        .replace(/<quotedMsg>([\s\S]*?)<\/quotedMsg>/g, '')
                        .replace(/<userMsg>|<\/userMsg>|<userAudioMsg>|<\/userAudioMsg>|\n/g, '')
                        .trim();
                    for (let i = lastMatchIndex + 1; i < userMessages.length; i++) {
                        const uMsg = userMessages[i];
                        const cleanUMsg = (uMsg.content || '')
                            .replace(/<quotedMsg>([\s\S]*?)<\/quotedMsg>/g, '')
                            .replace(/<userMsg>|<\/userMsg>|<userAudioMsg>|<\/userAudioMsg>|\n/g, '')
                            .trim();
                        if (cleanUMsg === cleanUserText) {
                            matchedCreatedAt = uMsg.createdAt;
                            lastMatchIndex = i;
                            break;
                        }
                    }
                }
                // Fallback for timestamps
                let finalCreatedAt;
                if (matchedCreatedAt) {
                    finalCreatedAt = new Date(new Date(matchedCreatedAt).getTime() + 1000);
                }
                else {
                    if (lastMatchIndex >= 0 && userMessages[lastMatchIndex]) {
                        finalCreatedAt = new Date(new Date(userMessages[lastMatchIndex].createdAt).getTime() + 1000);
                    }
                    else if (userMessages.length > 0) {
                        finalCreatedAt = new Date(new Date(userMessages[0].createdAt).getTime() - 1000);
                    }
                    else {
                        finalCreatedAt = new Date();
                    }
                }
                return {
                    id: aiMsg.id,
                    sessionId: aiMsg.sessionId,
                    content: aiMsg.content,
                    rawMessage: aiMsg.rawMessage,
                    createdAt: finalCreatedAt,
                };
            });
            // 4. Combine and sort by date
            const combined = [...aiMessages, ...userMessages];
            combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return {
                source: 'dynamic_n8n_table_combined',
                tableName: dynamicTableName,
                messages: combined
            };
        }
        else {
            // Fallback: Query from standard messages table using session_id only
            if (!lead.session_id) {
                return reply.status(400).send({ error: 'Lead has no session_id' });
            }
            const res = await db_1.default.query(`SELECT * FROM public.messages 
         WHERE session_id = $1::text
         ORDER BY created_at ASC`, [lead.session_id]);
            return {
                source: 'standard_messages_table',
                messages: res.rows.map(row => ({
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
                })),
            };
        }
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: 'Failed to retrieve lead chat history' });
    }
});
// Get media base64 from Evolution API for a specific message
app.get('/api/messages/:id/media', async (request, reply) => {
    const { id } = request.params;
    try {
        // 1. Get message from db
        const msgRes = await db_1.default.query('SELECT * FROM public.messages WHERE id = $1', [id]);
        if (msgRes.rows.length === 0) {
            return reply.status(404).send({ error: 'Message not found' });
        }
        const message = msgRes.rows[0];
        // 2. Get agent instance name
        const agentRes = await db_1.default.query('SELECT instance_name FROM public.agents WHERE id = $1', [message.agent_id]);
        if (agentRes.rows.length === 0) {
            return reply.status(404).send({ error: 'Agent not found for this message' });
        }
        const agent = agentRes.rows[0];
        const instanceName = agent.instance_name;
        if (!instanceName) {
            return reply.status(400).send({ error: 'Agent has no Evolution API instance configured' });
        }
        // 3. Request media base64 from Evolution API
        const response = await evolutionRequest(`/chat/getBase64FromMediaMessage/${instanceName}`, {
            method: 'POST',
            body: JSON.stringify({
                message: {
                    key: {
                        id: message.message_id
                    }
                },
                convertToMp4: true
            })
        });
        return response;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: err.message || 'Failed to retrieve media from Evolution API' });
    }
});
// ---------------------------------------------------------------------------
// EVOLUTION API ROUTES
// ---------------------------------------------------------------------------
app.get('/api/evolution/instances', async (request, reply) => {
    try {
        const data = await evolutionRequest('/instance/fetchInstances');
        return data;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: err.message || 'Failed to fetch instances from Evolution API' });
    }
});
app.get('/api/evolution/connection-state/:instanceName', async (request, reply) => {
    const { instanceName } = request.params;
    try {
        const data = await evolutionRequest(`/instance/connectionState/${instanceName}`);
        return data;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: err.message || 'Failed to fetch connection state from Evolution API' });
    }
});
app.get('/api/evolution/connect/:instanceName', async (request, reply) => {
    const { instanceName } = request.params;
    try {
        const data = await evolutionRequest(`/instance/connect/${instanceName}`);
        return data;
    }
    catch (err) {
        app.log.error(err);
        reply.status(500).send({ error: err.message || 'Failed to fetch QR code from Evolution API' });
    }
});
// Start the server
const start = async () => {
    const port = Number(process.env.PORT) || 3000;
    try {
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server is running on port ${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
