import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_guideline_pages_fk";

  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_guideline_sections_fk";

  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_guideline_chapters_fk";

  DROP INDEX "search_rels_guideline_pages_id_idx";
  DROP INDEX "search_rels_guideline_sections_id_idx";
  DROP INDEX "search_rels_guideline_chapters_id_idx";
  ALTER TABLE "search_rels" ADD COLUMN "guideline_docs_id" integer;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_guideline_documents_fk" FOREIGN KEY ("guideline_docs_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_rels_guideline_docs_id_idx" ON "search_rels" USING btree ("guideline_docs_id");
  ALTER TABLE "search_rels" DROP COLUMN "guideline_pages_id";
  ALTER TABLE "search_rels" DROP COLUMN "guideline_sections_id";
  ALTER TABLE "search_rels" DROP COLUMN "guideline_chapters_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_guideline_documents_fk";

  DROP INDEX "search_rels_guideline_docs_id_idx";
  ALTER TABLE "search_rels" ADD COLUMN "guideline_pages_id" integer;
  ALTER TABLE "search_rels" ADD COLUMN "guideline_sections_id" integer;
  ALTER TABLE "search_rels" ADD COLUMN "guideline_chapters_id" integer;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_guideline_pages_fk" FOREIGN KEY ("guideline_pages_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_guideline_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_guideline_chapters_fk" FOREIGN KEY ("guideline_chapters_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_rels_guideline_pages_id_idx" ON "search_rels" USING btree ("guideline_pages_id");
  CREATE INDEX "search_rels_guideline_sections_id_idx" ON "search_rels" USING btree ("guideline_sections_id");
  CREATE INDEX "search_rels_guideline_chapters_id_idx" ON "search_rels" USING btree ("guideline_chapters_id");
  ALTER TABLE "search_rels" DROP COLUMN "guideline_docs_id";`)
}
