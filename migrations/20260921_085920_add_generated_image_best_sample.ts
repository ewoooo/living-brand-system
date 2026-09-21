import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "generated_images" ADD COLUMN "best_sample" boolean DEFAULT false;
  ALTER TABLE "_generated_images_v" ADD COLUMN "version_best_sample" boolean DEFAULT false;
  CREATE INDEX "generated_images_best_sample_idx" ON "generated_images" USING btree ("best_sample");
  CREATE INDEX "_generated_images_v_version_version_best_sample_idx" ON "_generated_images_v" USING btree ("version_best_sample");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "generated_images_best_sample_idx";
  DROP INDEX "_generated_images_v_version_version_best_sample_idx";
  ALTER TABLE "generated_images" DROP COLUMN "best_sample";
  ALTER TABLE "_generated_images_v" DROP COLUMN "version_best_sample";`)
}
