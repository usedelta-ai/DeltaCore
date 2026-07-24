CREATE TABLE "pessoa" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "pessoa_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "pessoa_id" integer;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "public"."pessoa"("id") ON DELETE set null ON UPDATE no action;