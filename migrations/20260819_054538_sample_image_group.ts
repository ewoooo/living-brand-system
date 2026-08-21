import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sample_images" ADD COLUMN "group" varchar;
  ALTER TABLE "_sample_images_v" ADD COLUMN "version_group" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sample_images" DROP COLUMN "group";
  ALTER TABLE "_sample_images_v" DROP COLUMN "version_group";`)
}
