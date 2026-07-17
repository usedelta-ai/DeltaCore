import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

const THIRTY_MINUTES = 1000 * 60 * 30;

/**
 * TanStack Query hook for fetching a lead's profile picture from Evolution.
 * - staleTime: 30 minutes (won't re-fetch until data is older than 30 min)
 * - refetchInterval: 30 minutes (background refresh every 30 min)
 * - Falls back gracefully (null) if the Evolution API is unavailable or returns nothing
 */
export function useLeadAvatar(leadId: number | undefined, enabled: boolean = true) {
  return useQuery<string | null>({
    queryKey: ['lead-avatar', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      try {
        const res = await api.getLeadAvatar(leadId);
        return res.url ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!leadId && enabled,
    staleTime: THIRTY_MINUTES,
    refetchInterval: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES * 2,
    // Never throw — always degrade gracefully to null
    retry: false,
  });
}
