import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles" ADD COLUMN "export_policy_print_allowed_ppi" jsonb;
  ALTER TABLE "image_profiles" ADD COLUMN "export_policy_video_allowed_fps" jsonb;
  ALTER TABLE "image_profiles" ADD COLUMN "export_policy_video_max_width" numeric;
  ALTER TABLE "image_profiles" ADD COLUMN "export_policy_video_max_height" numeric;
  ALTER TABLE "image_profiles" ADD COLUMN "export_policy_video_max_duration_seconds" numeric;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_export_policy_print_allowed_ppi" jsonb;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_export_policy_video_allowed_fps" jsonb;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_export_policy_video_max_width" numeric;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_export_policy_video_max_height" numeric;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_export_policy_video_max_duration_seconds" numeric;
  ALTER TABLE "graphic_profiles" ADD COLUMN "export_policy_print_allowed_ppi" jsonb;
  ALTER TABLE "graphic_profiles" ADD COLUMN "export_policy_video_allowed_fps" jsonb;
  ALTER TABLE "graphic_profiles" ADD COLUMN "export_policy_video_max_width" numeric;
  ALTER TABLE "graphic_profiles" ADD COLUMN "export_policy_video_max_height" numeric;
  ALTER TABLE "graphic_profiles" ADD COLUMN "export_policy_video_max_duration_seconds" numeric;
  ALTER TABLE "_graphic_profiles_v" ADD COLUMN "version_export_policy_print_allowed_ppi" jsonb;
  ALTER TABLE "_graphic_profiles_v" ADD COLUMN "version_export_policy_video_allowed_fps" jsonb;
  ALTER TABLE "_graphic_profiles_v" ADD COLUMN "version_export_policy_video_max_width" numeric;
  ALTER TABLE "_graphic_profiles_v" ADD COLUMN "version_export_policy_video_max_height" numeric;
  ALTER TABLE "_graphic_profiles_v" ADD COLUMN "version_export_policy_video_max_duration_seconds" numeric;
  ALTER TABLE "templates" ADD COLUMN "export_policy_print_allowed_ppi" jsonb;
  ALTER TABLE "templates" ADD COLUMN "export_policy_video_allowed_fps" jsonb;
  ALTER TABLE "templates" ADD COLUMN "export_policy_video_max_width" numeric;
  ALTER TABLE "templates" ADD COLUMN "export_policy_video_max_height" numeric;
  ALTER TABLE "templates" ADD COLUMN "export_policy_video_max_duration_seconds" numeric;
  ALTER TABLE "_templates_v" ADD COLUMN "version_export_policy_print_allowed_ppi" jsonb;
  ALTER TABLE "_templates_v" ADD COLUMN "version_export_policy_video_allowed_fps" jsonb;
  ALTER TABLE "_templates_v" ADD COLUMN "version_export_policy_video_max_width" numeric;
  ALTER TABLE "_templates_v" ADD COLUMN "version_export_policy_video_max_height" numeric;
  ALTER TABLE "_templates_v" ADD COLUMN "version_export_policy_video_max_duration_seconds" numeric;
  UPDATE "templates"
  SET "export_policy_print_allowed_ppi" = jsonb_build_array(("print_ppi"::text)::integer)
  WHERE "print_ppi" IS NOT NULL AND "export_policy_print_allowed_ppi" IS NULL;
  UPDATE "_templates_v"
  SET "version_export_policy_print_allowed_ppi" = jsonb_build_array(("version_print_ppi"::text)::integer)
  WHERE "version_print_ppi" IS NOT NULL AND "version_export_policy_print_allowed_ppi" IS NULL;
  ALTER TABLE "templates" DROP COLUMN "print_ppi";
  ALTER TABLE "_templates_v" DROP COLUMN "version_print_ppi";
  DROP TYPE "public"."enum_templates_print_ppi";
  DROP TYPE "public"."enum__templates_v_version_print_ppi";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_templates_print_ppi" AS ENUM('72', '150', '300');
  CREATE TYPE "public"."enum__templates_v_version_print_ppi" AS ENUM('72', '150', '300');
  ALTER TABLE "templates" ADD COLUMN "print_ppi" "enum_templates_print_ppi";
  ALTER TABLE "_templates_v" ADD COLUMN "version_print_ppi" "enum__templates_v_version_print_ppi";
  UPDATE "templates"
  SET "print_ppi" = ("export_policy_print_allowed_ppi"->>0)::"enum_templates_print_ppi"
  WHERE jsonb_typeof("export_policy_print_allowed_ppi") = 'array'
    AND jsonb_array_length("export_policy_print_allowed_ppi") > 0;
  UPDATE "_templates_v"
  SET "version_print_ppi" = ("version_export_policy_print_allowed_ppi"->>0)::"enum__templates_v_version_print_ppi"
  WHERE jsonb_typeof("version_export_policy_print_allowed_ppi") = 'array'
    AND jsonb_array_length("version_export_policy_print_allowed_ppi") > 0;
  ALTER TABLE "image_profiles" DROP COLUMN "export_policy_print_allowed_ppi";
  ALTER TABLE "image_profiles" DROP COLUMN "export_policy_video_allowed_fps";
  ALTER TABLE "image_profiles" DROP COLUMN "export_policy_video_max_width";
  ALTER TABLE "image_profiles" DROP COLUMN "export_policy_video_max_height";
  ALTER TABLE "image_profiles" DROP COLUMN "export_policy_video_max_duration_seconds";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_export_policy_print_allowed_ppi";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_export_policy_video_allowed_fps";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_export_policy_video_max_width";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_export_policy_video_max_height";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_export_policy_video_max_duration_seconds";
  ALTER TABLE "graphic_profiles" DROP COLUMN "export_policy_print_allowed_ppi";
  ALTER TABLE "graphic_profiles" DROP COLUMN "export_policy_video_allowed_fps";
  ALTER TABLE "graphic_profiles" DROP COLUMN "export_policy_video_max_width";
  ALTER TABLE "graphic_profiles" DROP COLUMN "export_policy_video_max_height";
  ALTER TABLE "graphic_profiles" DROP COLUMN "export_policy_video_max_duration_seconds";
  ALTER TABLE "_graphic_profiles_v" DROP COLUMN "version_export_policy_print_allowed_ppi";
  ALTER TABLE "_graphic_profiles_v" DROP COLUMN "version_export_policy_video_allowed_fps";
  ALTER TABLE "_graphic_profiles_v" DROP COLUMN "version_export_policy_video_max_width";
  ALTER TABLE "_graphic_profiles_v" DROP COLUMN "version_export_policy_video_max_height";
  ALTER TABLE "_graphic_profiles_v" DROP COLUMN "version_export_policy_video_max_duration_seconds";
  ALTER TABLE "templates" DROP COLUMN "export_policy_print_allowed_ppi";
  ALTER TABLE "templates" DROP COLUMN "export_policy_video_allowed_fps";
  ALTER TABLE "templates" DROP COLUMN "export_policy_video_max_width";
  ALTER TABLE "templates" DROP COLUMN "export_policy_video_max_height";
  ALTER TABLE "templates" DROP COLUMN "export_policy_video_max_duration_seconds";
  ALTER TABLE "_templates_v" DROP COLUMN "version_export_policy_print_allowed_ppi";
  ALTER TABLE "_templates_v" DROP COLUMN "version_export_policy_video_allowed_fps";
  ALTER TABLE "_templates_v" DROP COLUMN "version_export_policy_video_max_width";
  ALTER TABLE "_templates_v" DROP COLUMN "version_export_policy_video_max_height";
  ALTER TABLE "_templates_v" DROP COLUMN "version_export_policy_video_max_duration_seconds";`)
}
