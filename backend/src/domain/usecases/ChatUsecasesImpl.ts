import { ChatUsecases } from '../../ports/driver/ChatUsecases';
import { DBPort } from '../../ports/driven/DBPort';
import { EvolutionAPIPort } from '../../ports/driven/EvolutionAPIPort';
import { UserSession } from '../../adapters/driver/http/middlewares/AuthMiddleware';

export class ChatUsecasesImpl implements ChatUsecases {
  constructor(
    private db: DBPort,
    private evolution: EvolutionAPIPort
  ) {}

  private async checkCompanyAccessByAgent(user: UserSession, agentId: number) {
    if (user.role !== 'superadmin') {
      const agent = await this.db.getAgentById(agentId);
      if (!agent || agent.empresa_id !== user.companyId) {
        throw new Error('Unauthorized: You do not have access to this company\'s resources');
      }
    }
  }

  private getAgentTableNames(identifier: string) {
    const sanitized = identifier.toLowerCase().replace(/[^a-z0-9_]/g, '');
    return [
      `n8n_chat_histories_${sanitized}`
    ];
  }

  async getAgentHistory(user: UserSession, agentId: number): Promise<any> {
    await this.checkCompanyAccessByAgent(user, agentId);
    const agent = await this.db.getAgentById(agentId);
    if (!agent) throw new Error('Agent not found');

    const possibleTables = this.getAgentTableNames(agent.instance_name || agent.name);
    let dynamicTableName = null;
    for (const tableName of possibleTables) {
      const exists = await this.db.checkTableExists(tableName);
      if (exists) {
        dynamicTableName = tableName;
        break;
      }
    }

    if (dynamicTableName) {
      const rows = await this.db.getDynamicTableMessages(dynamicTableName);
      return {
        source: 'dynamic_n8n_table',
        tableName: dynamicTableName,
        messages: rows.map(row => ({
          id: row.id,
          sessionId: row.session_id || row.session_id_alt,
          content: typeof row.message === 'string' ? row.message : JSON.stringify(row.message),
          rawMessage: row.message,
          createdAt: row.created_at || new Date(),
        })),
      };
    } else {
      const messages = await this.db.getStandardMessages(agentId);
      return {
        source: 'standard_messages_table',
        messages
      };
    }
  }

  async getLeadHistory(user: UserSession, leadId: number): Promise<any> {
    const lead = await this.db.getLeadById(leadId);
    if (!lead) throw new Error('Lead not found');
    await this.checkCompanyAccessByAgent(user, lead.agent_id);

    if (!lead.session_id) throw new Error('Lead has no session_id');
    const messages = await this.db.getLeadStandardMessages(lead.session_id);

    const systemEvents: any[] = [];
    const isHuman = lead.status === 'HUMANO';
    const isFinalized = lead.status === 'FINALIZADO' || lead.status === 'CONCLUIDO';

    if ((isHuman || isFinalized) && lead.taken_over_at) {
      systemEvents.push({
        id: `system-human-${lead.id}`,
        type: 'system_event',
        event: 'human_takeover',
        content: lead.taken_motive
          ? `🔁 Atendimento humano — ${lead.taken_motive}`
          : '🔁 Atendimento humano iniciado',
        role: 'system_event',
        createdAt: new Date(lead.taken_over_at),
      });
    }

    if (isFinalized) {
      systemEvents.push({
        id: `system-finalized-${lead.id}`,
        type: 'system_event',
        event: 'lead_finalized',
        content: lead.status === 'CONCLUIDO'
          ? '✅ Atendimento concluído'
          : '✅ Atendimento finalizado',
        role: 'system_event',
        createdAt: lead.updated_at ? new Date(lead.updated_at) : new Date(),
      });
    }

    const combined = [
      ...messages.map((m: any) => ({ ...m, type: 'message' })),
      ...systemEvents,
    ];
    combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return {
      source: 'standard_messages_table',
      messages: combined,
    };
  }

