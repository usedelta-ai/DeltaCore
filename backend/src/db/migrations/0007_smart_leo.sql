CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"ip_address" varchar(45),
	"device_info" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_activity_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"is_revoked" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);

ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_token" ON "user_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_agents_empresa_id" ON "agents" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "idx_lead_agent_id" ON "lead" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_lead_pessoa_id" ON "lead" USING btree ("pessoa_id");--> statement-breakpoint
CREATE INDEX "idx_lead_session_id" ON "lead" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_lead_status_updated_at" ON "lead" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "idx_lead_agent_id_status" ON "lead" USING btree ("agent_id","status");--> statement-breakpoint
CREATE INDEX "idx_lead_agent_status_updated_id" ON "lead" USING btree ("agent_id","status","updated_at","id");--> statement-breakpoint
CREATE INDEX "idx_lead_history_lead_id" ON "lead_history" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_messages_session_id_created_at" ON "messages" USING btree ("session_id","created_at");