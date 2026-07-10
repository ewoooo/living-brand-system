import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_sections" ADD COLUMN "header_image_id" integer;
  ALTER TABLE "_guideline_sections_v" ADD COLUMN "version_header_image_id" integer;
  ALTER TABLE "guideline_sections" ADD CONSTRAINT "guideline_sections_header_image_id_application_images_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v" ADD CONSTRAINT "_guideline_sections_v_version_header_image_id_application_images_id_fk" FOREIGN KEY ("version_header_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "guideline_sections_header_image_idx" ON "guideline_sections" USING btree ("header_image_id");
  CREATE INDEX "_guideline_sections_v_version_version_header_image_idx" ON "_guideline_sections_v" USING btree ("version_header_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_sections" DROP CONSTRAINT "guideline_sections_header_image_id_application_images_id_fk";

  ALTER TABLE "_guideline_sections_v" DROP CONSTRAINT "_guideline_sections_v_version_header_image_id_application_images_id_fk";

  DROP INDEX "guideline_sections_header_image_idx";
  DROP INDEX "_guideline_sections_v_version_version_header_image_idx";
  ALTER TABLE "guideline_sections" DROP COLUMN "header_image_id";
  ALTER TABLE "_guideline_sections_v" DROP COLUMN "version_header_image_id";`)
}
