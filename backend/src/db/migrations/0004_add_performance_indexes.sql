CREATE INDEX IF NOT EXISTS "idx_messages_session_id_created_at" ON "messages" ("session_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lead_history_lead_id" ON "lead_history" ("lead_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lead_agent_id" ON "lead" ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lead_pessoa_id" ON "lead" ("pessoa_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lead_session_id" ON "lead" ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agents_empresa_id" ON "agents" ("empresa_id");
