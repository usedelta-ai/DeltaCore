import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Lead } from '../services/api';

export function useLeads(token: string | null, empresaId?: string | number, agentId?: string | number) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeads(String(empresaId || ''), String(agentId || ''));
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar leads');
    } finally {
      setLoading(false);
    }
  }, [empresaId, agentId]);

  const createLead = async (leadData: Partial<Lead>) => {
    setError(null);
    try {
      const newLead = await api.createLead(leadData);
      setLeads((prev) => [newLead, ...prev]);
      return newLead;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar lead');
      throw err;
    }
  };

  const updateLead = async (id: number, leadData: Partial<Lead>) => {
    setError(null);
    try {
      const updated = await api.updateLead(id, leadData);
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar lead');
      throw err;
    }
  };

  const deleteLead = async (id: number) => {
    setError(null);
    try {
      await api.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir lead');
      throw err;
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeads();
    } else {
      setLeads([]);
    }
  }, [token, fetchLeads]);

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    createLead,
    updateLead,
    deleteLead,
  };
}
