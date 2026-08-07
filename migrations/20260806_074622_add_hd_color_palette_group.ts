import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hcp" ADD COLUMN "group_id" integer;
  ALTER TABLE "_hcp_v" ADD COLUMN "group_id" integer;
  ALTER TABLE "hcp" ADD CONSTRAINT "hcp_group_id_brand_color_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hcp_v" ADD CONSTRAINT "_hcp_v_group_id_brand_color_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hcp_group_idx" ON "hcp" USING btree ("group_id");
  CREATE INDEX "_hcp_v_group_idx" ON "_hcp_v" USING btree ("group_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hcp" DROP CONSTRAINT "hcp_group_id_brand_color_groups_id_fk";
  
  ALTER TABLE "_hcp_v" DROP CONSTRAINT "_hcp_v_group_id_brand_color_groups_id_fk";
  
  DROP INDEX "hcp_group_idx";
  DROP INDEX "_hcp_v_group_idx";
  ALTER TABLE "hcp" DROP COLUMN "group_id";
  ALTER TABLE "_hcp_v" DROP COLUMN "group_id";`)
}
