import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" ADD COLUMN "padding_y" numeric DEFAULT 96;
  ALTER TABLE "_tsw_v" ADD COLUMN "padding_y" numeric DEFAULT 96;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" DROP COLUMN "padding_y";
  ALTER TABLE "_tsw_v" DROP COLUMN "padding_y";`)
}
