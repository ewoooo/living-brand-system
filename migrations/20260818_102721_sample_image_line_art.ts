import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sample_images" ADD COLUMN "line_art" boolean DEFAULT false;
  ALTER TABLE "_sample_images_v" ADD COLUMN "version_line_art" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sample_images" DROP COLUMN "line_art";
  ALTER TABLE "_sample_images_v" DROP COLUMN "version_line_art";`)
}
