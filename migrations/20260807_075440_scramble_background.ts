import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" ADD COLUMN "background_id" integer;
  ALTER TABLE "_tsw_v" ADD COLUMN "background_id" integer;
  ALTER TABLE "tsw" ADD CONSTRAINT "tsw_background_id_brand_colors_id_fk" FOREIGN KEY ("background_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tsw_v" ADD CONSTRAINT "_tsw_v_background_id_brand_colors_id_fk" FOREIGN KEY ("background_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tsw_background_idx" ON "tsw" USING btree ("background_id");
  CREATE INDEX "_tsw_v_background_idx" ON "_tsw_v" USING btree ("background_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" DROP CONSTRAINT "tsw_background_id_brand_colors_id_fk";
  
  ALTER TABLE "_tsw_v" DROP CONSTRAINT "_tsw_v_background_id_brand_colors_id_fk";
  
  DROP INDEX "tsw_background_idx";
  DROP INDEX "_tsw_v_background_idx";
  ALTER TABLE "tsw" DROP COLUMN "background_id";
  ALTER TABLE "_tsw_v" DROP COLUMN "background_id";`)
}
