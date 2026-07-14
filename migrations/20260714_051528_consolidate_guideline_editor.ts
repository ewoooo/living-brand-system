import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_better_editor_settings_sidebar_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_better_editor_settings_hover_toolbar_position" AS ENUM('top-right', 'top-left', 'bottom-right', 'bottom-left');
  CREATE TABLE "better_editor_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "sidebar_position" "enum_better_editor_settings_sidebar_position" DEFAULT 'right',
    "force_full_width_fields" boolean DEFAULT true,
    "tablet_width" numeric DEFAULT 800,
    "mobile_width" numeric DEFAULT 400,
    "hover_color_top_level" varchar DEFAULT '#3b82f6',
    "hover_color_nested" varchar DEFAULT '#f59e0b',
    "hover_outline_width" numeric DEFAULT 2,
    "show_hover_toolbar" boolean DEFAULT true,
    "hover_toolbar_position" "enum_better_editor_settings_hover_toolbar_position" DEFAULT 'top-right',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  ALTER TABLE "guideline" ADD COLUMN "primary_color_id" integer;
  ALTER TABLE "guideline" ADD COLUMN "primary_color_dark_id" integer;
  ALTER TABLE "_guideline_v" ADD COLUMN "version_primary_color_id" integer;
  ALTER TABLE "_guideline_v" ADD COLUMN "version_primary_color_dark_id" integer;
  ALTER TABLE "guideline" ADD CONSTRAINT "guideline_primary_color_id_brand_colors_id_fk" FOREIGN KEY ("primary_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline" ADD CONSTRAINT "guideline_primary_color_dark_id_brand_colors_id_fk" FOREIGN KEY ("primary_color_dark_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_v" ADD CONSTRAINT "_guideline_v_version_primary_color_id_brand_colors_id_fk" FOREIGN KEY ("version_primary_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_v" ADD CONSTRAINT "_guideline_v_version_primary_color_dark_id_brand_colors_id_fk" FOREIGN KEY ("version_primary_color_dark_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "guideline_primary_color_idx" ON "guideline" USING btree ("primary_color_id");
  CREATE INDEX "guideline_primary_color_dark_idx" ON "guideline" USING btree ("primary_color_dark_id");
  CREATE INDEX "_guideline_v_version_version_primary_color_idx" ON "_guideline_v" USING btree ("version_primary_color_id");
  CREATE INDEX "_guideline_v_version_version_primary_color_dark_idx" ON "_guideline_v" USING btree ("version_primary_color_dark_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "better_editor_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "better_editor_settings" CASCADE;
  ALTER TABLE "guideline" DROP CONSTRAINT "guideline_primary_color_id_brand_colors_id_fk";

  ALTER TABLE "guideline" DROP CONSTRAINT "guideline_primary_color_dark_id_brand_colors_id_fk";

  ALTER TABLE "_guideline_v" DROP CONSTRAINT "_guideline_v_version_primary_color_id_brand_colors_id_fk";

  ALTER TABLE "_guideline_v" DROP CONSTRAINT "_guideline_v_version_primary_color_dark_id_brand_colors_id_fk";

  DROP INDEX "guideline_primary_color_idx";
  DROP INDEX "guideline_primary_color_dark_idx";
  DROP INDEX "_guideline_v_version_version_primary_color_idx";
  DROP INDEX "_guideline_v_version_version_primary_color_dark_idx";
  ALTER TABLE "guideline" DROP COLUMN "primary_color_id";
  ALTER TABLE "guideline" DROP COLUMN "primary_color_dark_id";
  ALTER TABLE "_guideline_v" DROP COLUMN "version_primary_color_id";
  ALTER TABLE "_guideline_v" DROP COLUMN "version_primary_color_dark_id";
  DROP TYPE "public"."enum_better_editor_settings_sidebar_position";
  DROP TYPE "public"."enum_better_editor_settings_hover_toolbar_position";`)
}
