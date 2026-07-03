import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_brand_colors_color_group" AS ENUM('red', 'yellow', 'green', 'blue', 'purple', 'gray', 'neutral');
  CREATE TYPE "public"."enum__brand_colors_v_version_color_group" AS ENUM('red', 'yellow', 'green', 'blue', 'purple', 'gray', 'neutral');
  ALTER TABLE "brand_colors" ADD COLUMN "pantone" varchar;
  ALTER TABLE "brand_colors" ADD COLUMN "color_group" "enum_brand_colors_color_group";
  ALTER TABLE "brand_colors" ADD COLUMN "tone" numeric;
  ALTER TABLE "brand_colors" ADD COLUMN "is_main" boolean DEFAULT false;
  ALTER TABLE "_brand_colors_v" ADD COLUMN "version_pantone" varchar;
  ALTER TABLE "_brand_colors_v" ADD COLUMN "version_color_group" "enum__brand_colors_v_version_color_group";
  ALTER TABLE "_brand_colors_v" ADD COLUMN "version_tone" numeric;
  ALTER TABLE "_brand_colors_v" ADD COLUMN "version_is_main" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brand_colors" DROP COLUMN "pantone";
  ALTER TABLE "brand_colors" DROP COLUMN "color_group";
  ALTER TABLE "brand_colors" DROP COLUMN "tone";
  ALTER TABLE "brand_colors" DROP COLUMN "is_main";
  ALTER TABLE "_brand_colors_v" DROP COLUMN "version_pantone";
  ALTER TABLE "_brand_colors_v" DROP COLUMN "version_color_group";
  ALTER TABLE "_brand_colors_v" DROP COLUMN "version_tone";
  ALTER TABLE "_brand_colors_v" DROP COLUMN "version_is_main";
  DROP TYPE "public"."enum_brand_colors_color_group";
  DROP TYPE "public"."enum__brand_colors_v_version_color_group";`)
}
