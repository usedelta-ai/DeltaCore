import pool, { checkTableExists } from '../../../db';
import { DBPort } from '../../../ports/driven/DBPort';
import { Empresa } from '../../../domain/entities/Empresa';
import { Agent } from '../../../domain/entities/Agent';
import { Lead } from '../../../domain/entities/Lead';
import { FollowUpSetting, ChatMessage } from '../../../domain/entities/FollowUp';

export class PostgresAdapter implements DBPort {
  async getEmpresas(companyId?: number): Promise<Empresa[]> {
    let query = 'SELECT * FROM public.empresa';
    const params: any[] = [];
    if (companyId !== undefined) {
      query += ' WHERE id = $1';
      params.push(companyId);
    }
    query += ' ORDER BY id DESC';

    const res = await pool.query(query, params);
    return res.rows.map((row: any) => {
      if (row.logo) {
        row.logo = Buffer.from(row.logo).toString('base64');
      }
      return row;
    });
  }

  async createEmpresa(name: string, logo: string | null): Promise<Empresa> {
    const logoBuffer = logo ? Buffer.from(logo, 'base64') : null;
    const res = await pool.query(
      'INSERT INTO public.empresa (name, logo, active) VALUES ($1, $2, true) RETURNING *',
      [name, logoBuffer]
    );
    const row = res.rows[0];
    if (row.logo) {
      row.logo = Buffer.from(row.logo).toString('base64');
    }
    return row;
  }

  async updateEmpresa(id: number, name: string, logo?: string | null): Promise<Empresa> {
    let res;
    if (logo !== undefined) {
      const logoBuffer = logo ? Buffer.from(logo, 'base64') : null;
      res = await pool.query(
        'UPDATE public.empresa SET name = $1, logo = $2 WHERE id = $3 RETURNING *',
        [name, logoBuffer, id]
      );
    } else {
      res = await pool.query(
        'UPDATE public.empresa SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
      );
    }
    if (res.rows.length === 0) throw new Error('Empresa not found');
    const row = res.rows[0];
    if (row.logo) {
      row.logo = Buffer.from(row.logo).toString('base64');
    }
    return row;
  }

  async deleteEmpresa(id: number): Promise<boolean> {
    const res = await pool.query(
      'UPDATE public.empresa SET active = false WHERE id = $1 RETURNING *',
      [id]
    );
    return res.rows.length > 0;
  }

  async getAgents(companyId?: number): Promise<Agent[]> {
    let query = `
      SELECT a.*, e.name as empresa_name 
      FROM public.agents a
      JOIN public.empresa e ON a.empresa_id = e.id
    `;
    const params: any[] = [];
    if (companyId !== undefined) {
      query += ' WHERE a.empresa_id = $1';
      params.push(companyId);
    }
    query += ' ORDER BY a.id DESC';

    const res = await pool.query(query, params);
    return res.rows;
  }

