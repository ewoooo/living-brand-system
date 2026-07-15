import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_heuristic_criterion_kind" AS ENUM('presence', 'measure');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_heuristic_criterion_operator" AS ENUM('gte', 'lte', 'between');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;
  ALTER TABLE "guideline_docs_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "guideline_docs_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "guideline_docs_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "guideline_docs_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "guideline_docs_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" ADD COLUMN IF NOT EXISTS "kind" "enum_heuristic_criterion_kind" DEFAULT 'presence';
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" ADD COLUMN IF NOT EXISTS "operator" "enum_heuristic_criterion_operator";
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" ADD COLUMN IF NOT EXISTS "expected_value" numeric;
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" ADD COLUMN IF NOT EXISTS "max" numeric;
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" ADD COLUMN IF NOT EXISTS "unit" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" DROP COLUMN "unit";
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" DROP COLUMN "unit";
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" DROP COLUMN "unit";
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" DROP COLUMN "unit";
  ALTER TABLE "guideline_docs_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "guideline_docs_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "guideline_docs_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "guideline_docs_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "guideline_docs_checks_criteria" DROP COLUMN "unit";
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" DROP COLUMN "unit";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" DROP COLUMN "unit";
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" DROP COLUMN "unit";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" DROP COLUMN "unit";
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" DROP COLUMN "kind";
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" DROP COLUMN "operator";
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" DROP COLUMN "expected_value";
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" DROP COLUMN "max";
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" DROP COLUMN "unit";
  DROP TYPE "public"."enum_heuristic_criterion_kind";
  DROP TYPE "public"."enum_heuristic_criterion_operator";`)
}
