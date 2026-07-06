import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		ALTER TYPE "public"."enum_check_sessions_source" ADD VALUE IF NOT EXISTS 'mcp-call';
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		UPDATE "check_sessions" SET "source" = 'review-page' WHERE "source" = 'mcp-call';
		ALTER TABLE "check_sessions" ALTER COLUMN "source" DROP DEFAULT;
		ALTER TYPE "public"."enum_check_sessions_source" RENAME TO "enum_check_sessions_source_old";
		CREATE TYPE "public"."enum_check_sessions_source" AS ENUM('review-page', 'chat');
		ALTER TABLE "check_sessions" ALTER COLUMN "source" TYPE "public"."enum_check_sessions_source" USING "source"::text::"public"."enum_check_sessions_source";
		ALTER TABLE "check_sessions" ALTER COLUMN "source" SET DEFAULT 'review-page';
		DROP TYPE "public"."enum_check_sessions_source_old";
	`)
}