  async getLeadAgentHistory(user: UserSession, leadId: number): Promise<any> {
    const lead = await this.db.getLeadById(leadId);
    if (!lead) throw new Error('Lead not found');
    await this.checkCompanyAccessByAgent(user, lead.agent_id);

    if (!lead.session_id) throw new Error('Lead has no session_id');

    // ── 1) Always load the standard WhatsApp messages ──────────────────────────
    const standardMessages = await this.db.getLeadStandardMessages(lead.session_id);

    // ── 2) Try to find the n8n dynamic table for this agent ────────────────────
    const agent = await this.db.getAgentById(lead.agent_id);
    if (!agent) {
      return { source: 'standard_messages_table', messages: standardMessages };
    }

    const possibleTables = this.getAgentTableNames(agent.instance_name || agent.name);
    let dynamicTableName: string | null = null;
    for (const tableName of possibleTables) {
      const exists = await this.db.checkTableExists(tableName);
      if (exists) { dynamicTableName = tableName; break; }
    }

    if (!dynamicTableName) {
      return { source: 'standard_messages_table', messages: standardMessages };
    }

    // ── 3) Load n8n rows for this session ──────────────────────────────────────
    const dynRows = await this.db.getDynamicTableMessages(dynamicTableName, lead.session_id);

    // ── 4) Extract ONLY tool_call and tool_result events from n8n rows ─────────
    //   Each n8n row has a "message" field which is a JSON array of { role, content }
    //   We only care about:
    //     • role === 'assistant' with Array content → tool calls
    //     • role === 'tool'                          → tool results
    const toolEvents: any[] = [];

    for (let rowIdx = 0; rowIdx < dynRows.length; rowIdx++) {
      const row = dynRows[rowIdx];
      let parsed: any;
      try {
        parsed = typeof row.message === 'string' ? JSON.parse(row.message) : row.message;
      } catch (_) { continue; }

      // Each row may be a single object or an array
      let items: any[] = Array.isArray(parsed) ? parsed : [parsed];

      // Some n8n tables wrap the array inside { type: "ai", content: "[...json..." }
      // Detect this: single item with no 'role' but string 'content' that is a JSON array
      if (items.length === 1 && !items[0].role && typeof items[0].content === 'string') {
        try {
          const nested = JSON.parse(items[0].content);
          if (Array.isArray(nested)) {
            items = nested;
          }
        } catch (_) {}
      }

      // Find the user message text in this row to use for timestamp matching
      const humanItem = items.find((it: any) =>
        (it.role || '').toLowerCase() === 'human' || (it.role || '').toLowerCase() === 'user'
      );
      const humanTextRaw: string = humanItem
        ? (typeof humanItem.content === 'string' ? humanItem.content : JSON.stringify(humanItem.content)).trim()
        : '';

      // Strip XML tags for matching — n8n often wraps content in <userMsg> tags
      const stripXml = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const humanTextClean = stripXml(humanTextRaw);

      // Position tool events exactly between the user message and the next AI response
      let anchorTime: Date | null = null;

      if (humanTextClean) {
        // Find the user message in standardMessages by cleaned content match
        let userMsgIdx = standardMessages.findIndex((m: any) =>
          stripXml((m.content || '').trim()) === humanTextClean ||
          (m.content || '').trim().includes(humanTextClean) ||
          humanTextClean.includes(stripXml((m.content || '').trim()))
        );

        // Fallback: find by first significant word (e.g. CPF number, name)
        if (userMsgIdx === -1) {
          const firstWord = humanTextClean.split(' ')[0];
          if (firstWord.length > 3) {
            userMsgIdx = standardMessages.findIndex((m: any) =>
              stripXml((m.content || '').trim()).includes(firstWord)
            );
          }
        }

        if (userMsgIdx !== -1) {
          const userMsg = standardMessages[userMsgIdx];
          const userTime = new Date((userMsg as any).createdAt || (userMsg as any).created_at).getTime();

          // Find the next AI/assistant message after this user message
          let aiTime = userTime + 1000;
          for (let j = userMsgIdx + 1; j < standardMessages.length; j++) {
            const role = ((standardMessages[j] as any).role || '').toLowerCase();
            const source = ((standardMessages[j] as any).source || '').toLowerCase();
            if (role === 'assistant' || role === 'bot' || role === 'ai' || source === 'bot' || source === 'ai') {
              aiTime = new Date((standardMessages[j] as any).createdAt || (standardMessages[j] as any).created_at).getTime();
              break;
            }
          }

          // Place tool events midway between user message and AI response
          anchorTime = new Date(Math.round((userTime + aiTime) / 2));
        }
      }

      // Fallback: use row created_at if no match found
      if (!anchorTime) {
        anchorTime = row.created_at ? new Date(row.created_at) : null;
      }

      // Last resort: use the timestamp of the nearest standard message by index
      if (!anchorTime && standardMessages.length > 0) {
        const safeIdx = Math.min(rowIdx, standardMessages.length - 1);
        anchorTime = new Date((standardMessages[safeIdx] as any).createdAt || (standardMessages[safeIdx] as any).created_at || Date.now());
      }

      // Collect tool calls and tool results by toolCallId within this row
      const toolCallMap = new Map<string, any>();
      const toolResultMap = new Map<string, any>();

      for (const item of items) {
        const role = (item.role || '').toLowerCase();

        if ((role === 'assistant' || role === 'ai') && Array.isArray(item.content)) {
          for (const tc of item.content) {
            if (tc.type === 'tool-call' || tc.toolName || tc.tool_name || tc.name) {
              const callId = tc.toolCallId || tc.tool_call_id || `tc-${row.id}-${Math.random()}`;
              toolCallMap.set(callId, tc);
            }
          }
        }

        if (role === 'tool' && Array.isArray(item.content)) {
          for (const tr of item.content) {
            if (tr.type === 'tool-result' || tr.toolName || tr.tool_name || tr.name) {
              const callId = tr.toolCallId || tr.tool_call_id || `tr-${row.id}-${Math.random()}`;
              toolResultMap.set(callId, tr);
            }
          }
        }
      }

      // Group by toolCallId — each group has call + result together
      const allIds = new Set([...toolCallMap.keys(), ...toolResultMap.keys()]);
      let eventOffset = 0;
      for (const callId of allIds) {
        const tc = toolCallMap.get(callId);
        const tr = toolResultMap.get(callId);

        const eventTime = anchorTime
          ? new Date(anchorTime.getTime() + 500 + eventOffset)
          : new Date();
        eventOffset += 100;

        const toolName = tc?.toolName || tc?.tool_name || tc?.name || tr?.toolName || 'unknown';
        const args = tc?.args || tc?.arguments || null;
        const result = tr?.result || null;

        toolEvents.push({
          id: `tool-group-${row.id}-${eventOffset}`,
          type: 'tool_group',
          sessionId: row.session_id,
          content: JSON.stringify({ toolName, args, result }),
          rawMessage: { toolName, args, result, toolCallId: callId },
          createdAt: eventTime,
          role: 'tool_group',
        });
      }
    }

    // ── 5) Inject system events (human takeover, finalization) ─────────────────
    const systemEvents: any[] = [];

    const isHuman = lead.status === 'HUMANO';
    const isFinalized = lead.status === 'FINALIZADO' || lead.status === 'CONCLUIDO';

    if ((isHuman || isFinalized) && lead.taken_over_at) {
      systemEvents.push({
        id: `system-human-${lead.id}`,
        type: 'system_event',
        event: 'human_takeover',
        content: lead.taken_motive
          ? `🔁 Atendimento humano — ${lead.taken_motive}`
          : '🔁 Atendimento humano iniciado',
        role: 'system_event',
        createdAt: new Date(lead.taken_over_at),
      });
    }

    if (isFinalized) {
      systemEvents.push({
        id: `system-finalized-${lead.id}`,
        type: 'system_event',
        event: 'lead_finalized',
        content: lead.status === 'CONCLUIDO'
          ? '✅ Atendimento concluído'
          : '✅ Atendimento finalizado',
        role: 'system_event',
        createdAt: lead.updated_at ? new Date(lead.updated_at) : new Date(),
      });
    }

    // ── 6) Merge standard messages + tool events + system events, sort chronologically ──
    const combined = [
      ...standardMessages.map((m: any) => ({ ...m, type: 'message' })),
      ...toolEvents,
      ...systemEvents,
    ];
    combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return {
      source: 'combined_messages_and_tools',
      tableName: dynamicTableName,
      messages: combined,
    };
  }

