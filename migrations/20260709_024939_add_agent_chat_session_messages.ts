import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_agent_chat_sessions_messages_role" AS ENUM('system', 'user', 'assistant');
  ALTER TYPE "public"."enum_agent_chat_sessions_reaction" RENAME TO "enum_agent_chat_sessions_messages_reaction";
  CREATE TABLE "agent_chat_sessions_messages_used_tools" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"call_count" numeric
  );
  
  CREATE TABLE "agent_chat_sessions_messages_used_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"call_count" numeric
  );
  
  CREATE TABLE "agent_chat_sessions_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"message_id" varchar NOT NULL,
  	"role" "enum_agent_chat_sessions_messages_role" NOT NULL,
  	"text" varchar,
  	"ai_usage_model" varchar,
  	"ai_usage_call_count" numeric,
  	"ai_usage_input_tokens" numeric,
  	"ai_usage_output_tokens" numeric,
  	"ai_usage_total_tokens" numeric,
  	"ai_usage_cache_read_input_tokens" numeric,
  	"ai_usage_cache_write_input_tokens" numeric,
  	"ai_usage_reasoning_tokens" numeric,
  	"ai_usage_raw_usage" jsonb,
  	"reaction" "enum_agent_chat_sessions_messages_reaction",
  	"reacted_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "agent_chat_sessions_messages_used_tools" ADD CONSTRAINT "agent_chat_sessions_messages_used_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agent_chat_sessions_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agent_chat_sessions_messages_used_skills" ADD CONSTRAINT "agent_chat_sessions_messages_used_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agent_chat_sessions_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agent_chat_sessions_messages" ADD CONSTRAINT "agent_chat_sessions_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agent_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "agent_chat_sessions_messages_used_tools_order_idx" ON "agent_chat_sessions_messages_used_tools" USING btree ("_order");
  CREATE INDEX "agent_chat_sessions_messages_used_tools_parent_id_idx" ON "agent_chat_sessions_messages_used_tools" USING btree ("_parent_id");
  CREATE INDEX "agent_chat_sessions_messages_used_skills_order_idx" ON "agent_chat_sessions_messages_used_skills" USING btree ("_order");
  CREATE INDEX "agent_chat_sessions_messages_used_skills_parent_id_idx" ON "agent_chat_sessions_messages_used_skills" USING btree ("_parent_id");
  CREATE INDEX "agent_chat_sessions_messages_order_idx" ON "agent_chat_sessions_messages" USING btree ("_order");
  CREATE INDEX "agent_chat_sessions_messages_parent_id_idx" ON "agent_chat_sessions_messages" USING btree ("_parent_id");
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "reaction";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "reacted_at";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_agent_chat_sessions_messages_reaction" RENAME TO "enum_agent_chat_sessions_reaction";
  DROP TABLE "agent_chat_sessions_messages_used_tools" CASCADE;
  DROP TABLE "agent_chat_sessions_messages_used_skills" CASCADE;
  DROP TABLE "agent_chat_sessions_messages" CASCADE;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "reaction" "enum_agent_chat_sessions_reaction";
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "reacted_at" timestamp(3) with time zone;
  DROP TYPE "public"."enum_agent_chat_sessions_messages_role";`)
}
