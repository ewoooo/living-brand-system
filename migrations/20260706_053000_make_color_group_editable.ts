import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		ALTER TABLE "brand_colors" ALTER COLUMN "color_group" TYPE varchar USING "color_group"::text;
		ALTER TABLE "_brand_colors_v" ALTER COLUMN "version_color_group" TYPE varchar USING "version_color_group"::text;
		DROP TYPE IF EXISTS "public"."enum_brand_colors_color_group";
		DROP TYPE IF EXISTS "public"."enum__brand_colors_v_version_color_group";
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		CREATE TYPE "public"."enum_brand_colors_color_group" AS ENUM('red', 'yellow', 'green', 'blue', 'purple', 'gray', 'neutral');
		CREATE TYPE "public"."enum__brand_colors_v_version_color_group" AS ENUM('red', 'yellow', 'green', 'blue', 'purple', 'gray', 'neutral');
		UPDATE "brand_colors"
		SET "color_group" = 'neutral'
		WHERE "color_group" IS NOT NULL
			AND "color_group" NOT IN ('red', 'yellow', 'green', 'blue', 'purple', 'gray', 'neutral');
		UPDATE "_brand_colors_v"
		SET "version_color_group" = 'neutral'
		WHERE "version_color_group" IS NOT NULL
			AND "version_color_group" NOT IN ('red', 'yellow', 'green', 'blue', 'purple', 'gray', 'neutral');
		ALTER TABLE "brand_colors" ALTER COLUMN "color_group" TYPE "public"."enum_brand_colors_color_group" USING "color_group"::"public"."enum_brand_colors_color_group";
		ALTER TABLE "_brand_colors_v" ALTER COLUMN "version_color_group" TYPE "public"."enum__brand_colors_v_version_color_group" USING "version_color_group"::"public"."enum__brand_colors_v_version_color_group";
	`)
}
