import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "guideline_docs_slug_idx";
  CREATE INDEX "guideline_docs_slug_idx" ON "guideline_docs_locales" USING btree ("slug","_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "guideline_docs_slug_idx";
  CREATE UNIQUE INDEX "guideline_docs_slug_idx" ON "guideline_docs_locales" USING btree ("slug","_locale");`)
}
