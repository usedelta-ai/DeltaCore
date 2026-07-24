CREATE INDEX IF NOT EXISTS idx_lead_agent_status_updated_id
  ON "lead" (agent_id, status, updated_at DESC, id DESC);
