import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles" ADD COLUMN "max_prompt_length" numeric;
  ALTER TABLE "image_profiles" ADD COLUMN "camera_control" boolean DEFAULT true;
  ALTER TABLE "image_profiles" ADD COLUMN "color_adjustment_line" varchar;
  ALTER TABLE "image_profiles" ADD COLUMN "color_adjustment_background" varchar;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_max_prompt_length" numeric;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_camera_control" boolean DEFAULT true;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_color_adjustment_line" varchar;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_color_adjustment_background" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles" DROP COLUMN "max_prompt_length";
  ALTER TABLE "image_profiles" DROP COLUMN "camera_control";
  ALTER TABLE "image_profiles" DROP COLUMN "color_adjustment_line";
  ALTER TABLE "image_profiles" DROP COLUMN "color_adjustment_background";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_max_prompt_length";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_camera_control";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_color_adjustment_line";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_color_adjustment_background";`)
}
