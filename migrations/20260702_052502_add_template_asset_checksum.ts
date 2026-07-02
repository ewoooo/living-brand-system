import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "template_assets" ADD COLUMN "checksum" varchar;
  CREATE INDEX "template_assets_checksum_idx" ON "template_assets" USING btree ("checksum");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   DROP INDEX "template_assets_checksum_idx";
  ALTER TABLE "template_assets" DROP COLUMN "checksum";`)
}
