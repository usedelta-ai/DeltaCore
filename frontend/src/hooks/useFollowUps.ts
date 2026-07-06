import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { FollowUpSetting } from '../services/api';

export function useFollowUps(token: string | null) {
  const [followUps, setFollowUps] = useState<FollowUpSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowUps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFollowUps();
      setFollowUps(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const createFollowUp = async (data: Partial<FollowUpSetting>) => {
    setError(null);
    try {
      const newFollow = await api.createFollowUp(data);
      setFollowUps((prev) => [...prev, newFollow]);
      return newFollow;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar follow-up');
      throw err;
    }
  };

  const updateFollowUp = async (id: number, data: Partial<FollowUpSetting>) => {
    setError(null);
    try {
      const updated = await api.updateFollowUp(id, data);
      setFollowUps((prev) => prev.map((f) => (f.id === id ? updated : f)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar follow-up');
      throw err;
    }
  };

  const deleteFollowUp = async (id: number) => {
    setError(null);
    try {
      await api.deleteFollowUp(id);
      setFollowUps((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir follow-up');
      throw err;
    }
  };

  useEffect(() => {
    if (token) {
      fetchFollowUps();
    } else {
      setFollowUps([]);
    }
  }, [token]);

  return {
    followUps,
    loading,
    error,
    refetch: fetchFollowUps,
    createFollowUp,
    updateFollowUp,
    deleteFollowUp,
  };
}
