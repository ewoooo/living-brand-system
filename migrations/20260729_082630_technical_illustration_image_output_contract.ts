import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_image_profiles_image_model_preset" AS ENUM('openai-gpt-image-2', 'google-nano-banana-2-lite');
  CREATE TYPE "public"."enum_image_profiles_aspect_ratio" AS ENUM('1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9');
  CREATE TYPE "public"."enum_image_profiles_image_size" AS ENUM('1K', '2K', '4K');
  CREATE TYPE "public"."enum__image_profiles_v_version_image_model_preset" AS ENUM('openai-gpt-image-2', 'google-nano-banana-2-lite');
  CREATE TYPE "public"."enum__image_profiles_v_version_aspect_ratio" AS ENUM('1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9');
  CREATE TYPE "public"."enum__image_profiles_v_version_image_size" AS ENUM('1K', '2K', '4K');
  ALTER TABLE "image_profiles" ADD COLUMN "image_model_preset" "enum_image_profiles_image_model_preset" DEFAULT 'openai-gpt-image-2';
  ALTER TABLE "image_profiles" ADD COLUMN "aspect_ratio" "enum_image_profiles_aspect_ratio" DEFAULT '2:3';
  ALTER TABLE "image_profiles" ADD COLUMN "image_size" "enum_image_profiles_image_size" DEFAULT '1K';
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_image_model_preset" "enum__image_profiles_v_version_image_model_preset" DEFAULT 'openai-gpt-image-2';
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_aspect_ratio" "enum__image_profiles_v_version_aspect_ratio" DEFAULT '2:3';
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_image_size" "enum__image_profiles_v_version_image_size" DEFAULT '1K';
  UPDATE "image_profiles"
  SET "aspect_ratio" = (
    CASE "output_size_preset"::text
      WHEN 'square' THEN '1:1'
      WHEN 'landscape' THEN '3:2'
      ELSE '2:3'
    END
  )::"public"."enum_image_profiles_aspect_ratio";
  UPDATE "_image_profiles_v"
  SET "version_aspect_ratio" = (
    CASE "version_output_size_preset"::text
      WHEN 'square' THEN '1:1'
      WHEN 'landscape' THEN '3:2'
      ELSE '2:3'
    END
  )::"public"."enum__image_profiles_v_version_aspect_ratio";
  ALTER TABLE "image_profiles" DROP COLUMN "output_size_preset";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_output_size_preset";
  DROP TYPE "public"."enum_image_profiles_output_size_preset";
  DROP TYPE "public"."enum__image_profiles_v_version_output_size_preset";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_image_profiles_output_size_preset" AS ENUM('square', 'landscape', 'portrait');
  CREATE TYPE "public"."enum__image_profiles_v_version_output_size_preset" AS ENUM('square', 'landscape', 'portrait');
  ALTER TABLE "image_profiles" ADD COLUMN "output_size_preset" "enum_image_profiles_output_size_preset" DEFAULT 'portrait';
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_output_size_preset" "enum__image_profiles_v_version_output_size_preset" DEFAULT 'portrait';
  UPDATE "image_profiles"
  SET "output_size_preset" = (
    CASE "aspect_ratio"::text
      WHEN '1:1' THEN 'square'
      WHEN '2:3' THEN 'portrait'
      ELSE 'landscape'
    END
  )::"public"."enum_image_profiles_output_size_preset";
  UPDATE "_image_profiles_v"
  SET "version_output_size_preset" = (
    CASE "version_aspect_ratio"::text
      WHEN '1:1' THEN 'square'
      WHEN '2:3' THEN 'portrait'
      ELSE 'landscape'
    END
  )::"public"."enum__image_profiles_v_version_output_size_preset";
  ALTER TABLE "image_profiles" DROP COLUMN "image_model_preset";
  ALTER TABLE "image_profiles" DROP COLUMN "aspect_ratio";
  ALTER TABLE "image_profiles" DROP COLUMN "image_size";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_image_model_preset";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_aspect_ratio";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_image_size";
  DROP TYPE "public"."enum_image_profiles_image_model_preset";
  DROP TYPE "public"."enum_image_profiles_aspect_ratio";
  DROP TYPE "public"."enum_image_profiles_image_size";
  DROP TYPE "public"."enum__image_profiles_v_version_image_model_preset";
  DROP TYPE "public"."enum__image_profiles_v_version_aspect_ratio";
  DROP TYPE "public"."enum__image_profiles_v_version_image_size";`)
}
