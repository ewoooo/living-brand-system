import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "check_sessions" ADD COLUMN "agent_chat_session_id" integer;
  ALTER TABLE "check_sessions" ADD CONSTRAINT "check_sessions_agent_chat_session_id_agent_chat_sessions_id_fk" FOREIGN KEY ("agent_chat_session_id") REFERENCES "public"."agent_chat_sessions"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "check_sessions_agent_chat_session_idx" ON "check_sessions" USING btree ("agent_chat_session_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "check_sessions" DROP CONSTRAINT "check_sessions_agent_chat_session_id_agent_chat_sessions_id_fk";
  
  DROP INDEX "check_sessions_agent_chat_session_idx";
  ALTER TABLE "check_sessions" DROP COLUMN "agent_chat_session_id";`)
}