  async getMessageMedia(user: UserSession, messageId: number): Promise<any> {
    const message = await this.db.getMessageById(messageId);
    if (!message) throw new Error('Message not found');
    await this.checkCompanyAccessByAgent(user, message.agent_id);

    const agent = await this.db.getAgentById(message.agent_id);
    if (!agent) throw new Error('Agent not found');
    const instanceName = agent.instance_name;
    if (!instanceName) throw new Error('Agent has no instance configured');

    return this.evolution.getBase64FromMediaMessage(instanceName, message.message_id);
  }

  async sendPresence(user: UserSession, leadId: number, presence: 'composing' | 'recording'): Promise<void> {
    const lead = await this.db.getLeadById(leadId);
    if (!lead) throw new Error('Lead not found');
    await this.checkCompanyAccessByAgent(user, lead.agent_id);

    const agent = await this.db.getAgentById(lead.agent_id);
    if (!agent) throw new Error('Agent not found for this lead');

    const instanceName = agent.instance_name;
    if (!instanceName) throw new Error('Agent has no Evolution API instance configured');

    const cleanNumber = lead.remote_jid_alt.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
    await this.evolution.sendPresence(instanceName, cleanNumber, presence);
  }

  async sendMessage(user: UserSession, leadId: number, content: string, options?: { messageType?: string; mediaBase64?: string; fileName?: string; quotedMessageId?: number }): Promise<any> {
    const lead = await this.db.getLeadById(leadId);
    if (!lead) throw new Error('Lead not found');
    await this.checkCompanyAccessByAgent(user, lead.agent_id);

    const agent = await this.db.getAgentById(lead.agent_id);
    if (!agent) throw new Error('Agent not found for this lead');

    const instanceName = agent.instance_name;
    if (!instanceName) throw new Error('Agent has no Evolution API instance configured');

    const cleanNumber = lead.remote_jid_alt.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');

    // Resolve quoted message text if replying
    let quotedText: string | undefined;
    let finalContent = content;
    if (options?.quotedMessageId) {
      const quotedMsg = await this.db.getMessageById(options.quotedMessageId);
      if (quotedMsg) {
        quotedText = quotedMsg.content || undefined;
        if (quotedText) {
          const quotedLines = quotedText.split('\n').map(l => `> ${l}`).join('\n');
          finalContent = `${quotedLines}\n\n${content}`;
        }
      }
    }

    // Send via Evolution API
    let response: any;
    if (options?.messageType && options?.messageType !== 'text' && options?.mediaBase64) {
      const isAudio = options.messageType === 'audio';
      if (isAudio) {
        response = await this.evolution.sendWhatsAppAudio(instanceName, cleanNumber, options.mediaBase64);
      } else {
        response = await this.evolution.sendMediaMessage(instanceName, cleanNumber, options.messageType, options.mediaBase64, {
          caption: finalContent || undefined,
          fileName: options.fileName
        });
      }
    } else {
      response = await this.evolution.sendTextMessage(instanceName, cleanNumber, finalContent);
    }

    const messageId = response?.key?.id || response?.message?.key?.id || `platform-${Date.now()}`;

    // Persist in DB
    const savedMsg = await this.db.createMessage({
      agent_id: lead.agent_id,
      session_id: lead.session_id || lead.remote_jid_alt,
      content: options?.mediaBase64 ? (options.fileName || content || '') : finalContent,
      role: 'attendant',
      source: 'platform',
      remote_jid: lead.remote_jid_alt,
      message_type: options?.messageType || 'text',
      message_id: messageId,
      quote_message_content: quotedText
    });

    if (lead.status === 'NOVO') {
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      await this.db.updateLead(leadId, {
        status: 'HUMANO',
        taken_motive: 'Atendimento iniciado pela plataforma',
        take_over_expires_at: expiresAt
      });
    }

    return {
      success: true,
      message: savedMsg,
      evolutionResponse: response
    };
  }
}
