-- Migração inicial idempotente: Cria as tabelas se não existirem e adiciona as constraints com segurança

CREATE TABLE IF NOT EXISTS "empresa" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo" "bytea",
	"active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'employee' NOT NULL,
	"empresa_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"prompt" text NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"instance_name" varchar(100) NOT NULL,
	"status" integer DEFAULT 1 NOT NULL,
	"empresa_id" integer NOT NULL,
	"upsert_lead" boolean DEFAULT true NOT NULL,
	"translations" jsonb,
	"search" boolean DEFAULT false NOT NULL,
	"search_data" jsonb,
	"validate" boolean DEFAULT false NOT NULL,
	"validate_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "follow_up_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer NOT NULL,
	"message" text NOT NULL,
	"time" integer NOT NULL,
	"agent_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "lead" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"remote_jid_alt" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"custom_properties" jsonb,
	"status" varchar(50) DEFAULT 'NOVO' NOT NULL,
	"taken_over_at" timestamp with time zone,
	"take_over_expires_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"taken_motive" text,
	"value" varchar(255),
	"lastmessage" text,
	"follow_up_id" integer,
	"session_id" varchar(255)
);

CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"source" varchar(50) NOT NULL,
	"remote_jid" varchar(255) NOT NULL,
	"message_type" varchar(50) NOT NULL,
	"message_id" varchar(255) NOT NULL,
	"quote_message_content" text,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "lead_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"user_id" integer,
	"agent_id" integer,
	"changed_by_agent" boolean DEFAULT false NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Adicionando Foreign Keys com verificação prévia (PL/pgSQL) para evitar erros em tabelas que já existem
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'agents_empresa_id_empresa_id_fk') THEN
		ALTER TABLE "agents" ADD CONSTRAINT "agents_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE set null ON UPDATE no action;
	END IF;
	
	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'follow_up_settings_agent_id_agents_id_fk') THEN
		ALTER TABLE "follow_up_settings" ADD CONSTRAINT "follow_up_settings_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lead_agent_id_agents_id_fk') THEN
		ALTER TABLE "lead" ADD CONSTRAINT "lead_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lead_follow_up_id_follow_up_settings_id_fk') THEN
		ALTER TABLE "lead" ADD CONSTRAINT "lead_follow_up_id_follow_up_settings_id_fk" FOREIGN KEY ("follow_up_id") REFERENCES "public"."follow_up_settings"("id") ON DELETE set null ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lead_history_lead_id_lead_id_fk') THEN
		ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lead_history_user_id_users_id_fk') THEN
		ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lead_history_agent_id_agents_id_fk') THEN
		ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_agent_id_agents_id_fk') THEN
		ALTER TABLE "messages" ADD CONSTRAINT "messages_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_empresa_id_empresa_id_fk') THEN
		ALTER TABLE "users" ADD CONSTRAINT "users_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;