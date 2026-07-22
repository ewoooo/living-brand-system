import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "guideline_docs_legacy_collection_idx";
  DROP INDEX "guideline_docs_legacy_id_idx";
  DROP INDEX "guideline_docs_legacy_slug_idx";
  DROP INDEX "_guideline_docs_v_version_version_legacy_collection_idx";
  DROP INDEX "_guideline_docs_v_version_version_legacy_id_idx";
  DROP INDEX "_guideline_docs_v_version_version_legacy_slug_idx";
  ALTER TABLE "guideline_docs" DROP COLUMN "legacy_collection";
  ALTER TABLE "guideline_docs" DROP COLUMN "legacy_id";
  ALTER TABLE "guideline_docs_locales" DROP COLUMN "legacy_slug";
  ALTER TABLE "_guideline_docs_v" DROP COLUMN "version_legacy_collection";
  ALTER TABLE "_guideline_docs_v" DROP COLUMN "version_legacy_id";
  ALTER TABLE "_guideline_docs_v_locales" DROP COLUMN "version_legacy_slug";
  DROP TYPE "public"."enum_guideline_docs_legacy_collection";
  DROP TYPE "public"."enum__guideline_docs_v_version_legacy_collection";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_legacy_collection" AS ENUM('guideline-chapters', 'guideline-sections', 'guideline-pages');
  CREATE TYPE "public"."enum__guideline_docs_v_version_legacy_collection" AS ENUM('guideline-chapters', 'guideline-sections', 'guideline-pages');
  ALTER TABLE "guideline_docs" ADD COLUMN "legacy_collection" "enum_guideline_docs_legacy_collection";
  ALTER TABLE "guideline_docs" ADD COLUMN "legacy_id" numeric;
  ALTER TABLE "guideline_docs_locales" ADD COLUMN "legacy_slug" varchar;
  ALTER TABLE "_guideline_docs_v" ADD COLUMN "version_legacy_collection" "enum__guideline_docs_v_version_legacy_collection";
  ALTER TABLE "_guideline_docs_v" ADD COLUMN "version_legacy_id" numeric;
  ALTER TABLE "_guideline_docs_v_locales" ADD COLUMN "version_legacy_slug" varchar;
  CREATE INDEX "guideline_docs_legacy_collection_idx" ON "guideline_docs" USING btree ("legacy_collection");
  CREATE INDEX "guideline_docs_legacy_id_idx" ON "guideline_docs" USING btree ("legacy_id");
  CREATE INDEX "guideline_docs_legacy_slug_idx" ON "guideline_docs_locales" USING btree ("legacy_slug","_locale");
  CREATE INDEX "_guideline_docs_v_version_version_legacy_collection_idx" ON "_guideline_docs_v" USING btree ("version_legacy_collection");
  CREATE INDEX "_guideline_docs_v_version_version_legacy_id_idx" ON "_guideline_docs_v" USING btree ("version_legacy_id");
  CREATE INDEX "_guideline_docs_v_version_version_legacy_slug_idx" ON "_guideline_docs_v_locales" USING btree ("version_legacy_slug","_locale");`)
}
