import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Empresa } from '../services/api';

export function useEmpresas(token: string | null) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEmpresas();
      setEmpresas(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar empresas');
    } finally {
      setLoading(false);
    }
  };

  const createEmpresa = async (name: string, logo: string | null) => {
    setError(null);
    try {
      const newEmp = await api.createEmpresa({ name, logo });
      setEmpresas((prev) => [newEmp, ...prev]);
      return newEmp;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar empresa');
      throw err;
    }
  };

  const updateEmpresa = async (id: number, name: string, logo?: string | null) => {
    setError(null);
    try {
      const updated = await api.updateEmpresa(id, { name, logo });
      setEmpresas((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar empresa');
      throw err;
    }
  };

  const deleteEmpresa = async (id: number) => {
    setError(null);
    try {
      await api.deleteEmpresa(id);
      setEmpresas((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir empresa');
      throw err;
    }
  };

  useEffect(() => {
    if (token) {
      fetchEmpresas();
    } else {
      setEmpresas([]);
    }
  }, [token]);

  return {
    empresas,
    loading,
    error,
    refetch: fetchEmpresas,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
  };
}
