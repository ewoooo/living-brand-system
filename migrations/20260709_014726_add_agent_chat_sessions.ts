import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_agent_chat_sessions_status" AS ENUM('running', 'completed', 'failed');
  CREATE TABLE "agent_chat_sessions_used_tools" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"call_count" numeric
  );
  
  CREATE TABLE "agent_chat_sessions_used_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"call_count" numeric
  );
  
  CREATE TABLE "agent_chat_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_agent_chat_sessions_status" DEFAULT 'running' NOT NULL,
  	"page_path" varchar,
  	"message_count" numeric,
  	"error_message" varchar,
  	"completed_at" timestamp(3) with time zone,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agent_chat_sessions_id" integer;
  ALTER TABLE "agent_chat_sessions_used_tools" ADD CONSTRAINT "agent_chat_sessions_used_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agent_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agent_chat_sessions_used_skills" ADD CONSTRAINT "agent_chat_sessions_used_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agent_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agent_chat_sessions" ADD CONSTRAINT "agent_chat_sessions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "agent_chat_sessions_used_tools_order_idx" ON "agent_chat_sessions_used_tools" USING btree ("_order");
  CREATE INDEX "agent_chat_sessions_used_tools_parent_id_idx" ON "agent_chat_sessions_used_tools" USING btree ("_parent_id");
  CREATE INDEX "agent_chat_sessions_used_skills_order_idx" ON "agent_chat_sessions_used_skills" USING btree ("_order");
  CREATE INDEX "agent_chat_sessions_used_skills_parent_id_idx" ON "agent_chat_sessions_used_skills" USING btree ("_parent_id");
  CREATE INDEX "agent_chat_sessions_created_by_idx" ON "agent_chat_sessions" USING btree ("created_by_id");
  CREATE INDEX "agent_chat_sessions_updated_at_idx" ON "agent_chat_sessions" USING btree ("updated_at");
  CREATE INDEX "agent_chat_sessions_created_at_idx" ON "agent_chat_sessions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_chat_sessions_fk" FOREIGN KEY ("agent_chat_sessions_id") REFERENCES "public"."agent_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_agent_chat_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("agent_chat_sessions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_agent_chat_sessions_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_agent_chat_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "agent_chat_sessions_id";
  ALTER TABLE "agent_chat_sessions_used_tools" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_chat_sessions_used_skills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_chat_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "agent_chat_sessions_used_tools" CASCADE;
  DROP TABLE "agent_chat_sessions_used_skills" CASCADE;
  DROP TABLE "agent_chat_sessions" CASCADE;
  DROP TYPE "public"."enum_agent_chat_sessions_status";`)
}
