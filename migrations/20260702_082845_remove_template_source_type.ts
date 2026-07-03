import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "templates" DROP COLUMN "source_type";
  ALTER TABLE "_templates_v" DROP COLUMN "version_source_type";
  DROP TYPE "public"."enum_templates_source_type";
  DROP TYPE "public"."enum__templates_v_version_source_type";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   CREATE TYPE "public"."enum_templates_source_type" AS ENUM('figma', 'file');
  CREATE TYPE "public"."enum__templates_v_version_source_type" AS ENUM('figma', 'file');
  ALTER TABLE "templates" ADD COLUMN "source_type" "enum_templates_source_type";
  ALTER TABLE "_templates_v" ADD COLUMN "version_source_type" "enum__templates_v_version_source_type";`)
}
