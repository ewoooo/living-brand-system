import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hcp" DROP CONSTRAINT "hcp_group_id_brand_color_groups_id_fk";
  
  ALTER TABLE "_hcp_v" DROP CONSTRAINT "_hcp_v_group_id_brand_color_groups_id_fk";
  
  DROP INDEX "hcp_group_idx";
  DROP INDEX "_hcp_v_group_idx";
  ALTER TABLE "guideline_docs_rels" ADD COLUMN "brand_color_groups_id" integer;
  ALTER TABLE "_guideline_docs_v_rels" ADD COLUMN "brand_color_groups_id" integer;
  ALTER TABLE "guideline_docs_rels" ADD CONSTRAINT "guideline_docs_rels_brand_color_groups_fk" FOREIGN KEY ("brand_color_groups_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_rels" ADD CONSTRAINT "_guideline_docs_v_rels_brand_color_groups_fk" FOREIGN KEY ("brand_color_groups_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_rels_brand_color_groups_id_idx" ON "guideline_docs_rels" USING btree ("brand_color_groups_id");
  CREATE INDEX "_guideline_docs_v_rels_brand_color_groups_id_idx" ON "_guideline_docs_v_rels" USING btree ("brand_color_groups_id");
  ALTER TABLE "hcp" DROP COLUMN "group_id";
  ALTER TABLE "_hcp_v" DROP COLUMN "group_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_rels" DROP CONSTRAINT "guideline_docs_rels_brand_color_groups_fk";
  
  ALTER TABLE "_guideline_docs_v_rels" DROP CONSTRAINT "_guideline_docs_v_rels_brand_color_groups_fk";
  
  DROP INDEX "guideline_docs_rels_brand_color_groups_id_idx";
  DROP INDEX "_guideline_docs_v_rels_brand_color_groups_id_idx";
  ALTER TABLE "hcp" ADD COLUMN "group_id" integer;
  ALTER TABLE "_hcp_v" ADD COLUMN "group_id" integer;
  ALTER TABLE "hcp" ADD CONSTRAINT "hcp_group_id_brand_color_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hcp_v" ADD CONSTRAINT "_hcp_v_group_id_brand_color_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hcp_group_idx" ON "hcp" USING btree ("group_id");
  CREATE INDEX "_hcp_v_group_idx" ON "_hcp_v" USING btree ("group_id");
  ALTER TABLE "guideline_docs_rels" DROP COLUMN "brand_color_groups_id";
  ALTER TABLE "_guideline_docs_v_rels" DROP COLUMN "brand_color_groups_id";`)
}
