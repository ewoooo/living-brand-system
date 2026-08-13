import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_image_profiles_output_allowed_formats" ADD VALUE 'tiff';
  ALTER TYPE "public"."enum_image_profiles_output_allowed_formats" ADD VALUE 'pdf';
  ALTER TYPE "public"."enum_image_profiles_output_allowed_formats" ADD VALUE 'svg';
  ALTER TYPE "public"."enum_image_profiles_output_allowed_formats" ADD VALUE 'mp4';
  ALTER TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" ADD VALUE 'tiff';
  ALTER TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" ADD VALUE 'pdf';
  ALTER TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" ADD VALUE 'svg';
  ALTER TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" ADD VALUE 'mp4';
  ALTER TYPE "public"."enum_graphic_profiles_output_allowed_formats" ADD VALUE 'png' BEFORE 'svg';
  ALTER TYPE "public"."enum_graphic_profiles_output_allowed_formats" ADD VALUE 'jpeg' BEFORE 'svg';
  ALTER TYPE "public"."enum_graphic_profiles_output_allowed_formats" ADD VALUE 'tiff' BEFORE 'svg';
  ALTER TYPE "public"."enum_graphic_profiles_output_allowed_formats" ADD VALUE 'pdf' BEFORE 'svg';
  ALTER TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" ADD VALUE 'png' BEFORE 'svg';
  ALTER TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" ADD VALUE 'jpeg' BEFORE 'svg';
  ALTER TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" ADD VALUE 'tiff' BEFORE 'svg';
  ALTER TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" ADD VALUE 'pdf' BEFORE 'svg';
  ALTER TYPE "public"."enum_templates_output_allowed_formats" ADD VALUE 'jpeg' BEFORE 'tiff';
  ALTER TYPE "public"."enum_templates_output_allowed_formats" ADD VALUE 'svg';
  ALTER TYPE "public"."enum_templates_output_allowed_formats" ADD VALUE 'mp4';
  ALTER TYPE "public"."enum__templates_v_version_output_allowed_formats" ADD VALUE 'jpeg' BEFORE 'tiff';
  ALTER TYPE "public"."enum__templates_v_version_output_allowed_formats" ADD VALUE 'svg';
  ALTER TYPE "public"."enum__templates_v_version_output_allowed_formats" ADD VALUE 'mp4';
  ALTER TABLE "image_profiles_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "image_profiles_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "image_profiles_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "image_profiles_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "image_profiles_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "image_profiles_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "image_profiles_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "image_profiles_controller_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_image_profiles_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_image_profiles_v_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_image_profiles_v_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_image_profiles_v_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_image_profiles_v_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_image_profiles_v_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_image_profiles_v_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_image_profiles_v_version_controller_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_controller_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_version_controller_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_controller_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_version_controller_groups" DISABLE ROW LEVEL SECURITY;
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM "image_profiles_controller_groups")
      OR EXISTS (SELECT 1 FROM "_image_profiles_v_version_controller_groups")
      OR EXISTS (SELECT 1 FROM "graphic_profiles_controller_groups")
      OR EXISTS (SELECT 1 FROM "_graphic_profiles_v_version_controller_groups")
      OR EXISTS (SELECT 1 FROM "templates_controller_groups")
      OR EXISTS (SELECT 1 FROM "_templates_v_version_controller_groups") THEN
      RAISE EXCEPTION 'legacy full Controller 데이터는 controllerRestrictions로 수동 이관해야 합니다.';
    END IF;
  END $$;
  DROP TABLE "image_profiles_blocks_text" CASCADE;
  DROP TABLE "image_profiles_blocks_toggle" CASCADE;
  DROP TABLE "image_profiles_blocks_select_options" CASCADE;
  DROP TABLE "image_profiles_blocks_select" CASCADE;
  DROP TABLE "image_profiles_blocks_color" CASCADE;
  DROP TABLE "image_profiles_blocks_range" CASCADE;
  DROP TABLE "image_profiles_blocks_pad" CASCADE;
  DROP TABLE "image_profiles_controller_groups" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_text" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_toggle" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_select_options" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_select" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_color" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_range" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_pad" CASCADE;
  DROP TABLE "_image_profiles_v_version_controller_groups" CASCADE;
  DROP TABLE "graphic_profiles_blocks_text" CASCADE;
  DROP TABLE "graphic_profiles_blocks_toggle" CASCADE;
  DROP TABLE "graphic_profiles_blocks_select_options" CASCADE;
  DROP TABLE "graphic_profiles_blocks_select" CASCADE;
  DROP TABLE "graphic_profiles_blocks_color" CASCADE;
  DROP TABLE "graphic_profiles_blocks_range" CASCADE;
  DROP TABLE "graphic_profiles_blocks_pad" CASCADE;
  DROP TABLE "graphic_profiles_controller_groups" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_text" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_toggle" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_select_options" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_select" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_color" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_range" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_pad" CASCADE;
  DROP TABLE "_graphic_profiles_v_version_controller_groups" CASCADE;
  DROP TABLE "templates_blocks_text" CASCADE;
  DROP TABLE "templates_blocks_toggle" CASCADE;
  DROP TABLE "templates_blocks_select_options" CASCADE;
  DROP TABLE "templates_blocks_select" CASCADE;
  DROP TABLE "templates_blocks_color" CASCADE;
  DROP TABLE "templates_blocks_range" CASCADE;
  DROP TABLE "templates_blocks_pad" CASCADE;
  DROP TABLE "templates_controller_groups" CASCADE;
  DROP TABLE "_templates_v_blocks_text" CASCADE;
  DROP TABLE "_templates_v_blocks_toggle" CASCADE;
  DROP TABLE "_templates_v_blocks_select_options" CASCADE;
  DROP TABLE "_templates_v_blocks_select" CASCADE;
  DROP TABLE "_templates_v_blocks_color" CASCADE;
  DROP TABLE "_templates_v_blocks_range" CASCADE;
  DROP TABLE "_templates_v_blocks_pad" CASCADE;
  DROP TABLE "_templates_v_version_controller_groups" CASCADE;
  ALTER TABLE "graphic_profiles" RENAME COLUMN "controller_override" TO "controller_restrictions";
  ALTER TABLE "_graphic_profiles_v" RENAME COLUMN "version_controller_override" TO "version_controller_restrictions";
  ALTER TABLE "templates" RENAME COLUMN "controller_override" TO "controller_restrictions";
  ALTER TABLE "_templates_v" RENAME COLUMN "version_controller_override" TO "version_controller_restrictions";
  ALTER TABLE "image_profiles" ADD COLUMN "controller_restrictions" jsonb;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_controller_restrictions" jsonb;
  UPDATE "image_profiles" AS profile
  SET "controller_restrictions" = jsonb_build_object(
    'controls',
    (
      SELECT COALESCE(jsonb_agg(restriction), '[]'::jsonb)
      FROM (
        VALUES
          (CASE WHEN profile."aspect_ratio" IS NOT NULL THEN jsonb_build_object('controlId', 'ratio', 'defaultValue', profile."aspect_ratio") END),
          (CASE WHEN profile."image_size" IS NOT NULL THEN jsonb_build_object('controlId', 'resolution', 'defaultValue', profile."image_size") END),
          (CASE WHEN profile."max_prompt_length" IS NOT NULL THEN jsonb_build_object('controlId', 'prompt', 'maxLength', profile."max_prompt_length") END),
          (CASE WHEN COALESCE(
            profile."color_adjustment_line",
            (SELECT feature."line" FROM "image_profiles_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id" ORDER BY feature."_order" LIMIT 1)
          ) IS NOT NULL THEN jsonb_build_object(
            'controlId', 'lineColor',
            'defaultValue', COALESCE(
              profile."color_adjustment_line",
              (SELECT feature."line" FROM "image_profiles_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id" ORDER BY feature."_order" LIMIT 1)
            )
          ) END),
          (CASE WHEN COALESCE(
            profile."color_adjustment_background",
            (SELECT feature."background" FROM "image_profiles_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id" ORDER BY feature."_order" LIMIT 1)
          ) IS NOT NULL THEN jsonb_build_object(
            'controlId', 'backgroundColor',
            'defaultValue', COALESCE(
              profile."color_adjustment_background",
              (SELECT feature."background" FROM "image_profiles_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id" ORDER BY feature."_order" LIMIT 1)
            )
          ) END)
      ) AS restrictions(restriction)
      WHERE restriction IS NOT NULL
    )
  );
  UPDATE "_image_profiles_v" AS profile
  SET "version_controller_restrictions" = jsonb_build_object(
    'controls',
    (
      SELECT COALESCE(jsonb_agg(restriction), '[]'::jsonb)
      FROM (
        VALUES
          (CASE WHEN profile."version_aspect_ratio" IS NOT NULL THEN jsonb_build_object('controlId', 'ratio', 'defaultValue', profile."version_aspect_ratio") END),
          (CASE WHEN profile."version_image_size" IS NOT NULL THEN jsonb_build_object('controlId', 'resolution', 'defaultValue', profile."version_image_size") END),
          (CASE WHEN profile."version_max_prompt_length" IS NOT NULL THEN jsonb_build_object('controlId', 'prompt', 'maxLength', profile."version_max_prompt_length") END),
          (CASE WHEN COALESCE(
            profile."version_color_adjustment_line",
            (SELECT feature."line" FROM "_image_profiles_v_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id" ORDER BY feature."_order" LIMIT 1)
          ) IS NOT NULL THEN jsonb_build_object(
            'controlId', 'lineColor',
            'defaultValue', COALESCE(
              profile."version_color_adjustment_line",
              (SELECT feature."line" FROM "_image_profiles_v_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id" ORDER BY feature."_order" LIMIT 1)
            )
          ) END),
          (CASE WHEN COALESCE(
            profile."version_color_adjustment_background",
            (SELECT feature."background" FROM "_image_profiles_v_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id" ORDER BY feature."_order" LIMIT 1)
          ) IS NOT NULL THEN jsonb_build_object(
            'controlId', 'backgroundColor',
            'defaultValue', COALESCE(
              profile."version_color_adjustment_background",
              (SELECT feature."background" FROM "_image_profiles_v_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id" ORDER BY feature."_order" LIMIT 1)
            )
          ) END)
      ) AS restrictions(restriction)
      WHERE restriction IS NOT NULL
    )
  );
  INSERT INTO "image_profiles_blocks_camera_control" ("_order", "_parent_id", "_path", "id", "block_name")
  SELECT GREATEST(
      COALESCE((SELECT MAX(feature."_order") + 1 FROM "image_profiles_blocks_camera_control" AS feature WHERE feature."_parent_id" = profile."id"), 0),
      COALESCE((SELECT MAX(feature."_order") + 1 FROM "image_profiles_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id"), 0)
    ),
    profile."id", 'features', 'legacy-camera-' || profile."id", NULL
  FROM "image_profiles" AS profile
  WHERE profile."camera_control" IS TRUE
    AND NOT EXISTS (SELECT 1 FROM "image_profiles_blocks_camera_control" AS feature WHERE feature."_parent_id" = profile."id");
  INSERT INTO "_image_profiles_v_blocks_camera_control" ("_order", "_parent_id", "_path", "_uuid", "block_name")
  SELECT GREATEST(
      COALESCE((SELECT MAX(feature."_order") + 1 FROM "_image_profiles_v_blocks_camera_control" AS feature WHERE feature."_parent_id" = profile."id"), 0),
      COALESCE((SELECT MAX(feature."_order") + 1 FROM "_image_profiles_v_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id"), 0)
    ),
    profile."id", 'features', 'legacy-camera-' || profile."id", NULL
  FROM "_image_profiles_v" AS profile
  WHERE profile."version_camera_control" IS TRUE
    AND NOT EXISTS (SELECT 1 FROM "_image_profiles_v_blocks_camera_control" AS feature WHERE feature."_parent_id" = profile."id");
  INSERT INTO "image_profiles_blocks_color_adjustment" ("_order", "_parent_id", "_path", "id", "line", "background", "block_name")
  SELECT GREATEST(
      COALESCE((SELECT MAX(feature."_order") + 1 FROM "image_profiles_blocks_camera_control" AS feature WHERE feature."_parent_id" = profile."id"), 0),
      COALESCE((SELECT MAX(feature."_order") + 1 FROM "image_profiles_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id"), 0)
    ), profile."id", 'features', 'legacy-color-' || profile."id", profile."color_adjustment_line", profile."color_adjustment_background", NULL
  FROM "image_profiles" AS profile
  WHERE (profile."color_adjustment_line" IS NOT NULL OR profile."color_adjustment_background" IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM "image_profiles_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id");
  INSERT INTO "_image_profiles_v_blocks_color_adjustment" ("_order", "_parent_id", "_path", "_uuid", "line", "background", "block_name")
  SELECT GREATEST(
      COALESCE((SELECT MAX(feature."_order") + 1 FROM "_image_profiles_v_blocks_camera_control" AS feature WHERE feature."_parent_id" = profile."id"), 0),
      COALESCE((SELECT MAX(feature."_order") + 1 FROM "_image_profiles_v_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id"), 0)
    ), profile."id", 'features', 'legacy-color-' || profile."id", profile."version_color_adjustment_line", profile."version_color_adjustment_background", NULL
  FROM "_image_profiles_v" AS profile
  WHERE (profile."version_color_adjustment_line" IS NOT NULL OR profile."version_color_adjustment_background" IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM "_image_profiles_v_blocks_color_adjustment" AS feature WHERE feature."_parent_id" = profile."id");
  ALTER TABLE "image_profiles_blocks_color_adjustment" ALTER COLUMN "background" SET DATA TYPE boolean USING ("background" IS NOT NULL);
  ALTER TABLE "_image_profiles_v_blocks_color_adjustment" ALTER COLUMN "background" SET DATA TYPE boolean USING ("background" IS NOT NULL);
  ALTER TABLE "image_profiles_blocks_color_adjustment" DROP COLUMN "line";
  ALTER TABLE "image_profiles" DROP COLUMN "aspect_ratio";
  ALTER TABLE "image_profiles" DROP COLUMN "image_size";
  ALTER TABLE "image_profiles" DROP COLUMN "max_prompt_length";
  ALTER TABLE "image_profiles" DROP COLUMN "camera_control";
  ALTER TABLE "image_profiles" DROP COLUMN "color_adjustment_line";
  ALTER TABLE "image_profiles" DROP COLUMN "color_adjustment_background";
  ALTER TABLE "_image_profiles_v_blocks_color_adjustment" DROP COLUMN "line";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_aspect_ratio";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_image_size";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_max_prompt_length";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_camera_control";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_color_adjustment_line";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_color_adjustment_background";
  DROP TYPE "public"."enum_image_profiles_blocks_text_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_toggle_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_select_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_color_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_range_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_pad_availability";
  DROP TYPE "public"."enum_image_profiles_aspect_ratio";
  DROP TYPE "public"."enum_image_profiles_image_size";
  DROP TYPE "public"."enum__image_profiles_v_blocks_text_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_toggle_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_select_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_color_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_range_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_pad_availability";
  DROP TYPE "public"."enum__image_profiles_v_version_aspect_ratio";
  DROP TYPE "public"."enum__image_profiles_v_version_image_size";
  DROP TYPE "public"."enum_graphic_profiles_blocks_text_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_toggle_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_select_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_color_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_range_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_pad_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_text_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_toggle_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_select_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_color_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_range_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_pad_availability";
  DROP TYPE "public"."enum_templates_blocks_text_availability";
  DROP TYPE "public"."enum_templates_blocks_toggle_availability";
  DROP TYPE "public"."enum_templates_blocks_select_availability";
  DROP TYPE "public"."enum_templates_blocks_color_availability";
  DROP TYPE "public"."enum_templates_blocks_range_availability";
  DROP TYPE "public"."enum_templates_blocks_pad_availability";
  DROP TYPE "public"."enum__templates_v_blocks_text_availability";
  DROP TYPE "public"."enum__templates_v_blocks_toggle_availability";
  DROP TYPE "public"."enum__templates_v_blocks_select_availability";
  DROP TYPE "public"."enum__templates_v_blocks_color_availability";
  DROP TYPE "public"."enum__templates_v_blocks_range_availability";
  DROP TYPE "public"."enum__templates_v_blocks_pad_availability";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_image_profiles_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_aspect_ratio" AS ENUM('1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9');
  CREATE TYPE "public"."enum_image_profiles_image_size" AS ENUM('1K', '2K', '4K');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_version_aspect_ratio" AS ENUM('1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9');
  CREATE TYPE "public"."enum__image_profiles_v_version_image_size" AS ENUM('1K', '2K', '4K');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TABLE "image_profiles_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_image_profiles_blocks_text_availability" DEFAULT 'enabled',
	"default_value" varchar DEFAULT '',
	"multiline" boolean DEFAULT false,
	"max_length" numeric,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_image_profiles_blocks_toggle_availability" DEFAULT 'enabled',
	"default_value" boolean DEFAULT false,
	"block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar
  );

  CREATE TABLE "image_profiles_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_image_profiles_blocks_select_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_image_profiles_blocks_color_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_image_profiles_blocks_range_availability" DEFAULT 'enabled',
	"default_value" numeric DEFAULT 0,
	"min" numeric DEFAULT 0,
	"max" numeric DEFAULT 1,
	"step" numeric DEFAULT 0.01,
	"display_unit" varchar,
	"display_precision" numeric,
	"block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_image_profiles_blocks_pad_availability" DEFAULT 'enabled',
	"default_value_x" numeric DEFAULT 0,
	"default_value_y" numeric DEFAULT 0,
	"aspect_ratio" numeric,
	"block_name" varchar
  );

  CREATE TABLE "image_profiles_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean DEFAULT false,
	"default_open" boolean
  );

  CREATE TABLE "_image_profiles_v_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__image_profiles_v_blocks_text_availability" DEFAULT 'enabled',
	"default_value" varchar DEFAULT '',
	"multiline" boolean DEFAULT false,
	"max_length" numeric,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__image_profiles_v_blocks_toggle_availability" DEFAULT 'enabled',
	"default_value" boolean DEFAULT false,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__image_profiles_v_blocks_select_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__image_profiles_v_blocks_color_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__image_profiles_v_blocks_range_availability" DEFAULT 'enabled',
	"default_value" numeric DEFAULT 0,
	"min" numeric DEFAULT 0,
	"max" numeric DEFAULT 1,
	"step" numeric DEFAULT 0.01,
	"display_unit" varchar,
	"display_precision" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__image_profiles_v_blocks_pad_availability" DEFAULT 'enabled',
	"default_value_x" numeric DEFAULT 0,
	"default_value_y" numeric DEFAULT 0,
	"aspect_ratio" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_version_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean DEFAULT false,
	"default_open" boolean,
	"_uuid" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_text_availability",
	"default_value" varchar,
	"multiline" boolean,
	"max_length" numeric,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_toggle_availability",
	"default_value" boolean,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_select_availability",
	"default_value" varchar,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_color_availability",
	"default_value" varchar,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_range_availability",
	"default_value" numeric,
	"min" numeric,
	"max" numeric,
	"step" numeric,
	"display_unit" varchar,
	"display_precision" numeric,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_pad_availability",
	"default_value_x" numeric,
	"default_value_y" numeric,
	"aspect_ratio" numeric,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean,
	"default_open" boolean
  );

  CREATE TABLE "_graphic_profiles_v_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_text_availability",
	"default_value" varchar,
	"multiline" boolean,
	"max_length" numeric,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_toggle_availability",
	"default_value" boolean,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_select_availability",
	"default_value" varchar,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_color_availability",
	"default_value" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_range_availability",
	"default_value" numeric,
	"min" numeric,
	"max" numeric,
	"step" numeric,
	"display_unit" varchar,
	"display_precision" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_pad_availability",
	"default_value_x" numeric,
	"default_value_y" numeric,
	"aspect_ratio" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_version_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean,
	"default_open" boolean,
	"_uuid" varchar
  );

  CREATE TABLE "templates_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_text_availability",
	"default_value" varchar,
	"multiline" boolean,
	"max_length" numeric,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_toggle_availability",
	"default_value" boolean,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar
  );

  CREATE TABLE "templates_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_select_availability",
	"default_value" varchar,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_color_availability",
	"default_value" varchar,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_range_availability",
	"default_value" numeric,
	"min" numeric,
	"max" numeric,
	"step" numeric,
	"display_unit" varchar,
	"display_precision" numeric,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_pad_availability",
	"default_value_x" numeric,
	"default_value_y" numeric,
	"aspect_ratio" numeric,
	"block_name" varchar
  );

  CREATE TABLE "templates_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean,
	"default_open" boolean
  );

  CREATE TABLE "_templates_v_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_text_availability",
	"default_value" varchar,
	"multiline" boolean,
	"max_length" numeric,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_toggle_availability",
	"default_value" boolean,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_templates_v_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_select_availability",
	"default_value" varchar,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_color_availability",
	"default_value" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_range_availability",
	"default_value" numeric,
	"min" numeric,
	"max" numeric,
	"step" numeric,
	"display_unit" varchar,
	"display_precision" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_pad_availability",
	"default_value_x" numeric,
	"default_value_y" numeric,
	"aspect_ratio" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_version_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean,
	"default_open" boolean,
	"_uuid" varchar
  );

  ALTER TABLE "graphic_profiles" RENAME COLUMN "controller_restrictions" TO "controller_override";
  ALTER TABLE "_graphic_profiles_v" RENAME COLUMN "version_controller_restrictions" TO "version_controller_override";
  ALTER TABLE "templates" RENAME COLUMN "controller_restrictions" TO "controller_override";
  ALTER TABLE "_templates_v" RENAME COLUMN "version_controller_restrictions" TO "version_controller_override";
  ALTER TABLE "image_profiles_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_image_profiles_output_allowed_formats";
  CREATE TYPE "public"."enum_image_profiles_output_allowed_formats" AS ENUM('png', 'jpeg');
  ALTER TABLE "image_profiles_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum_image_profiles_output_allowed_formats" USING "value"::"public"."enum_image_profiles_output_allowed_formats";
  ALTER TABLE "_image_profiles_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__image_profiles_v_version_output_allowed_formats";
  CREATE TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" AS ENUM('png', 'jpeg');
  ALTER TABLE "_image_profiles_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" USING "value"::"public"."enum__image_profiles_v_version_output_allowed_formats";
  ALTER TABLE "graphic_profiles_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_graphic_profiles_output_allowed_formats";
  CREATE TYPE "public"."enum_graphic_profiles_output_allowed_formats" AS ENUM('svg', 'mp4');
  ALTER TABLE "graphic_profiles_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum_graphic_profiles_output_allowed_formats" USING "value"::"public"."enum_graphic_profiles_output_allowed_formats";
  ALTER TABLE "_graphic_profiles_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats";
  CREATE TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" AS ENUM('svg', 'mp4');
  ALTER TABLE "_graphic_profiles_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" USING "value"::"public"."enum__graphic_profiles_v_version_output_allowed_formats";
  ALTER TABLE "templates_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_templates_output_allowed_formats";
  CREATE TYPE "public"."enum_templates_output_allowed_formats" AS ENUM('png', 'tiff', 'pdf');
  ALTER TABLE "templates_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum_templates_output_allowed_formats" USING "value"::"public"."enum_templates_output_allowed_formats";
  ALTER TABLE "_templates_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__templates_v_version_output_allowed_formats";
  CREATE TYPE "public"."enum__templates_v_version_output_allowed_formats" AS ENUM('png', 'tiff', 'pdf');
  ALTER TABLE "_templates_v_version_output_allowed_formats" ALTER COLUMN "value" SET DATA TYPE "public"."enum__templates_v_version_output_allowed_formats" USING "value"::"public"."enum__templates_v_version_output_allowed_formats";
  ALTER TABLE "image_profiles_blocks_color_adjustment" ALTER COLUMN "background" SET DATA TYPE varchar USING (CASE WHEN "background" THEN 'enabled' ELSE NULL END);
  ALTER TABLE "image_profiles_blocks_color_adjustment" ALTER COLUMN "background" DROP DEFAULT;
  ALTER TABLE "_image_profiles_v_blocks_color_adjustment" ALTER COLUMN "background" SET DATA TYPE varchar USING (CASE WHEN "background" THEN 'enabled' ELSE NULL END);
  ALTER TABLE "_image_profiles_v_blocks_color_adjustment" ALTER COLUMN "background" DROP DEFAULT;
  ALTER TABLE "image_profiles_blocks_color_adjustment" ADD COLUMN "line" varchar;
  ALTER TABLE "image_profiles" ADD COLUMN "aspect_ratio" "enum_image_profiles_aspect_ratio" DEFAULT '2:3';
  ALTER TABLE "image_profiles" ADD COLUMN "image_size" "enum_image_profiles_image_size" DEFAULT '1K';
  ALTER TABLE "image_profiles" ADD COLUMN "max_prompt_length" numeric;
  ALTER TABLE "image_profiles" ADD COLUMN "camera_control" boolean DEFAULT true;
  ALTER TABLE "image_profiles" ADD COLUMN "color_adjustment_line" varchar;
  ALTER TABLE "image_profiles" ADD COLUMN "color_adjustment_background" varchar;
  ALTER TABLE "_image_profiles_v_blocks_color_adjustment" ADD COLUMN "line" varchar;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_aspect_ratio" "enum__image_profiles_v_version_aspect_ratio" DEFAULT '2:3';
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_image_size" "enum__image_profiles_v_version_image_size" DEFAULT '1K';
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_max_prompt_length" numeric;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_camera_control" boolean DEFAULT true;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_color_adjustment_line" varchar;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_color_adjustment_background" varchar;
  UPDATE "image_profiles" AS profile
  SET "aspect_ratio" = COALESCE(
      (SELECT (restriction->>'defaultValue')::"enum_image_profiles_aspect_ratio"
       FROM jsonb_array_elements(COALESCE(profile."controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
       WHERE restriction->>'controlId' = 'ratio' LIMIT 1),
      '2:3'::"enum_image_profiles_aspect_ratio"
    ),
    "image_size" = COALESCE(
      (SELECT (restriction->>'defaultValue')::"enum_image_profiles_image_size"
       FROM jsonb_array_elements(COALESCE(profile."controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
       WHERE restriction->>'controlId' = 'resolution' LIMIT 1),
      '1K'::"enum_image_profiles_image_size"
    ),
    "max_prompt_length" = (
      SELECT (restriction->>'maxLength')::numeric
      FROM jsonb_array_elements(COALESCE(profile."controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
      WHERE restriction->>'controlId' = 'prompt' LIMIT 1
    ),
    "camera_control" = EXISTS (
      SELECT 1 FROM "image_profiles_blocks_camera_control" AS feature WHERE feature."_parent_id" = profile."id"
    ),
    "color_adjustment_line" = (
      SELECT restriction->>'defaultValue'
      FROM jsonb_array_elements(COALESCE(profile."controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
      WHERE restriction->>'controlId' = 'lineColor' LIMIT 1
    ),
    "color_adjustment_background" = (
      SELECT restriction->>'defaultValue'
      FROM jsonb_array_elements(COALESCE(profile."controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
      WHERE restriction->>'controlId' = 'backgroundColor' LIMIT 1
    );
  UPDATE "_image_profiles_v" AS profile
  SET "version_aspect_ratio" = COALESCE(
      (SELECT (restriction->>'defaultValue')::"enum__image_profiles_v_version_aspect_ratio"
       FROM jsonb_array_elements(COALESCE(profile."version_controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
       WHERE restriction->>'controlId' = 'ratio' LIMIT 1),
      '2:3'::"enum__image_profiles_v_version_aspect_ratio"
    ),
    "version_image_size" = COALESCE(
      (SELECT (restriction->>'defaultValue')::"enum__image_profiles_v_version_image_size"
       FROM jsonb_array_elements(COALESCE(profile."version_controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
       WHERE restriction->>'controlId' = 'resolution' LIMIT 1),
      '1K'::"enum__image_profiles_v_version_image_size"
    ),
    "version_max_prompt_length" = (
      SELECT (restriction->>'maxLength')::numeric
      FROM jsonb_array_elements(COALESCE(profile."version_controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
      WHERE restriction->>'controlId' = 'prompt' LIMIT 1
    ),
    "version_camera_control" = EXISTS (
      SELECT 1 FROM "_image_profiles_v_blocks_camera_control" AS feature WHERE feature."_parent_id" = profile."id"
    ),
    "version_color_adjustment_line" = (
      SELECT restriction->>'defaultValue'
      FROM jsonb_array_elements(COALESCE(profile."version_controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
      WHERE restriction->>'controlId' = 'lineColor' LIMIT 1
    ),
    "version_color_adjustment_background" = (
      SELECT restriction->>'defaultValue'
      FROM jsonb_array_elements(COALESCE(profile."version_controller_restrictions"->'controls', '[]'::jsonb)) AS restriction
      WHERE restriction->>'controlId' = 'backgroundColor' LIMIT 1
    );
  UPDATE "image_profiles_blocks_color_adjustment" AS feature
  SET "line" = profile."color_adjustment_line",
    "background" = profile."color_adjustment_background"
  FROM "image_profiles" AS profile
  WHERE profile."id" = feature."_parent_id";
  UPDATE "_image_profiles_v_blocks_color_adjustment" AS feature
  SET "line" = profile."version_color_adjustment_line",
    "background" = profile."version_color_adjustment_background"
  FROM "_image_profiles_v" AS profile
  WHERE profile."id" = feature."_parent_id";
  ALTER TABLE "image_profiles_blocks_text" ADD CONSTRAINT "image_profiles_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_toggle" ADD CONSTRAINT "image_profiles_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_select_options" ADD CONSTRAINT "image_profiles_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_select" ADD CONSTRAINT "image_profiles_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_color" ADD CONSTRAINT "image_profiles_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_range" ADD CONSTRAINT "image_profiles_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_pad" ADD CONSTRAINT "image_profiles_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_controller_groups" ADD CONSTRAINT "image_profiles_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_text" ADD CONSTRAINT "_image_profiles_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_toggle" ADD CONSTRAINT "_image_profiles_v_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_select_options" ADD CONSTRAINT "_image_profiles_v_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_select" ADD CONSTRAINT "_image_profiles_v_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_color" ADD CONSTRAINT "_image_profiles_v_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_range" ADD CONSTRAINT "_image_profiles_v_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_pad" ADD CONSTRAINT "_image_profiles_v_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_version_controller_groups" ADD CONSTRAINT "_image_profiles_v_version_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_text" ADD CONSTRAINT "graphic_profiles_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_toggle" ADD CONSTRAINT "graphic_profiles_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_select_options" ADD CONSTRAINT "graphic_profiles_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_select" ADD CONSTRAINT "graphic_profiles_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_color" ADD CONSTRAINT "graphic_profiles_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_range" ADD CONSTRAINT "graphic_profiles_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_pad" ADD CONSTRAINT "graphic_profiles_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_controller_groups" ADD CONSTRAINT "graphic_profiles_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_text" ADD CONSTRAINT "_graphic_profiles_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_toggle" ADD CONSTRAINT "_graphic_profiles_v_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_select_options" ADD CONSTRAINT "_graphic_profiles_v_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_select" ADD CONSTRAINT "_graphic_profiles_v_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_color" ADD CONSTRAINT "_graphic_profiles_v_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_range" ADD CONSTRAINT "_graphic_profiles_v_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_pad" ADD CONSTRAINT "_graphic_profiles_v_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_version_controller_groups" ADD CONSTRAINT "_graphic_profiles_v_version_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_text" ADD CONSTRAINT "templates_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_toggle" ADD CONSTRAINT "templates_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_select_options" ADD CONSTRAINT "templates_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_select" ADD CONSTRAINT "templates_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_color" ADD CONSTRAINT "templates_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_range" ADD CONSTRAINT "templates_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_pad" ADD CONSTRAINT "templates_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_controller_groups" ADD CONSTRAINT "templates_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_text" ADD CONSTRAINT "_templates_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_toggle" ADD CONSTRAINT "_templates_v_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_select_options" ADD CONSTRAINT "_templates_v_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_select" ADD CONSTRAINT "_templates_v_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_color" ADD CONSTRAINT "_templates_v_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_range" ADD CONSTRAINT "_templates_v_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_pad" ADD CONSTRAINT "_templates_v_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_controller_groups" ADD CONSTRAINT "_templates_v_version_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "image_profiles_blocks_text_order_idx" ON "image_profiles_blocks_text" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_text_parent_id_idx" ON "image_profiles_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_text_path_idx" ON "image_profiles_blocks_text" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_toggle_order_idx" ON "image_profiles_blocks_toggle" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_toggle_parent_id_idx" ON "image_profiles_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_toggle_path_idx" ON "image_profiles_blocks_toggle" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_select_options_order_idx" ON "image_profiles_blocks_select_options" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_select_options_parent_id_idx" ON "image_profiles_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_select_order_idx" ON "image_profiles_blocks_select" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_select_parent_id_idx" ON "image_profiles_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_select_path_idx" ON "image_profiles_blocks_select" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_color_order_idx" ON "image_profiles_blocks_color" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_color_parent_id_idx" ON "image_profiles_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_color_path_idx" ON "image_profiles_blocks_color" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_range_order_idx" ON "image_profiles_blocks_range" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_range_parent_id_idx" ON "image_profiles_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_range_path_idx" ON "image_profiles_blocks_range" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_pad_order_idx" ON "image_profiles_blocks_pad" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_pad_parent_id_idx" ON "image_profiles_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_pad_path_idx" ON "image_profiles_blocks_pad" USING btree ("_path");
  CREATE INDEX "image_profiles_controller_groups_order_idx" ON "image_profiles_controller_groups" USING btree ("_order");
  CREATE INDEX "image_profiles_controller_groups_parent_id_idx" ON "image_profiles_controller_groups" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_text_order_idx" ON "_image_profiles_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_text_parent_id_idx" ON "_image_profiles_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_text_path_idx" ON "_image_profiles_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_toggle_order_idx" ON "_image_profiles_v_blocks_toggle" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_toggle_parent_id_idx" ON "_image_profiles_v_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_toggle_path_idx" ON "_image_profiles_v_blocks_toggle" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_select_options_order_idx" ON "_image_profiles_v_blocks_select_options" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_select_options_parent_id_idx" ON "_image_profiles_v_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_select_order_idx" ON "_image_profiles_v_blocks_select" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_select_parent_id_idx" ON "_image_profiles_v_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_select_path_idx" ON "_image_profiles_v_blocks_select" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_color_order_idx" ON "_image_profiles_v_blocks_color" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_color_parent_id_idx" ON "_image_profiles_v_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_color_path_idx" ON "_image_profiles_v_blocks_color" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_range_order_idx" ON "_image_profiles_v_blocks_range" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_range_parent_id_idx" ON "_image_profiles_v_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_range_path_idx" ON "_image_profiles_v_blocks_range" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_pad_order_idx" ON "_image_profiles_v_blocks_pad" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_pad_parent_id_idx" ON "_image_profiles_v_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_pad_path_idx" ON "_image_profiles_v_blocks_pad" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_version_controller_groups_order_idx" ON "_image_profiles_v_version_controller_groups" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_version_controller_groups_parent_id_idx" ON "_image_profiles_v_version_controller_groups" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_text_order_idx" ON "graphic_profiles_blocks_text" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_text_parent_id_idx" ON "graphic_profiles_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_text_path_idx" ON "graphic_profiles_blocks_text" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_toggle_order_idx" ON "graphic_profiles_blocks_toggle" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_toggle_parent_id_idx" ON "graphic_profiles_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_toggle_path_idx" ON "graphic_profiles_blocks_toggle" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_select_options_order_idx" ON "graphic_profiles_blocks_select_options" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_select_options_parent_id_idx" ON "graphic_profiles_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_select_order_idx" ON "graphic_profiles_blocks_select" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_select_parent_id_idx" ON "graphic_profiles_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_select_path_idx" ON "graphic_profiles_blocks_select" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_color_order_idx" ON "graphic_profiles_blocks_color" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_color_parent_id_idx" ON "graphic_profiles_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_color_path_idx" ON "graphic_profiles_blocks_color" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_range_order_idx" ON "graphic_profiles_blocks_range" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_range_parent_id_idx" ON "graphic_profiles_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_range_path_idx" ON "graphic_profiles_blocks_range" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_pad_order_idx" ON "graphic_profiles_blocks_pad" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_pad_parent_id_idx" ON "graphic_profiles_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_pad_path_idx" ON "graphic_profiles_blocks_pad" USING btree ("_path");
  CREATE INDEX "graphic_profiles_controller_groups_order_idx" ON "graphic_profiles_controller_groups" USING btree ("_order");
  CREATE INDEX "graphic_profiles_controller_groups_parent_id_idx" ON "graphic_profiles_controller_groups" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_text_order_idx" ON "_graphic_profiles_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_text_parent_id_idx" ON "_graphic_profiles_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_text_path_idx" ON "_graphic_profiles_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_toggle_order_idx" ON "_graphic_profiles_v_blocks_toggle" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_toggle_parent_id_idx" ON "_graphic_profiles_v_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_toggle_path_idx" ON "_graphic_profiles_v_blocks_toggle" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_select_options_order_idx" ON "_graphic_profiles_v_blocks_select_options" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_select_options_parent_id_idx" ON "_graphic_profiles_v_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_select_order_idx" ON "_graphic_profiles_v_blocks_select" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_select_parent_id_idx" ON "_graphic_profiles_v_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_select_path_idx" ON "_graphic_profiles_v_blocks_select" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_color_order_idx" ON "_graphic_profiles_v_blocks_color" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_color_parent_id_idx" ON "_graphic_profiles_v_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_color_path_idx" ON "_graphic_profiles_v_blocks_color" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_range_order_idx" ON "_graphic_profiles_v_blocks_range" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_range_parent_id_idx" ON "_graphic_profiles_v_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_range_path_idx" ON "_graphic_profiles_v_blocks_range" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_pad_order_idx" ON "_graphic_profiles_v_blocks_pad" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_pad_parent_id_idx" ON "_graphic_profiles_v_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_pad_path_idx" ON "_graphic_profiles_v_blocks_pad" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_version_controller_groups_order_idx" ON "_graphic_profiles_v_version_controller_groups" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_version_controller_groups_parent_id_idx" ON "_graphic_profiles_v_version_controller_groups" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_text_order_idx" ON "templates_blocks_text" USING btree ("_order");
  CREATE INDEX "templates_blocks_text_parent_id_idx" ON "templates_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_text_path_idx" ON "templates_blocks_text" USING btree ("_path");
  CREATE INDEX "templates_blocks_toggle_order_idx" ON "templates_blocks_toggle" USING btree ("_order");
  CREATE INDEX "templates_blocks_toggle_parent_id_idx" ON "templates_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_toggle_path_idx" ON "templates_blocks_toggle" USING btree ("_path");
  CREATE INDEX "templates_blocks_select_options_order_idx" ON "templates_blocks_select_options" USING btree ("_order");
  CREATE INDEX "templates_blocks_select_options_parent_id_idx" ON "templates_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_select_order_idx" ON "templates_blocks_select" USING btree ("_order");
  CREATE INDEX "templates_blocks_select_parent_id_idx" ON "templates_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_select_path_idx" ON "templates_blocks_select" USING btree ("_path");
  CREATE INDEX "templates_blocks_color_order_idx" ON "templates_blocks_color" USING btree ("_order");
  CREATE INDEX "templates_blocks_color_parent_id_idx" ON "templates_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_color_path_idx" ON "templates_blocks_color" USING btree ("_path");
  CREATE INDEX "templates_blocks_range_order_idx" ON "templates_blocks_range" USING btree ("_order");
  CREATE INDEX "templates_blocks_range_parent_id_idx" ON "templates_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_range_path_idx" ON "templates_blocks_range" USING btree ("_path");
  CREATE INDEX "templates_blocks_pad_order_idx" ON "templates_blocks_pad" USING btree ("_order");
  CREATE INDEX "templates_blocks_pad_parent_id_idx" ON "templates_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_pad_path_idx" ON "templates_blocks_pad" USING btree ("_path");
  CREATE INDEX "templates_controller_groups_order_idx" ON "templates_controller_groups" USING btree ("_order");
  CREATE INDEX "templates_controller_groups_parent_id_idx" ON "templates_controller_groups" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_text_order_idx" ON "_templates_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_text_parent_id_idx" ON "_templates_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_text_path_idx" ON "_templates_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_toggle_order_idx" ON "_templates_v_blocks_toggle" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_toggle_parent_id_idx" ON "_templates_v_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_toggle_path_idx" ON "_templates_v_blocks_toggle" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_select_options_order_idx" ON "_templates_v_blocks_select_options" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_select_options_parent_id_idx" ON "_templates_v_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_select_order_idx" ON "_templates_v_blocks_select" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_select_parent_id_idx" ON "_templates_v_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_select_path_idx" ON "_templates_v_blocks_select" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_color_order_idx" ON "_templates_v_blocks_color" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_color_parent_id_idx" ON "_templates_v_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_color_path_idx" ON "_templates_v_blocks_color" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_range_order_idx" ON "_templates_v_blocks_range" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_range_parent_id_idx" ON "_templates_v_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_range_path_idx" ON "_templates_v_blocks_range" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_pad_order_idx" ON "_templates_v_blocks_pad" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_pad_parent_id_idx" ON "_templates_v_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_pad_path_idx" ON "_templates_v_blocks_pad" USING btree ("_path");
  CREATE INDEX "_templates_v_version_controller_groups_order_idx" ON "_templates_v_version_controller_groups" USING btree ("_order");
  CREATE INDEX "_templates_v_version_controller_groups_parent_id_idx" ON "_templates_v_version_controller_groups" USING btree ("_parent_id");
  ALTER TABLE "image_profiles" DROP COLUMN "controller_restrictions";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_controller_restrictions";`)
}