  async getAgentById(id: number): Promise<Agent | null> {
    const res = await pool.query('SELECT * FROM public.agents WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async createAgent(agent: Omit<Agent, 'id'>): Promise<Agent> {
    const defaultJson = { itens: [], filters: {}, schema: {} };
    const res = await pool.query(
      `INSERT INTO public.agents 
      (name, prompt, phone_number, instance_name, status, empresa_id, upsert_lead, translations, search, search_data, validate, validate_data, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING *`,
      [
        agent.name, agent.prompt, agent.phone_number, agent.instance_name, agent.status ?? 1, agent.empresa_id, 
        agent.upsert_lead ?? true, agent.translations ? JSON.stringify(agent.translations) : null,
        agent.search ?? false, agent.search_data ? JSON.stringify(agent.search_data) : JSON.stringify(defaultJson),
        agent.validate ?? false, agent.validate_data ? JSON.stringify(agent.validate_data) : JSON.stringify(defaultJson)
      ]
    );
    return res.rows[0];
  }

  async updateAgent(id: number, agent: Partial<Agent>): Promise<Agent> {
    const current = await this.getAgentById(id);
    if (!current) throw new Error('Agent not found');

    const defaultJson = { itens: [], filters: {}, schema: {} };
    const res = await pool.query(
      `UPDATE public.agents SET 
        name = $1, prompt = $2, phone_number = $3, instance_name = $4, 
        status = $5, empresa_id = $6, upsert_lead = $7, translations = $8, 
        search = $9, search_data = $10, validate = $11, validate_data = $12, updated_at = NOW() 
      WHERE id = $13 RETURNING *`,
      [
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
      ]
    );
    return res.rows[0];
  }

  async deleteAgent(id: number): Promise<boolean> {
    const res = await pool.query(
      'UPDATE public.agents SET status = 0, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return res.rows.length > 0;
  }

  async getFollowUpSettings(companyId?: number): Promise<FollowUpSetting[]> {
    let query = `
      SELECT f.*, a.name as agent_name 
      FROM public.follow_up_settings f
      JOIN public.agents a ON f.agent_id = a.id
      WHERE f.active = true AND a.status != 0
    `;
    const params: any[] = [];
    if (companyId !== undefined) {
      query += ' AND a.empresa_id = $1';
      params.push(companyId);
    }
    query += ' ORDER BY f.agent_id, f.order ASC';

    const res = await pool.query(query, params);
    return res.rows;
  }

  async createFollowUpSetting(setting: Omit<FollowUpSetting, 'id'>): Promise<FollowUpSetting> {
    const res = await pool.query(
      `INSERT INTO public.follow_up_settings ("order", message, "time", agent_id, active, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [setting.order, setting.message, setting.time, setting.agent_id, setting.active ?? true]
    );
    return res.rows[0];
  }

  async updateFollowUpSetting(id: number, setting: Partial<FollowUpSetting>): Promise<FollowUpSetting> {
    const currentRes = await pool.query('SELECT * FROM public.follow_up_settings WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) throw new Error('Setting not found');
    const current = currentRes.rows[0];

    const res = await pool.query(
      `UPDATE public.follow_up_settings SET 
        "order" = $1, message = $2, "time" = $3, agent_id = $4, active = $5 
      WHERE id = $6 RETURNING *`,
      [
        setting.order ?? current.order,
        setting.message ?? current.message,
        setting.time ?? current.time,
        setting.agent_id ?? current.agent_id,
        setting.active ?? current.active,
        id
      ]
    );
    return res.rows[0];
  }

  async deleteFollowUpSetting(id: number): Promise<boolean> {
    const res = await pool.query(
      'UPDATE public.follow_up_settings SET active = false WHERE id = $1 RETURNING *',
      [id]
    );
    return res.rows.length > 0;
  }

  async getLeads(companyId?: number): Promise<Lead[]> {
    let query = `
      SELECT l.*, a.name as agent_name, a.status as agent_status, f.message as follow_up_message
      FROM public.lead l
      LEFT JOIN public.agents a ON l.agent_id = a.id
      LEFT JOIN public.follow_up_settings f ON l.follow_up_id = f.id
      WHERE l.status != 'CANCELADO'
    `;
    const params: any[] = [];
    if (companyId !== undefined) {
      query += ' AND a.empresa_id = $1';
      params.push(companyId);
    }
    query += ' ORDER BY l.id DESC';

    const res = await pool.query(query, params);
    return res.rows;
  }

  async getLeadById(id: number): Promise<Lead | null> {
    const res = await pool.query('SELECT * FROM public.lead WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async createLead(lead: Omit<Lead, 'id'>): Promise<Lead> {
    const res = await pool.query(
      `INSERT INTO public.lead 
      (agent_id, remote_jid_alt, name, custom_properties, status, taken_over_at, 
       take_over_expires_at, updated_at, created_at, taken_motive, value, lastmessage, follow_up_id, session_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10, $11, $12) RETURNING *`,
      [
        lead.agent_id, lead.remote_jid_alt, lead.name, lead.custom_properties ? JSON.stringify(lead.custom_properties) : null,
        lead.status ?? 'NOVO', lead.taken_over_at, lead.take_over_expires_at, lead.taken_motive, lead.value, lead.lastmessage, lead.follow_up_id, lead.session_id || null
      ]
    );
    return res.rows[0];
  }

  async updateLead(id: number, lead: Partial<Lead>): Promise<Lead> {
    const oldLead = await this.getLeadById(id);
    if (!oldLead) throw new Error('Lead not found');

    let finalTakenOverAt = lead.taken_over_at;
    if (lead.status === 'HUMANO' && oldLead.status !== 'HUMANO') {
      finalTakenOverAt = new Date();
    } else if (lead.taken_over_at === undefined) {
      finalTakenOverAt = oldLead.taken_over_at;
    }

    const res = await pool.query(
      `UPDATE public.lead SET 
        agent_id = $1, remote_jid_alt = $2, name = $3, 
        custom_properties = $4, status = $5, taken_over_at = $6, 
        take_over_expires_at = $7, taken_motive = $8, value = $9, 
        lastmessage = $10, follow_up_id = $11, session_id = $12, updated_at = NOW() 
      WHERE id = $13 RETURNING *`,
      [
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
      ]
    );
    return res.rows[0];
  }

  async deleteLead(id: number): Promise<boolean> {
    const res = await pool.query(
      "UPDATE public.lead SET status = 'CANCELADO', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    return res.rows.length > 0;
  }

  async checkTableExists(tableName: string): Promise<boolean> {
    return checkTableExists(tableName);
  }

  async getDynamicTableMessages(tableName: string): Promise<any[]> {
    // Sanitized dynamic tables
    const query = `SELECT * FROM public."${tableName}" ORDER BY id ASC`;
    const res = await pool.query(query);
    return res.rows;
  }

  async getStandardMessages(agentId: number): Promise<ChatMessage[]> {
    const res = await pool.query(
      'SELECT * FROM public.messages WHERE agent_id = $1 ORDER BY created_at ASC',
      [agentId]
    );
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

  async getLeadStandardMessages(sessionId: string): Promise<ChatMessage[]> {
    const res = await pool.query(
      `SELECT * FROM public.messages 
       WHERE session_id = $1::text
       ORDER BY created_at ASC`,
      [sessionId]
    );
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

  async getMessageById(id: number): Promise<any> {
    const msgRes = await pool.query('SELECT * FROM public.messages WHERE id = $1', [id]);
    return msgRes.rows[0] || null;
  }
}
