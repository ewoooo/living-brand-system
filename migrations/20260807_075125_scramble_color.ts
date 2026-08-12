import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" ALTER COLUMN "font_size" SET DEFAULT 48;
  ALTER TABLE "tsw" ALTER COLUMN "panel_height" SET DEFAULT 360;
  ALTER TABLE "_tsw_v" ALTER COLUMN "font_size" SET DEFAULT 48;
  ALTER TABLE "_tsw_v" ALTER COLUMN "panel_height" SET DEFAULT 360;
  ALTER TABLE "tsw" ADD COLUMN "color_id" integer;
  ALTER TABLE "_tsw_v" ADD COLUMN "color_id" integer;
  ALTER TABLE "tsw" ADD CONSTRAINT "tsw_color_id_brand_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tsw_v" ADD CONSTRAINT "_tsw_v_color_id_brand_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tsw_color_idx" ON "tsw" USING btree ("color_id");
  CREATE INDEX "_tsw_v_color_idx" ON "_tsw_v" USING btree ("color_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" DROP CONSTRAINT "tsw_color_id_brand_colors_id_fk";
  
  ALTER TABLE "_tsw_v" DROP CONSTRAINT "_tsw_v_color_id_brand_colors_id_fk";
  
  DROP INDEX "tsw_color_idx";
  DROP INDEX "_tsw_v_color_idx";
  ALTER TABLE "tsw" ALTER COLUMN "font_size" SET DEFAULT 28;
  ALTER TABLE "tsw" ALTER COLUMN "panel_height" SET DEFAULT 320;
  ALTER TABLE "_tsw_v" ALTER COLUMN "font_size" SET DEFAULT 28;
  ALTER TABLE "_tsw_v" ALTER COLUMN "panel_height" SET DEFAULT 320;
  ALTER TABLE "tsw" DROP COLUMN "color_id";
  ALTER TABLE "_tsw_v" DROP COLUMN "color_id";`)
}
