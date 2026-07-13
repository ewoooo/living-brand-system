import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_sections_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_section_cu_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_section_ms_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_section_cp_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_section_dd_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_sections_v_version_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__section_cu_v_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__section_ms_v_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__section_cp_v_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__section_dd_v_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_blocks_column_unit_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_blocks_media_showcase_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_blocks_color_palette_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_blocks_do_dont_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_version_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_column_unit_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_color_palette_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_do_dont_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_rule_checkers_model" AS ENUM('claude-opus-4-8', 'claude-sonnet-5', 'claude-haiku-4-5');
  CREATE TYPE "public"."enum__rule_checkers_v_version_model" AS ENUM('claude-opus-4-8', 'claude-sonnet-5', 'claude-haiku-4-5');
  ALTER TABLE "rule_checkers" ALTER COLUMN "model" SET DATA TYPE "public"."enum_rule_checkers_model" USING "model"::"public"."enum_rule_checkers_model";
  ALTER TABLE "_rule_checkers_v" ALTER COLUMN "version_model" SET DATA TYPE "public"."enum__rule_checkers_v_version_model" USING "version_model"::"public"."enum__rule_checkers_v_version_model";
  ALTER TABLE "guideline_sections_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "guideline_sections_checks" ADD COLUMN "executor" "enum_guideline_sections_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "guideline_sections_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "section_cu_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "section_cu_checks" ADD COLUMN "executor" "enum_section_cu_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "section_cu_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "section_ms_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "section_ms_checks" ADD COLUMN "executor" "enum_section_ms_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "section_ms_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "section_cp_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "section_cp_checks" ADD COLUMN "executor" "enum_section_cp_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "section_cp_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "section_dd_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "section_dd_checks" ADD COLUMN "executor" "enum_section_dd_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "section_dd_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_guideline_sections_v_version_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_guideline_sections_v_version_checks" ADD COLUMN "executor" "enum__guideline_sections_v_version_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_guideline_sections_v_version_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_section_cu_v_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_section_cu_v_checks" ADD COLUMN "executor" "enum__section_cu_v_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_section_cu_v_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_section_ms_v_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_section_ms_v_checks" ADD COLUMN "executor" "enum__section_ms_v_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_section_ms_v_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_section_cp_v_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_section_cp_v_checks" ADD COLUMN "executor" "enum__section_cp_v_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_section_cp_v_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_section_dd_v_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_section_dd_v_checks" ADD COLUMN "executor" "enum__section_dd_v_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_section_dd_v_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "guideline_pages_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "guideline_pages_checks" ADD COLUMN "executor" "enum_guideline_pages_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "guideline_pages_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" ADD COLUMN "executor" "enum_guideline_pages_blocks_column_unit_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" ADD COLUMN "executor" "enum_guideline_pages_blocks_media_showcase_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" ADD COLUMN "executor" "enum_guideline_pages_blocks_color_palette_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" ADD COLUMN "executor" "enum_guideline_pages_blocks_do_dont_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_guideline_pages_v_version_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_guideline_pages_v_version_checks" ADD COLUMN "executor" "enum__guideline_pages_v_version_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_guideline_pages_v_version_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" ADD COLUMN "executor" "enum__guideline_pages_v_blocks_column_unit_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" ADD COLUMN "executor" "enum__guideline_pages_v_blocks_media_showcase_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" ADD COLUMN "executor" "enum__guideline_pages_v_blocks_color_palette_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" ADD COLUMN "heuristic_prompt" varchar;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" ADD COLUMN "executor" "enum__guideline_pages_v_blocks_do_dont_checks_executor" DEFAULT 'deterministic';
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" ADD COLUMN "heuristic_prompt" varchar;

  DO $$
  DECLARE
    "mapping" record;
  BEGIN
    FOR "mapping" IN
      SELECT * FROM (VALUES
        ('guideline_sections_checks', 'enum_guideline_sections_checks_executor'),
        ('section_cu_checks', 'enum_section_cu_checks_executor'),
        ('section_ms_checks', 'enum_section_ms_checks_executor'),
        ('section_cp_checks', 'enum_section_cp_checks_executor'),
        ('section_dd_checks', 'enum_section_dd_checks_executor'),
        ('_guideline_sections_v_version_checks', 'enum__guideline_sections_v_version_checks_executor'),
        ('_section_cu_v_checks', 'enum__section_cu_v_checks_executor'),
        ('_section_ms_v_checks', 'enum__section_ms_v_checks_executor'),
        ('_section_cp_v_checks', 'enum__section_cp_v_checks_executor'),
        ('_section_dd_v_checks', 'enum__section_dd_v_checks_executor'),
        ('guideline_pages_checks', 'enum_guideline_pages_checks_executor'),
        ('guideline_pages_blocks_column_unit_checks', 'enum_guideline_pages_blocks_column_unit_checks_executor'),
        ('guideline_pages_blocks_media_showcase_checks', 'enum_guideline_pages_blocks_media_showcase_checks_executor'),
        ('guideline_pages_blocks_color_palette_checks', 'enum_guideline_pages_blocks_color_palette_checks_executor'),
        ('guideline_pages_blocks_do_dont_checks', 'enum_guideline_pages_blocks_do_dont_checks_executor'),
        ('_guideline_pages_v_version_checks', 'enum__guideline_pages_v_version_checks_executor'),
        ('_guideline_pages_v_blocks_column_unit_checks', 'enum__guideline_pages_v_blocks_column_unit_checks_executor'),
        ('_guideline_pages_v_blocks_media_showcase_checks', 'enum__guideline_pages_v_blocks_media_showcase_checks_executor'),
        ('_guideline_pages_v_blocks_color_palette_checks', 'enum__guideline_pages_v_blocks_color_palette_checks_executor'),
        ('_guideline_pages_v_blocks_do_dont_checks', 'enum__guideline_pages_v_blocks_do_dont_checks_executor')
      ) AS "mappings"("table_name", "enum_name")
    LOOP
      EXECUTE format(
        'UPDATE %I AS "check" SET "executor" = "checker"."executor"::text::%I.%I FROM "rule_checkers" AS "checker" WHERE "checker"."id" = "check"."checker_id"',
        "mapping"."table_name",
        'public',
        "mapping"."enum_name"
      );
    END LOOP;
  END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rule_checkers" ALTER COLUMN "model" SET DATA TYPE varchar;
  ALTER TABLE "_rule_checkers_v" ALTER COLUMN "version_model" SET DATA TYPE varchar;
  ALTER TABLE "guideline_sections_checks" DROP COLUMN "title_ko";
  ALTER TABLE "guideline_sections_checks" DROP COLUMN "executor";
  ALTER TABLE "guideline_sections_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "section_cu_checks" DROP COLUMN "title_ko";
  ALTER TABLE "section_cu_checks" DROP COLUMN "executor";
  ALTER TABLE "section_cu_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "section_ms_checks" DROP COLUMN "title_ko";
  ALTER TABLE "section_ms_checks" DROP COLUMN "executor";
  ALTER TABLE "section_ms_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "section_cp_checks" DROP COLUMN "title_ko";
  ALTER TABLE "section_cp_checks" DROP COLUMN "executor";
  ALTER TABLE "section_cp_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "section_dd_checks" DROP COLUMN "title_ko";
  ALTER TABLE "section_dd_checks" DROP COLUMN "executor";
  ALTER TABLE "section_dd_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_guideline_sections_v_version_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_guideline_sections_v_version_checks" DROP COLUMN "executor";
  ALTER TABLE "_guideline_sections_v_version_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_section_cu_v_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_section_cu_v_checks" DROP COLUMN "executor";
  ALTER TABLE "_section_cu_v_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_section_ms_v_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_section_ms_v_checks" DROP COLUMN "executor";
  ALTER TABLE "_section_ms_v_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_section_cp_v_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_section_cp_v_checks" DROP COLUMN "executor";
  ALTER TABLE "_section_cp_v_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_section_dd_v_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_section_dd_v_checks" DROP COLUMN "executor";
  ALTER TABLE "_section_dd_v_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "guideline_pages_checks" DROP COLUMN "title_ko";
  ALTER TABLE "guideline_pages_checks" DROP COLUMN "executor";
  ALTER TABLE "guideline_pages_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" DROP COLUMN "title_ko";
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" DROP COLUMN "executor";
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" DROP COLUMN "title_ko";
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" DROP COLUMN "executor";
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" DROP COLUMN "title_ko";
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" DROP COLUMN "executor";
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" DROP COLUMN "title_ko";
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" DROP COLUMN "executor";
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_guideline_pages_v_version_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_guideline_pages_v_version_checks" DROP COLUMN "executor";
  ALTER TABLE "_guideline_pages_v_version_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" DROP COLUMN "executor";
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" DROP COLUMN "executor";
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" DROP COLUMN "executor";
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" DROP COLUMN "heuristic_prompt";
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" DROP COLUMN "title_ko";
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" DROP COLUMN "executor";
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" DROP COLUMN "heuristic_prompt";
  DROP TYPE "public"."enum_guideline_sections_checks_executor";
  DROP TYPE "public"."enum_section_cu_checks_executor";
  DROP TYPE "public"."enum_section_ms_checks_executor";
  DROP TYPE "public"."enum_section_cp_checks_executor";
  DROP TYPE "public"."enum_section_dd_checks_executor";
  DROP TYPE "public"."enum__guideline_sections_v_version_checks_executor";
  DROP TYPE "public"."enum__section_cu_v_checks_executor";
  DROP TYPE "public"."enum__section_ms_v_checks_executor";
  DROP TYPE "public"."enum__section_cp_v_checks_executor";
  DROP TYPE "public"."enum__section_dd_v_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_blocks_column_unit_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_blocks_media_showcase_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_blocks_color_palette_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_blocks_do_dont_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_version_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_column_unit_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_color_palette_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_do_dont_checks_executor";
  DROP TYPE "public"."enum_rule_checkers_model";
  DROP TYPE "public"."enum__rule_checkers_v_version_model";`)
}
