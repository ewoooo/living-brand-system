import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lgw" DROP COLUMN "lock_margin";
  ALTER TABLE "lgw" DROP COLUMN "lock_gutter_x";
  ALTER TABLE "lgw" DROP COLUMN "lock_gutter_y";
  ALTER TABLE "_lgw_v" DROP COLUMN "lock_margin";
  ALTER TABLE "_lgw_v" DROP COLUMN "lock_gutter_x";
  ALTER TABLE "_lgw_v" DROP COLUMN "lock_gutter_y";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lgw" ADD COLUMN "lock_margin" boolean DEFAULT false;
  ALTER TABLE "lgw" ADD COLUMN "lock_gutter_x" boolean DEFAULT false;
  ALTER TABLE "lgw" ADD COLUMN "lock_gutter_y" boolean DEFAULT false;
  ALTER TABLE "_lgw_v" ADD COLUMN "lock_margin" boolean DEFAULT false;
  ALTER TABLE "_lgw_v" ADD COLUMN "lock_gutter_x" boolean DEFAULT false;
  ALTER TABLE "_lgw_v" ADD COLUMN "lock_gutter_y" boolean DEFAULT false;`)
}
