import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_sections_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_chapters_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_chapters_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sections_fk";
  
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_guideline_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_guideline_chapters_fk" FOREIGN KEY ("guideline_chapters_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guideline_chapters_fk" FOREIGN KEY ("guideline_chapters_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guideline_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_guideline_sections_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_guideline_chapters_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guideline_chapters_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guideline_sections_fk";
  
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_chapters_fk" FOREIGN KEY ("guideline_chapters_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chapters_fk" FOREIGN KEY ("guideline_chapters_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;`)
}
