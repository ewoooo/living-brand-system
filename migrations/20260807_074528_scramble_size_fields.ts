import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" ADD COLUMN "font_size" numeric DEFAULT 28;
  ALTER TABLE "tsw" ADD COLUMN "panel_height" numeric DEFAULT 320;
  ALTER TABLE "_tsw_v" ADD COLUMN "font_size" numeric DEFAULT 28;
  ALTER TABLE "_tsw_v" ADD COLUMN "panel_height" numeric DEFAULT 320;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" DROP COLUMN "font_size";
  ALTER TABLE "tsw" DROP COLUMN "panel_height";
  ALTER TABLE "_tsw_v" DROP COLUMN "font_size";
  ALTER TABLE "_tsw_v" DROP COLUMN "panel_height";`)
}
