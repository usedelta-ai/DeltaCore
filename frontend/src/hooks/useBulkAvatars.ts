import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

const BATCH_DELAY = 600;
const BATCH_SIZE = 30;
const CACHE_TTL = 35 * 60 * 1000;

const pendingIds = new Set<number>();
const results = new Map<number, string | null>();
const expirations = new Map<number, number>();
let timer: ReturnType<typeof setTimeout> | null = null;
let resolvers: Array<() => void> = [];
let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

function isExpired(id: number): boolean {
  const expiresAt = expirations.get(id);
  return !expiresAt || Date.now() > expiresAt;
}

function cleanup() {
  const now = Date.now();
  for (const [id, expiresAt] of expirations) {
    if (now > expiresAt) {
      results.delete(id);
      expirations.delete(id);
    }
  }
  if (results.size > 0) {
    cleanupTimer = setTimeout(cleanup, CACHE_TTL);
  } else {
    cleanupTimer = null;
  }
}

async function flush() {
  if (pendingIds.size === 0) return;
  const ids = [...pendingIds];
  pendingIds.clear();
  const expiresAt = Date.now() + CACHE_TTL;
  try {
    const batch = await api.getBulkAvatars(ids);
    for (const [id, url] of Object.entries(batch)) {
      results.set(Number(id), url);
      expirations.set(Number(id), expiresAt);
    }
  } catch {
    for (const id of ids) {
      results.set(id, null);
      expirations.set(id, expiresAt);
    }
  }
  if (!cleanupTimer) {
    cleanupTimer = setTimeout(cleanup, CACHE_TTL);
  }
  resolvers.forEach(r => r());
  resolvers = [];
}

function scheduleFlush() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, BATCH_DELAY);
}

export function useBulkAvatars(leadIds: number[]): Map<number, string | null> {
  const [, setTick] = useState(0);
  const prevIdsRef = useRef('');

  useEffect(() => {
    const key = leadIds.sort((a, b) => a - b).join(',');
    if (key === prevIdsRef.current) return;
    prevIdsRef.current = key;

    const newIds = leadIds.filter(id => !results.has(id) || isExpired(id));

    if (newIds.length === 0) {
      setTick(t => t + 1);
      return;
    }

    for (const id of newIds) {
      pendingIds.add(id);
    }

    if (pendingIds.size >= BATCH_SIZE) {
      if (timer) clearTimeout(timer);
      timer = null;
      flush().then(() => setTick(t => t + 1));
    } else {
      scheduleFlush();
      const p = new Promise<void>(resolve => resolvers.push(resolve));
      p.then(() => setTick(t => t + 1));
    }
  }, [leadIds]);

  return results;
}
