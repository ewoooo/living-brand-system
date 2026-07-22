import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Snapshot-healing + three-column migration.
// The latest snapshot (20260716_013525_guideline_search_recall.json) lost the
// existing check_sessions.pending_check_keys column during a parallel branch
// merge. That column was already applied by 20260715_131314, so the generated
// duplicate ADD/DROP statements were removed. The sidecar snapshot restores the
// full current schema and becomes the next correct diff baseline.
// ponytail: hand-trimmed generated SQL; the .json snapshot carries the healing.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_check_sessions_input_media_type" AS ENUM('image/jpeg', 'image/png', 'image/webp');
  ALTER TABLE "check_sessions" ADD COLUMN "input_sha256" varchar;
  ALTER TABLE "check_sessions" ADD COLUMN "input_media_type" "enum_check_sessions_input_media_type";
  ALTER TABLE "check_sessions" ADD COLUMN "input_byte_length" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "check_sessions" DROP COLUMN "input_sha256";
  ALTER TABLE "check_sessions" DROP COLUMN "input_media_type";
  ALTER TABLE "check_sessions" DROP COLUMN "input_byte_length";
  DROP TYPE "public"."enum_check_sessions_input_media_type";`)
}
