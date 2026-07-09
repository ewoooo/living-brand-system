import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "agent_chat_sessions" ADD COLUMN "ai_usage_model" varchar;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "ai_usage_call_count" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "ai_usage_input_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "ai_usage_output_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "ai_usage_total_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "ai_usage_cache_read_input_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "ai_usage_cache_write_input_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "ai_usage_reasoning_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "ai_usage_raw_usage" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "agent_chat_sessions" DROP COLUMN "ai_usage_model";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "ai_usage_call_count";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "ai_usage_input_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "ai_usage_output_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "ai_usage_total_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "ai_usage_cache_read_input_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "ai_usage_cache_write_input_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "ai_usage_reasoning_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "ai_usage_raw_usage";`)
}
