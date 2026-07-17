import pool, { db, checkTableExists } from '../../../db';
import { DBPort } from '../../../ports/driven/DBPort';
import { Empresa } from '../../../domain/entities/Empresa';
import { Agent } from '../../../domain/entities/Agent';
import { Lead } from '../../../domain/entities/Lead';
import { FollowUpSetting, ChatMessage } from '../../../domain/entities/FollowUp';
import { User } from '../../../domain/entities/User';
import { Pessoa } from '../../../domain/entities/Pessoa';
import { eq, and, sql, notInArray, desc, asc, or } from 'drizzle-orm';
import * as schema from '../../../db/schema';

export class PostgresAdapter implements DBPort {
  async getEmpresas(companyId?: number): Promise<Empresa[]> {
    const conditions = [];
    if (companyId !== undefined) {
      conditions.push(eq(schema.empresa.id, companyId));
    }
    const res = await db.select()
      .from(schema.empresa)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.empresa.id));

    return res.map((row: any) => {
      if (row.logo) {
        row.logo = Buffer.from(row.logo).toString('base64');
      }
      return row;
    });
  }

  async createEmpresa(name: string, logo: string | null): Promise<Empresa> {
    const logoBuffer = logo ? Buffer.from(logo, 'base64') : null;
    const res = await db.insert(schema.empresa)
      .values({ name, logo: logoBuffer, active: true })
      .returning();
    const row = res[0] as any;
    if (row.logo) {
      row.logo = Buffer.from(row.logo).toString('base64');
    }
    return row;
  }

  async updateEmpresa(id: number, name: string, logo?: string | null): Promise<Empresa> {
    const updateData: any = { name };
    if (logo !== undefined) {
      updateData.logo = logo ? Buffer.from(logo, 'base64') : null;
    }
    const res = await db.update(schema.empresa)
      .set(updateData)
      .where(eq(schema.empresa.id, id))
      .returning();
    if (res.length === 0) throw new Error('Empresa not found');
    const row = res[0] as any;
    if (row.logo) {
      row.logo = Buffer.from(row.logo).toString('base64');
    }
    return row;
  }

  async deleteEmpresa(id: number): Promise<boolean> {
    const res = await db.update(schema.empresa)
      .set({ active: false })
      .where(eq(schema.empresa.id, id))
      .returning();
    return res.length > 0;
  }

  async getAgents(companyId?: number): Promise<Agent[]> {
    const conditions = [];
    if (companyId !== undefined) {
      conditions.push(eq(schema.agents.empresa_id, companyId));
    }
    const res = await db.select({
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
      created_at: schema.agents.created_at,
      updated_at: schema.agents.updated_at,
      empresa_name: schema.empresa.name,
    })
    .from(schema.agents)
    .innerJoin(schema.empresa, eq(schema.agents.empresa_id, schema.empresa.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.agents.id));

    return res as any[];
  }

  async getAgentById(id: number): Promise<Agent | null> {
    const res = await db.select()
      .from(schema.agents)
      .where(eq(schema.agents.id, id));
    return (res[0] as any) || null;
  }

  async createAgent(agent: Omit<Agent, 'id'>): Promise<Agent> {
    const defaultJson = { itens: [], filters: {}, schema: {} };
    const res = await db.insert(schema.agents)
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
      })
      .returning();
    return res[0] as any;
  }

  async updateAgent(id: number, agent: Partial<Agent>): Promise<Agent> {
    const current = await this.getAgentById(id);
    if (!current) throw new Error('Agent not found');

    const defaultJson = { itens: [], filters: {}, schema: {} };
    const res = await db.update(schema.agents)
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
        updated_at: new Date(),
      })
      .where(eq(schema.agents.id, id))
      .returning();
    return res[0] as any;
  }

  async deleteAgent(id: number): Promise<boolean> {
    const res = await db.update(schema.agents)
      .set({ status: 0, updated_at: new Date() })
      .where(eq(schema.agents.id, id))
      .returning();
    return res.length > 0;
  }

  async getFollowUpSettings(companyId?: number): Promise<FollowUpSetting[]> {
    const conditions = [
      eq(schema.follow_up_settings.active, true),
      sql`${schema.agents.status} != 0`
    ];
    if (companyId !== undefined) {
      conditions.push(eq(schema.agents.empresa_id, companyId));
    }
    const res = await db.select({
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
    .innerJoin(schema.agents, eq(schema.follow_up_settings.agent_id, schema.agents.id))
    .where(and(...conditions))
    .orderBy(asc(schema.follow_up_settings.agent_id), asc(schema.follow_up_settings.order));

    return res as any[];
  }

  async createFollowUpSetting(setting: Omit<FollowUpSetting, 'id'>): Promise<FollowUpSetting> {
    const res = await db.insert(schema.follow_up_settings)
      .values({
        order: setting.order,
        message: setting.message,
        time: setting.time,
        agent_id: setting.agent_id,
        active: setting.active ?? true,
      })
      .returning();
    return res[0] as any;
  }

  async updateFollowUpSetting(id: number, setting: Partial<FollowUpSetting>): Promise<FollowUpSetting> {
    const currentRes = await db.select().from(schema.follow_up_settings).where(eq(schema.follow_up_settings.id, id));
    if (currentRes.length === 0) throw new Error('Setting not found');
    const current = currentRes[0];

    const res = await db.update(schema.follow_up_settings)
      .set({
        order: setting.order ?? current.order,
        message: setting.message ?? current.message,
        time: setting.time ?? current.time,
        agent_id: setting.agent_id ?? current.agent_id,
        active: setting.active ?? current.active,
      })
      .where(eq(schema.follow_up_settings.id, id))
      .returning();
    return res[0] as any;
  }

  async deleteFollowUpSetting(id: number): Promise<boolean> {
    const res = await db.update(schema.follow_up_settings)
      .set({ active: false })
      .where(eq(schema.follow_up_settings.id, id))
      .returning();
    return res.length > 0;
  }

  async getLeads(companyId?: number, agentId?: number): Promise<Lead[]> {
    const conditions: any[] = [
      notInArray(schema.lead.status, ['CANCELADO'])
    ];

    if (companyId !== undefined) {
      conditions.push(eq(schema.agents.empresa_id, companyId));
    }
    if (agentId !== undefined) {
      conditions.push(eq(schema.lead.agent_id, agentId));
    }

    const res = await db.select({
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
      translations: schema.agents.translations,
      agent_name: schema.agents.name,
      agent_status: schema.agents.status,
      follow_up_message: schema.follow_up_settings.message,
    })
    .from(schema.lead)
    .leftJoin(schema.agents, eq(schema.lead.agent_id, schema.agents.id))
    .leftJoin(schema.follow_up_settings, eq(schema.lead.follow_up_id, schema.follow_up_settings.id))
    .leftJoin(schema.users, eq(schema.lead.finalized_by, schema.users.id))
    .where(and(...conditions))
    .orderBy(desc(schema.lead.id));

    return res as any[];
  }

  async getLeadById(id: number): Promise<Lead | null> {
    const res = await db.select({
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
    .leftJoin(schema.users, eq(schema.lead.finalized_by, schema.users.id))
    .where(eq(schema.lead.id, id));
    return (res[0] as any) || null;
  }

  async createLead(lead: Omit<Lead, 'id'>): Promise<Lead> {
    const res = await db.insert(schema.lead)
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
    return res[0] as any;
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

    const res = await db.update(schema.lead)
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
      .where(eq(schema.lead.id, id))
      .returning();
    return res[0] as any;
  }

  async deleteLead(id: number): Promise<boolean> {
    const res = await db.update(schema.lead)
      .set({ status: 'CANCELADO', updated_at: new Date() })
      .where(eq(schema.lead.id, id))
      .returning();
    return res.length > 0;
  }

  async checkTableExists(tableName: string): Promise<boolean> {
    return checkTableExists(tableName);
  }

  async getDynamicTableMessages(tableName: string, sessionId?: string): Promise<any[]> {
    const sanitizedTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    let query = `SELECT * FROM public."${sanitizedTableName}"`;
    const params: any[] = [];
    if (sessionId) {
      query += ` WHERE session_id = $1`;
      params.push(sessionId);
    }
    query += ` ORDER BY id ASC`;
    const res = await pool.query(query, params);
    return res.rows;
  }

  async getStandardMessages(agentId: number): Promise<ChatMessage[]> {
    const res = await db.select()
      .from(schema.messages)
      .where(eq(schema.messages.agent_id, agentId))
      .orderBy(asc(schema.messages.created_at));

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

  async getLeadStandardMessages(sessionId: string): Promise<ChatMessage[]> {
    const bare = sessionId.replace(/@[^@]+$/, '');
    const res = await db.select()
      .from(schema.messages)
      .where(or(
        eq(schema.messages.session_id, sessionId),
        eq(schema.messages.session_id, bare)
      ))
      .orderBy(asc(schema.messages.created_at));

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

  async getMessageById(id: number): Promise<any> {
    const res = await db.select().from(schema.messages).where(eq(schema.messages.id, id));
    return res[0] || null;
  }

  async createMessage(message: {
    agent_id: number;
    session_id: string;
    content: string;
    role: string;
    source: string;
    remote_jid: string;
    message_type: string;
    message_id: string;
    quote_message_content?: string;
    user_id?: number;
  }): Promise<any> {
    const res = await db.insert(schema.messages)
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

  async getUsers(companyId?: number): Promise<User[]> {
    const conditions = [eq(schema.users.active, true)];
    if (companyId !== undefined) {
      conditions.push(eq(schema.users.empresa_id, companyId));
    }
    const res = await db.select()
      .from(schema.users)
      .where(and(...conditions))
      .orderBy(desc(schema.users.id));
    return res as any[];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const res = await db.select()
      .from(schema.users)
      .where(and(
        eq(schema.users.email, email),
        eq(schema.users.active, true)
      ));
    return (res[0] as any) || null;
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const res = await db.insert(schema.users)
      .values({
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        empresa_id: user.empresa_id || null,
        active: true,
      })
      .returning();
    return res[0] as any;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const currentRes = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (currentRes.length === 0) throw new Error('User not found');
    const current = currentRes[0];

    const res = await db.update(schema.users)
      .set({
        name: user.name ?? current.name,
        email: user.email ?? current.email,
        password: user.password ?? current.password,
        role: (user.role ?? current.role) as any,
        empresa_id: user.empresa_id !== undefined ? user.empresa_id : current.empresa_id,
        active: user.active ?? current.active,
        updated_at: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    return res[0] as any;
  }

  async deleteUser(id: number): Promise<boolean> {
    const res = await db.update(schema.users)
      .set({ active: false, updated_at: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return res.length > 0;
  }

  async getLeadHistoryChanges(leadId: number): Promise<any[]> {
    const res = await db.select({
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
    .leftJoin(schema.users, eq(schema.lead_history.user_id, schema.users.id))
    .leftJoin(schema.agents, eq(schema.lead_history.agent_id, schema.agents.id))
    .where(eq(schema.lead_history.lead_id, leadId))
    .orderBy(asc(schema.lead_history.created_at));

    return res;
  }

  async insertLeadHistoryLog(log: {
    lead_id: number;
    user_id?: number | null;
    agent_id?: number | null;
    changed_by_agent: boolean;
    field_name: string;
    old_value: string | null;
    new_value: string | null;
  }): Promise<void> {
    await db.insert(schema.lead_history)
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
  async getPessoas(): Promise<Pessoa[]> {
    const res = await db.select().from(schema.pessoa).orderBy(desc(schema.pessoa.id));
    return res as Pessoa[];
  }

  async getPessoaById(id: number): Promise<Pessoa | null> {
    const res = await db.select().from(schema.pessoa).where(eq(schema.pessoa.id, id));
    return (res[0] as Pessoa) || null;
  }

  async getPessoaByPhone(phone: string): Promise<Pessoa | null> {
    const res = await db.select().from(schema.pessoa).where(eq(schema.pessoa.phone, phone));
    return (res[0] as Pessoa) || null;
  }

  async createPessoa(pessoa: Omit<Pessoa, 'id'>): Promise<Pessoa> {
    const res = await db.insert(schema.pessoa)
      .values({
        name: pessoa.name,
        phone: pessoa.phone,
      })
      .returning();
    return res[0] as Pessoa;
  }

  async updatePessoa(id: number, pessoa: Partial<Pessoa>): Promise<Pessoa> {
    const res = await db.update(schema.pessoa)
      .set({
        name: pessoa.name,
        phone: pessoa.phone,
        updated_at: new Date(),
      })
      .where(eq(schema.pessoa.id, id))
      .returning();
    if (res.length === 0) throw new Error('Pessoa not found');
    return res[0] as Pessoa;
  }

  async deletePessoa(id: number): Promise<boolean> {
    const res = await db.delete(schema.pessoa).where(eq(schema.pessoa.id, id)).returning();
    return res.length > 0;
  }

  async getLeadsByPessoaId(pessoaId: number): Promise<Lead[]> {
    const res = await db.select({
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
    .leftJoin(schema.agents, eq(schema.lead.agent_id, schema.agents.id))
    .where(eq(schema.lead.pessoa_id, pessoaId))
    .orderBy(desc(schema.lead.id));

    return res as any[];
  }

  async getLeadsByPhone(phone: string): Promise<Lead[]> {
    const res = await db.select({
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
    .leftJoin(schema.agents, eq(schema.lead.agent_id, schema.agents.id))
    .where(or(
      eq(schema.lead.remote_jid_alt, phone),
      eq(schema.lead.remote_jid_alt, `${phone}@s.whatsapp.net`)
    ))
    .orderBy(desc(schema.lead.id));

    return res as any[];
  }
}
