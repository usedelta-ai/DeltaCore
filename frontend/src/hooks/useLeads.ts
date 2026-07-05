import { useState, useEffect } from 'react';
import { api, Lead } from '../services/api';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeads();
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar leads');
    } finally {
      setLoading(false);
    }
  };

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
    fetchLeads();
  }, []);

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
