import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_pages_rels" ADD COLUMN "rules_id" integer;
  ALTER TABLE "_guideline_pages_v_rels" ADD COLUMN "rules_id" integer;
  ALTER TABLE "guideline_pages_rels" ADD CONSTRAINT "guideline_pages_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_rels" ADD CONSTRAINT "_guideline_pages_v_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_pages_rels_rules_id_idx" ON "guideline_pages_rels" USING btree ("rules_id");
  CREATE INDEX "_guideline_pages_v_rels_rules_id_idx" ON "_guideline_pages_v_rels" USING btree ("rules_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_pages_rels" DROP CONSTRAINT "guideline_pages_rels_rules_fk";
  
  ALTER TABLE "_guideline_pages_v_rels" DROP CONSTRAINT "_guideline_pages_v_rels_rules_fk";
  
  DROP INDEX "guideline_pages_rels_rules_id_idx";
  DROP INDEX "_guideline_pages_v_rels_rules_id_idx";
  ALTER TABLE "guideline_pages_rels" DROP COLUMN "rules_id";
  ALTER TABLE "_guideline_pages_v_rels" DROP COLUMN "rules_id";`)
}
