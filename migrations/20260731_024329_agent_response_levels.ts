import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_agent_chat_sessions_triage_response_level" AS ENUM('fast', 'standard', 'deep');
  CREATE TYPE "public"."enum_agent_chat_sessions_triage_task_type" AS ENUM('answer', 'lookup', 'action');
  ALTER TYPE "public"."enum_agent_chat_sessions_triage_execution_model" ADD VALUE 'haiku-4.5' BEFORE 'sonnet-5';
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_response_level" "enum_agent_chat_sessions_triage_response_level";
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_task_type" "enum_agent_chat_sessions_triage_task_type";
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_clarification_required" boolean;
  UPDATE "agent_chat_sessions"
  SET
    "triage_response_level" = (
      CASE "triage_response_mode"::text
        WHEN 'quick' THEN 'fast'
        WHEN 'lookup' THEN 'standard'
        ELSE 'deep'
      END
    )::"public"."enum_agent_chat_sessions_triage_response_level",
    "triage_task_type" = (
      CASE "triage_response_mode"::text
        WHEN 'quick' THEN 'answer'
        WHEN 'action' THEN 'action'
        ELSE 'lookup'
      END
    )::"public"."enum_agent_chat_sessions_triage_task_type",
    "triage_clarification_required" = false
  WHERE "triage_response_mode" IS NOT NULL;
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_response_mode";
  DROP TYPE "public"."enum_agent_chat_sessions_triage_response_mode";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_agent_chat_sessions_triage_response_mode" AS ENUM('quick', 'lookup', 'research', 'action');
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "triage_response_mode" "enum_agent_chat_sessions_triage_response_mode";
  UPDATE "agent_chat_sessions"
  SET "triage_response_mode" = (
    CASE
      WHEN "triage_task_type"::text = 'action' THEN 'action'
      WHEN "triage_task_type"::text = 'lookup' AND "triage_response_level"::text = 'deep' THEN 'research'
      WHEN "triage_task_type"::text = 'lookup' THEN 'lookup'
      ELSE 'quick'
    END
  )::"public"."enum_agent_chat_sessions_triage_response_mode"
  WHERE "triage_response_level" IS NOT NULL;
  UPDATE "agent_chat_sessions"
  SET "triage_execution_model" = 'sonnet-5'
  WHERE "triage_execution_model"::text = 'haiku-4.5';
  ALTER TABLE "agent_chat_sessions" ALTER COLUMN "triage_execution_model" SET DATA TYPE text;
  DROP TYPE "public"."enum_agent_chat_sessions_triage_execution_model";
  CREATE TYPE "public"."enum_agent_chat_sessions_triage_execution_model" AS ENUM('sonnet-5', 'opus-5.0');
  ALTER TABLE "agent_chat_sessions" ALTER COLUMN "triage_execution_model" SET DATA TYPE "public"."enum_agent_chat_sessions_triage_execution_model" USING "triage_execution_model"::"public"."enum_agent_chat_sessions_triage_execution_model";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_response_level";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_task_type";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "triage_clarification_required";
  DROP TYPE "public"."enum_agent_chat_sessions_triage_response_level";
  DROP TYPE "public"."enum_agent_chat_sessions_triage_task_type";`)
}
