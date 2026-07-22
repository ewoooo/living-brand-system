import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		DO $$ BEGIN
			CREATE TYPE "public"."enum_guideline_docs_blocks_column_unit_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
		DO $$ BEGIN
			CREATE TYPE "public"."enum_guideline_docs_blocks_media_showcase_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
		DO $$ BEGIN
			CREATE TYPE "public"."enum__guideline_docs_v_blocks_column_unit_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
		DO $$ BEGIN
			CREATE TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
		ALTER TABLE "guideline_docs_blocks_column_unit" ADD COLUMN IF NOT EXISTS "image_ratio" "enum_guideline_docs_blocks_column_unit_image_ratio" DEFAULT '4:3';
		ALTER TABLE "guideline_docs_blocks_media_showcase" ADD COLUMN IF NOT EXISTS "image_ratio" "enum_guideline_docs_blocks_media_showcase_image_ratio" DEFAULT '16:9';
		ALTER TABLE "_guideline_docs_v_blocks_column_unit" ADD COLUMN IF NOT EXISTS "image_ratio" "enum__guideline_docs_v_blocks_column_unit_image_ratio" DEFAULT '4:3';
		ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD COLUMN IF NOT EXISTS "image_ratio" "enum__guideline_docs_v_blocks_media_showcase_image_ratio" DEFAULT '16:9';
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		ALTER TABLE "guideline_docs_blocks_column_unit" DROP COLUMN IF EXISTS "image_ratio";
		ALTER TABLE "guideline_docs_blocks_media_showcase" DROP COLUMN IF EXISTS "image_ratio";
		ALTER TABLE "_guideline_docs_v_blocks_column_unit" DROP COLUMN IF EXISTS "image_ratio";
		ALTER TABLE "_guideline_docs_v_blocks_media_showcase" DROP COLUMN IF EXISTS "image_ratio";
		DROP TYPE IF EXISTS "public"."enum_guideline_docs_blocks_column_unit_image_ratio";
		DROP TYPE IF EXISTS "public"."enum_guideline_docs_blocks_media_showcase_image_ratio";
		DROP TYPE IF EXISTS "public"."enum__guideline_docs_v_blocks_column_unit_image_ratio";
		DROP TYPE IF EXISTS "public"."enum__guideline_docs_v_blocks_media_showcase_image_ratio";
	`)
}
