import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_agent_chat_sessions_triage_response_mode" AS ENUM('quick', 'lookup', 'research', 'action');
  CREATE TYPE "public"."enum_agent_chat_sessions_triage_risk" AS ENUM('low', 'high');
  CREATE TYPE "public"."enum_agent_chat_sessions_triage_execution_model" AS ENUM('sonnet-5', 'opus-5.0');
  CREATE TYPE "public"."enum_agent_chat_sessions_triage_tool_scope" AS ENUM('none', 'read', 'action');
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_skill_name" varchar;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_response_mode" "enum_agent_chat_sessions_triage_response_mode";
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_risk" "enum_agent_chat_sessions_triage_risk";
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_confidence" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_execution_model" "enum_agent_chat_sessions_triage_execution_model";
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_tool_scope" "enum_agent_chat_sessions_triage_tool_scope";
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_review_required" boolean;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_classifier_model" varchar;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_input_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_output_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_total_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_cache_read_input_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_cache_write_input_tokens" numeric;
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_reasoning_tokens" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_skill_name";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_response_mode";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_risk";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_confidence";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_execution_model";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_tool_scope";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_review_required";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_classifier_model";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_input_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_output_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_total_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_cache_read_input_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_cache_write_input_tokens";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_reasoning_tokens";
  DROP TYPE "public"."enum_agent_chat_sessions_triage_response_mode";
  DROP TYPE "public"."enum_agent_chat_sessions_triage_risk";
  DROP TYPE "public"."enum_agent_chat_sessions_triage_execution_model";
  DROP TYPE "public"."enum_agent_chat_sessions_triage_tool_scope";`)
}
