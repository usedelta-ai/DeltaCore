import { useState, useEffect } from 'react';
import { api, Agent } from '../services/api';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar agentes');
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: Partial<Agent>) => {
    setError(null);
    try {
      const newAgent = await api.createAgent(agentData);
      setAgents((prev) => [newAgent, ...prev]);
      return newAgent;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar agente');
      throw err;
    }
  };

  const updateAgent = async (id: number, agentData: Partial<Agent>) => {
    setError(null);
    try {
      const updated = await api.updateAgent(id, agentData);
      setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar agente');
      throw err;
    }
  };

  const deleteAgent = async (id: number) => {
    setError(null);
    try {
      await api.deleteAgent(id);
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status: 0 } : a)));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir agente');
      throw err;
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}
