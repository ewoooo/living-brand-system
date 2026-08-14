import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_image_profiles_output_allowed_formats" ADD VALUE 'jpeg';
  ALTER TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" ADD VALUE 'jpeg';
  ALTER TYPE "public"."enum_graphic_profiles_output_allowed_formats" ADD VALUE 'mp4';
  ALTER TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" ADD VALUE 'mp4';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_image_profiles_output_allowed_formats";
  CREATE TYPE "public"."enum_image_profiles_output_allowed_formats" AS ENUM('png');
  ALTER TABLE "image_profiles_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum_image_profiles_output_allowed_formats" USING "value"::"public"."enum_image_profiles_output_allowed_formats";
  ALTER TABLE "_image_profiles_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__image_profiles_v_version_output_allowed_formats";
  CREATE TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" AS ENUM('png');
  ALTER TABLE "_image_profiles_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" USING "value"::"public"."enum__image_profiles_v_version_output_allowed_formats";
  ALTER TABLE "graphic_profiles_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_graphic_profiles_output_allowed_formats";
  CREATE TYPE "public"."enum_graphic_profiles_output_allowed_formats" AS ENUM('svg');
  ALTER TABLE "graphic_profiles_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum_graphic_profiles_output_allowed_formats" USING "value"::"public"."enum_graphic_profiles_output_allowed_formats";
  ALTER TABLE "_graphic_profiles_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats";
  CREATE TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" AS ENUM('svg');
  ALTER TABLE "_graphic_profiles_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" USING "value"::"public"."enum__graphic_profiles_v_version_output_allowed_formats";`)
}
