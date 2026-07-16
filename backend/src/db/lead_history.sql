-- Criar a tabela de histórico de alterações de Leads (Lead History)
CREATE TABLE IF NOT EXISTS public.lead_history (
    id SERIAL PRIMARY KEY,
    lead_id INT NOT NULL REFERENCES public.lead(id) ON DELETE CASCADE,
    user_id INT REFERENCES public.users(id) ON DELETE SET NULL, -- ID do usuário que fez a alteração (nulo se foi o agente/sistema)
    agent_id INT REFERENCES public.agents(id) ON DELETE SET NULL, -- ID do agente (nulo se foi um usuário humano)
    changed_by_agent BOOLEAN DEFAULT false, -- Flag indicando se a alteração foi automatizada pelo agente
    field_name VARCHAR(100) NOT NULL, -- Nome do campo alterado (ex: 'status', 'value', 'agent_id', etc.)
    old_value TEXT, -- Valor anterior armazenado como texto
    new_value TEXT, -- Novo valor armazenado como texto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Data/hora da alteração
);

-- Índices para otimização de consultas e relatórios de auditoria
CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON public.lead_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_user_id ON public.lead_history(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_agent_id ON public.lead_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_created_at ON public.lead_history(created_at);
