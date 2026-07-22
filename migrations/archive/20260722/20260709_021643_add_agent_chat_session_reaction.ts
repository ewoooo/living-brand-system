import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_agent_chat_sessions_reaction" AS ENUM('good', 'bad');
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "reaction" "enum_agent_chat_sessions_reaction";
  ALTER TABLE "agent_chat_sessions" ADD COLUMN "reacted_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "agent_chat_sessions" DROP COLUMN "reaction";
  ALTER TABLE "agent_chat_sessions" DROP COLUMN "reacted_at";
  DROP TYPE "public"."enum_agent_chat_sessions_reaction";`)
}
