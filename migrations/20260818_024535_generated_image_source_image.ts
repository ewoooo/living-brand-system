import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "generated_images" ADD COLUMN "source_image_id" integer;
  ALTER TABLE "_generated_images_v" ADD COLUMN "version_source_image_id" integer;
  ALTER TABLE "generated_images" ADD CONSTRAINT "generated_images_source_image_id_generated_images_id_fk" FOREIGN KEY ("source_image_id") REFERENCES "public"."generated_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_generated_images_v" ADD CONSTRAINT "_generated_images_v_version_source_image_id_generated_images_id_fk" FOREIGN KEY ("version_source_image_id") REFERENCES "public"."generated_images"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "generated_images_source_image_idx" ON "generated_images" USING btree ("source_image_id");
  CREATE INDEX "_generated_images_v_version_version_source_image_idx" ON "_generated_images_v" USING btree ("version_source_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "generated_images" DROP CONSTRAINT "generated_images_source_image_id_generated_images_id_fk";
  
  ALTER TABLE "_generated_images_v" DROP CONSTRAINT "_generated_images_v_version_source_image_id_generated_images_id_fk";
  
  DROP INDEX "generated_images_source_image_idx";
  DROP INDEX "_generated_images_v_version_version_source_image_idx";
  ALTER TABLE "generated_images" DROP COLUMN "source_image_id";
  ALTER TABLE "_generated_images_v" DROP COLUMN "version_source_image_id";`)
}
