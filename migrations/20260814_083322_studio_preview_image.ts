import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles" ADD COLUMN "preview_image_id" integer;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_preview_image_id" integer;
  ALTER TABLE "graphic_profiles" ADD COLUMN "preview_image_id" integer;
  ALTER TABLE "_graphic_profiles_v" ADD COLUMN "version_preview_image_id" integer;
  ALTER TABLE "templates" ADD COLUMN "preview_image_id" integer;
  ALTER TABLE "_templates_v" ADD COLUMN "version_preview_image_id" integer;
  ALTER TABLE "image_profiles" ADD CONSTRAINT "image_profiles_preview_image_id_application_images_id_fk" FOREIGN KEY ("preview_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_image_profiles_v" ADD CONSTRAINT "_image_profiles_v_version_preview_image_id_application_images_id_fk" FOREIGN KEY ("version_preview_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "graphic_profiles" ADD CONSTRAINT "graphic_profiles_preview_image_id_application_images_id_fk" FOREIGN KEY ("preview_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v" ADD CONSTRAINT "_graphic_profiles_v_version_preview_image_id_application_images_id_fk" FOREIGN KEY ("version_preview_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "templates" ADD CONSTRAINT "templates_preview_image_id_application_images_id_fk" FOREIGN KEY ("preview_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_templates_v" ADD CONSTRAINT "_templates_v_version_preview_image_id_application_images_id_fk" FOREIGN KEY ("version_preview_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "image_profiles_preview_image_idx" ON "image_profiles" USING btree ("preview_image_id");
  CREATE INDEX "_image_profiles_v_version_version_preview_image_idx" ON "_image_profiles_v" USING btree ("version_preview_image_id");
  CREATE INDEX "graphic_profiles_preview_image_idx" ON "graphic_profiles" USING btree ("preview_image_id");
  CREATE INDEX "_graphic_profiles_v_version_version_preview_image_idx" ON "_graphic_profiles_v" USING btree ("version_preview_image_id");
  CREATE INDEX "templates_preview_image_idx" ON "templates" USING btree ("preview_image_id");
  CREATE INDEX "_templates_v_version_version_preview_image_idx" ON "_templates_v" USING btree ("version_preview_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles" DROP CONSTRAINT "image_profiles_preview_image_id_application_images_id_fk";
  
  ALTER TABLE "_image_profiles_v" DROP CONSTRAINT "_image_profiles_v_version_preview_image_id_application_images_id_fk";
  
  ALTER TABLE "graphic_profiles" DROP CONSTRAINT "graphic_profiles_preview_image_id_application_images_id_fk";
  
  ALTER TABLE "_graphic_profiles_v" DROP CONSTRAINT "_graphic_profiles_v_version_preview_image_id_application_images_id_fk";
  
  ALTER TABLE "templates" DROP CONSTRAINT "templates_preview_image_id_application_images_id_fk";
  
  ALTER TABLE "_templates_v" DROP CONSTRAINT "_templates_v_version_preview_image_id_application_images_id_fk";
  
  DROP INDEX "image_profiles_preview_image_idx";
  DROP INDEX "_image_profiles_v_version_version_preview_image_idx";
  DROP INDEX "graphic_profiles_preview_image_idx";
  DROP INDEX "_graphic_profiles_v_version_version_preview_image_idx";
  DROP INDEX "templates_preview_image_idx";
  DROP INDEX "_templates_v_version_version_preview_image_idx";
  ALTER TABLE "image_profiles" DROP COLUMN "preview_image_id";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_preview_image_id";
  ALTER TABLE "graphic_profiles" DROP COLUMN "preview_image_id";
  ALTER TABLE "_graphic_profiles_v" DROP COLUMN "version_preview_image_id";
  ALTER TABLE "templates" DROP COLUMN "preview_image_id";
  ALTER TABLE "_templates_v" DROP COLUMN "version_preview_image_id";`)
}
