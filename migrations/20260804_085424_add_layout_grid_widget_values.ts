import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lgw" ADD COLUMN "margin_pct" numeric;
  ALTER TABLE "lgw" ADD COLUMN "gutter_x" numeric;
  ALTER TABLE "lgw" ADD COLUMN "gutter_y" numeric;
  ALTER TABLE "_lgw_v" ADD COLUMN "margin_pct" numeric;
  ALTER TABLE "_lgw_v" ADD COLUMN "gutter_x" numeric;
  ALTER TABLE "_lgw_v" ADD COLUMN "gutter_y" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lgw" DROP COLUMN "margin_pct";
  ALTER TABLE "lgw" DROP COLUMN "gutter_x";
  ALTER TABLE "lgw" DROP COLUMN "gutter_y";
  ALTER TABLE "_lgw_v" DROP COLUMN "margin_pct";
  ALTER TABLE "_lgw_v" DROP COLUMN "gutter_x";
  ALTER TABLE "_lgw_v" DROP COLUMN "gutter_y";`)
}
