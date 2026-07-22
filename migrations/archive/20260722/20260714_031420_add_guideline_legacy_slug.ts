import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_locales" ADD COLUMN "legacy_slug" varchar;
  ALTER TABLE "_guideline_docs_v_locales" ADD COLUMN "version_legacy_slug" varchar;
  CREATE INDEX "guideline_docs_legacy_slug_idx" ON "guideline_docs_locales" USING btree ("legacy_slug","_locale");
  CREATE INDEX "_guideline_docs_v_version_version_legacy_slug_idx" ON "_guideline_docs_v_locales" USING btree ("version_legacy_slug","_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "guideline_docs_legacy_slug_idx";
  DROP INDEX "_guideline_docs_v_version_version_legacy_slug_idx";
  ALTER TABLE "guideline_docs_locales" DROP COLUMN "legacy_slug";
  ALTER TABLE "_guideline_docs_v_locales" DROP COLUMN "version_legacy_slug";`)
}
