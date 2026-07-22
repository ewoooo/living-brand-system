import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_chapters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_chapters_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_chapters_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_chapters_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_sections_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_cu_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_cu_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_cu_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_cu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_ms_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_ms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_cp_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_cp" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_cp_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_dd_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_dd_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_dd_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_dd_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_dd_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_dd" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_dd_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_sections_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_sections_v_version_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_cu_v_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_cu_v_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_cu_v_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_cu_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_ms_v_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_ms_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_cp_v_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_cp_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_cp_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_dd_v_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_dd_v_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_dd_v_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_dd_v_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_dd_v_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_dd_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_dd_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_sections_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_sections_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_sections_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_column_unit_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_column_unit_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_column_unit" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_media_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_color_palette" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_color_palette_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_version_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guideline_chapters_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guideline_sections_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guideline_pages_fk";

  -- 031500이 빈 체인에서 pre-create한 legacy criteria 테이블 정리.
  -- 부모 테이블의 DROP ... CASCADE는 FK 제약만 제거하고 자식 테이블은 남기므로 명시적으로 드롭한다.
  -- 이미 적용된 DB에는 존재하지 않을 수 있어 IF EXISTS를 사용한다. docs 계열 criteria는 유지한다.
  DROP TABLE IF EXISTS "guideline_sections_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "section_cu_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "section_ms_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "section_cp_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "section_dd_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "guideline_pages_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "guideline_pages_blocks_column_unit_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "guideline_pages_blocks_media_showcase_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "guideline_pages_blocks_color_palette_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "guideline_pages_blocks_do_dont_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_guideline_sections_v_version_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_section_cu_v_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_section_ms_v_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_section_cp_v_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_section_dd_v_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_guideline_pages_v_version_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_guideline_pages_v_blocks_column_unit_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_guideline_pages_v_blocks_media_showcase_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_guideline_pages_v_blocks_color_palette_checks_criteria" CASCADE;
  DROP TABLE IF EXISTS "_guideline_pages_v_blocks_do_dont_checks_criteria" CASCADE;
  DROP TABLE "guideline_chapters" CASCADE;
  DROP TABLE "guideline_chapters_locales" CASCADE;
  DROP TABLE "_guideline_chapters_v" CASCADE;
  DROP TABLE "_guideline_chapters_v_locales" CASCADE;
  DROP TABLE "guideline_sections_checks" CASCADE;
  DROP TABLE "section_cu_columns" CASCADE;
  DROP TABLE "section_cu_columns_locales" CASCADE;
  DROP TABLE "section_cu_checks" CASCADE;
  DROP TABLE "section_cu" CASCADE;
  DROP TABLE "section_ms_checks" CASCADE;
  DROP TABLE "section_ms" CASCADE;
  DROP TABLE "section_cp_checks" CASCADE;
  DROP TABLE "section_cp" CASCADE;
  DROP TABLE "section_cp_locales" CASCADE;
  DROP TABLE "section_dd_groups_examples" CASCADE;
  DROP TABLE "section_dd_groups_examples_locales" CASCADE;
  DROP TABLE "section_dd_groups" CASCADE;
  DROP TABLE "section_dd_groups_locales" CASCADE;
  DROP TABLE "section_dd_checks" CASCADE;
  DROP TABLE "section_dd" CASCADE;
  DROP TABLE "section_dd_locales" CASCADE;
  DROP TABLE "guideline_sections" CASCADE;
  DROP TABLE "guideline_sections_locales" CASCADE;
  DROP TABLE "guideline_sections_rels" CASCADE;
  DROP TABLE "_guideline_sections_v_version_checks" CASCADE;
  DROP TABLE "_section_cu_v_columns" CASCADE;
  DROP TABLE "_section_cu_v_columns_locales" CASCADE;
  DROP TABLE "_section_cu_v_checks" CASCADE;
  DROP TABLE "_section_cu_v" CASCADE;
  DROP TABLE "_section_ms_v_checks" CASCADE;
  DROP TABLE "_section_ms_v" CASCADE;
  DROP TABLE "_section_cp_v_checks" CASCADE;
  DROP TABLE "_section_cp_v" CASCADE;
  DROP TABLE "_section_cp_v_locales" CASCADE;
  DROP TABLE "_section_dd_v_groups_examples" CASCADE;
  DROP TABLE "_section_dd_v_groups_examples_locales" CASCADE;
  DROP TABLE "_section_dd_v_groups" CASCADE;
  DROP TABLE "_section_dd_v_groups_locales" CASCADE;
  DROP TABLE "_section_dd_v_checks" CASCADE;
  DROP TABLE "_section_dd_v" CASCADE;
  DROP TABLE "_section_dd_v_locales" CASCADE;
  DROP TABLE "_guideline_sections_v" CASCADE;
  DROP TABLE "_guideline_sections_v_locales" CASCADE;
  DROP TABLE "_guideline_sections_v_rels" CASCADE;
  DROP TABLE "guideline_pages_checks" CASCADE;
  DROP TABLE "guideline_pages_blocks_column_unit_columns" CASCADE;
  DROP TABLE "guideline_pages_blocks_column_unit_columns_locales" CASCADE;
  DROP TABLE "guideline_pages_blocks_column_unit_checks" CASCADE;
  DROP TABLE "guideline_pages_blocks_column_unit" CASCADE;
  DROP TABLE "guideline_pages_blocks_media_showcase_checks" CASCADE;
  DROP TABLE "guideline_pages_blocks_media_showcase" CASCADE;
  DROP TABLE "guideline_pages_blocks_color_palette_checks" CASCADE;
  DROP TABLE "guideline_pages_blocks_color_palette" CASCADE;
  DROP TABLE "guideline_pages_blocks_color_palette_locales" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_groups_examples" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_groups_examples_locales" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_groups" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_groups_locales" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_checks" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_locales" CASCADE;
  DROP TABLE "guideline_pages" CASCADE;
  DROP TABLE "guideline_pages_locales" CASCADE;
  DROP TABLE "guideline_pages_rels" CASCADE;
  DROP TABLE "_guideline_pages_v_version_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_column_unit_columns" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_column_unit_columns_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_column_unit_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_column_unit" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_media_showcase_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_media_showcase" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_color_palette_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_color_palette" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_color_palette_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_groups_examples_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_groups" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_groups_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_locales" CASCADE;
  DROP TABLE "_guideline_pages_v" CASCADE;
  DROP TABLE "_guideline_pages_v_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_rels" CASCADE;
  DROP INDEX "payload_locked_documents_rels_guideline_chapters_id_idx";
  DROP INDEX "payload_locked_documents_rels_guideline_sections_id_idx";
  DROP INDEX "payload_locked_documents_rels_guideline_pages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guideline_chapters_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guideline_sections_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guideline_pages_id";
  DROP TYPE "public"."enum_guideline_chapters_status";
  DROP TYPE "public"."enum__guideline_chapters_v_version_status";
  DROP TYPE "public"."enum__guideline_chapters_v_published_locale";
  DROP TYPE "public"."enum_guideline_sections_checks_tier";
  DROP TYPE "public"."enum_guideline_sections_checks_executor";
  DROP TYPE "public"."enum_section_cu_columns_image_scale";
  DROP TYPE "public"."enum_section_cu_checks_tier";
  DROP TYPE "public"."enum_section_cu_checks_executor";
  DROP TYPE "public"."enum_section_ms_checks_tier";
  DROP TYPE "public"."enum_section_ms_checks_executor";
  DROP TYPE "public"."enum_section_ms_image_scale";
  DROP TYPE "public"."enum_section_cp_checks_tier";
  DROP TYPE "public"."enum_section_cp_checks_executor";
  DROP TYPE "public"."enum_section_dd_groups_examples_kind";
  DROP TYPE "public"."enum_section_dd_checks_tier";
  DROP TYPE "public"."enum_section_dd_checks_executor";
  DROP TYPE "public"."enum_guideline_sections_status";
  DROP TYPE "public"."enum__guideline_sections_v_version_checks_tier";
  DROP TYPE "public"."enum__guideline_sections_v_version_checks_executor";
  DROP TYPE "public"."enum__section_cu_v_columns_image_scale";
  DROP TYPE "public"."enum__section_cu_v_checks_tier";
  DROP TYPE "public"."enum__section_cu_v_checks_executor";
  DROP TYPE "public"."enum__section_ms_v_checks_tier";
  DROP TYPE "public"."enum__section_ms_v_checks_executor";
  DROP TYPE "public"."enum__section_ms_v_image_scale";
  DROP TYPE "public"."enum__section_cp_v_checks_tier";
  DROP TYPE "public"."enum__section_cp_v_checks_executor";
  DROP TYPE "public"."enum__section_dd_v_groups_examples_kind";
  DROP TYPE "public"."enum__section_dd_v_checks_tier";
  DROP TYPE "public"."enum__section_dd_v_checks_executor";
  DROP TYPE "public"."enum__guideline_sections_v_version_status";
  DROP TYPE "public"."enum__guideline_sections_v_published_locale";
  DROP TYPE "public"."enum_guideline_pages_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_blocks_column_unit_columns_image_scale";
  DROP TYPE "public"."enum_guideline_pages_blocks_column_unit_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_blocks_column_unit_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_blocks_media_showcase_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_blocks_media_showcase_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_blocks_media_showcase_image_scale";
  DROP TYPE "public"."enum_guideline_pages_blocks_color_palette_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_blocks_color_palette_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_blocks_do_dont_groups_examples_kind";
  DROP TYPE "public"."enum_guideline_pages_blocks_do_dont_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_blocks_do_dont_checks_executor";
  DROP TYPE "public"."enum_guideline_pages_status";
  DROP TYPE "public"."enum__guideline_pages_v_version_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_version_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_column_unit_columns_image_scale";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_column_unit_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_column_unit_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_image_scale";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_color_palette_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_color_palette_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_do_dont_groups_examples_kind";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_do_dont_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_do_dont_checks_executor";
  DROP TYPE "public"."enum__guideline_pages_v_version_status";
  DROP TYPE "public"."enum__guideline_pages_v_published_locale";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_chapters_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_chapters_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_chapters_v_published_locale" AS ENUM('ko', 'en');
  CREATE TYPE "public"."enum_guideline_sections_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_sections_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_section_cu_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_section_cu_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_section_cu_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_section_ms_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_section_ms_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_section_ms_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_section_cp_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_section_cp_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_section_dd_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TYPE "public"."enum_section_dd_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_section_dd_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_sections_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_sections_v_version_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_sections_v_version_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__section_cu_v_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__section_cu_v_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__section_cu_v_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__section_ms_v_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__section_ms_v_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__section_ms_v_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__section_cp_v_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__section_cp_v_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__section_dd_v_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TYPE "public"."enum__section_dd_v_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__section_dd_v_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_sections_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_sections_v_published_locale" AS ENUM('ko', 'en');
  CREATE TYPE "public"."enum_guideline_pages_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_blocks_column_unit_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_guideline_pages_blocks_column_unit_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_blocks_column_unit_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_blocks_media_showcase_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_blocks_media_showcase_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_blocks_media_showcase_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_guideline_pages_blocks_color_palette_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_blocks_color_palette_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_blocks_do_dont_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TYPE "public"."enum_guideline_pages_blocks_do_dont_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_blocks_do_dont_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_pages_v_version_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_version_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_column_unit_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_column_unit_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_column_unit_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_color_palette_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_color_palette_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_do_dont_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_do_dont_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_do_dont_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_pages_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "guideline_chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_order" numeric DEFAULT 0,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_guideline_chapters_status" DEFAULT 'draft'
  );

  CREATE TABLE "guideline_chapters_locales" (
	"title" varchar,
	"label" varchar,
	"generate_slug" boolean DEFAULT true,
	"slug" varchar,
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_chapters_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_display_order" numeric DEFAULT 0,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__guideline_chapters_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__guideline_chapters_v_published_locale",
	"latest" boolean
  );

  CREATE TABLE "_guideline_chapters_v_locales" (
	"version_title" varchar,
	"version_label" varchar,
	"version_generate_slug" boolean DEFAULT true,
	"version_slug" varchar,
	"version_description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "guideline_sections_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_sections_checks_tier",
	"executor" "enum_guideline_sections_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "section_cu_columns" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum_section_cu_columns_image_scale" DEFAULT '100'
  );

  CREATE TABLE "section_cu_columns_locales" (
	"heading" varchar,
	"body" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "section_cu_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_section_cu_checks_tier",
	"executor" "enum_section_cu_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "section_cu" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "section_ms_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_section_ms_checks_tier",
	"executor" "enum_section_ms_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "section_ms" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum_section_ms_image_scale" DEFAULT '100',
	"block_name" varchar
  );

  CREATE TABLE "section_cp_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_section_cp_checks_tier",
	"executor" "enum_section_cp_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "section_cp" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "section_cp_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "section_dd_groups_examples" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"kind" "enum_section_dd_groups_examples_kind" DEFAULT 'dont',
	"image_id" integer
  );

  CREATE TABLE "section_dd_groups_examples_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "section_dd_groups" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "section_dd_groups_locales" (
	"category" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "section_dd_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_section_dd_checks_tier",
	"executor" "enum_section_dd_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "section_dd" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "section_dd_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"chapter_id" integer,
	"header_image_id" integer,
	"display_order" numeric DEFAULT 0,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_guideline_sections_status" DEFAULT 'draft'
  );

  CREATE TABLE "guideline_sections_locales" (
	"title" varchar,
	"generate_slug" boolean DEFAULT true,
	"slug" varchar,
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "guideline_sections_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"brand_colors_id" integer
  );

  CREATE TABLE "_guideline_sections_v_version_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_sections_v_version_checks_tier",
	"executor" "enum__guideline_sections_v_version_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_section_cu_v_columns" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum__section_cu_v_columns_image_scale" DEFAULT '100',
	"_uuid" varchar
  );

  CREATE TABLE "_section_cu_v_columns_locales" (
	"heading" varchar,
	"body" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_section_cu_v_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__section_cu_v_checks_tier",
	"executor" "enum__section_cu_v_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_section_cu_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_section_ms_v_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__section_ms_v_checks_tier",
	"executor" "enum__section_ms_v_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_section_ms_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum__section_ms_v_image_scale" DEFAULT '100',
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_section_cp_v_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__section_cp_v_checks_tier",
	"executor" "enum__section_cp_v_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_section_cp_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_section_cp_v_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_section_dd_v_groups_examples" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "enum__section_dd_v_groups_examples_kind" DEFAULT 'dont',
	"image_id" integer,
	"_uuid" varchar
  );

  CREATE TABLE "_section_dd_v_groups_examples_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_section_dd_v_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
  );

  CREATE TABLE "_section_dd_v_groups_locales" (
	"category" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_section_dd_v_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__section_dd_v_checks_tier",
	"executor" "enum__section_dd_v_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_section_dd_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_section_dd_v_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_sections_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_chapter_id" integer,
	"version_header_image_id" integer,
	"version_display_order" numeric DEFAULT 0,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__guideline_sections_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__guideline_sections_v_published_locale",
	"latest" boolean
  );

  CREATE TABLE "_guideline_sections_v_locales" (
	"version_title" varchar,
	"version_generate_slug" boolean DEFAULT true,
	"version_slug" varchar,
	"version_description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_sections_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"brand_colors_id" integer
  );

  CREATE TABLE "guideline_pages_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_pages_checks_tier",
	"executor" "enum_guideline_pages_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_pages_blocks_column_unit_columns" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum_guideline_pages_blocks_column_unit_columns_image_scale" DEFAULT '100'
  );

  CREATE TABLE "guideline_pages_blocks_column_unit_columns_locales" (
	"heading" varchar,
	"body" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_pages_blocks_column_unit_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_pages_blocks_column_unit_checks_tier",
	"executor" "enum_guideline_pages_blocks_column_unit_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_pages_blocks_column_unit" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "guideline_pages_blocks_media_showcase_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_pages_blocks_media_showcase_checks_tier",
	"executor" "enum_guideline_pages_blocks_media_showcase_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_pages_blocks_media_showcase" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum_guideline_pages_blocks_media_showcase_image_scale" DEFAULT '100',
	"block_name" varchar
  );

  CREATE TABLE "guideline_pages_blocks_color_palette_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_pages_blocks_color_palette_checks_tier",
	"executor" "enum_guideline_pages_blocks_color_palette_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_pages_blocks_color_palette" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "guideline_pages_blocks_color_palette_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_pages_blocks_do_dont_groups_examples" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"kind" "enum_guideline_pages_blocks_do_dont_groups_examples_kind" DEFAULT 'dont',
	"image_id" integer
  );

  CREATE TABLE "guideline_pages_blocks_do_dont_groups_examples_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_pages_blocks_do_dont_groups" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "guideline_pages_blocks_do_dont_groups_locales" (
	"category" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_pages_blocks_do_dont_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_pages_blocks_do_dont_checks_tier",
	"executor" "enum_guideline_pages_blocks_do_dont_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_pages_blocks_do_dont" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "guideline_pages_blocks_do_dont_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer,
	"display_order" numeric DEFAULT 0,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_guideline_pages_status" DEFAULT 'draft'
  );

  CREATE TABLE "guideline_pages_locales" (
	"title" varchar,
	"generate_slug" boolean DEFAULT true,
	"slug" varchar,
	"description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "guideline_pages_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"brand_colors_id" integer
  );

  CREATE TABLE "_guideline_pages_v_version_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_pages_v_version_checks_tier",
	"executor" "enum__guideline_pages_v_version_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_column_unit_columns" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum__guideline_pages_v_blocks_column_unit_columns_image_scale" DEFAULT '100',
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_column_unit_columns_locales" (
	"heading" varchar,
	"body" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_pages_v_blocks_column_unit_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_pages_v_blocks_column_unit_checks_tier",
	"executor" "enum__guideline_pages_v_blocks_column_unit_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_column_unit" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_media_showcase_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_pages_v_blocks_media_showcase_checks_tier",
	"executor" "enum__guideline_pages_v_blocks_media_showcase_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_media_showcase" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum__guideline_pages_v_blocks_media_showcase_image_scale" DEFAULT '100',
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_color_palette_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_pages_v_blocks_color_palette_checks_tier",
	"executor" "enum__guideline_pages_v_blocks_color_palette_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_color_palette" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_color_palette_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "enum__guideline_pages_v_blocks_do_dont_groups_examples_kind" DEFAULT 'dont',
	"image_id" integer,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_do_dont_groups_examples_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_pages_v_blocks_do_dont_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_do_dont_groups_locales" (
	"category" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_pages_v_blocks_do_dont_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_pages_v_blocks_do_dont_checks_tier",
	"executor" "enum__guideline_pages_v_blocks_do_dont_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_do_dont" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_guideline_pages_v_blocks_do_dont_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_pages_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_section_id" integer,
	"version_display_order" numeric DEFAULT 0,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__guideline_pages_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__guideline_pages_v_published_locale",
	"latest" boolean
  );

  CREATE TABLE "_guideline_pages_v_locales" (
	"version_title" varchar,
	"version_generate_slug" boolean DEFAULT true,
	"version_slug" varchar,
	"version_description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_pages_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"brand_colors_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guideline_chapters_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guideline_sections_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guideline_pages_id" integer;
  ALTER TABLE "guideline_chapters_locales" ADD CONSTRAINT "guideline_chapters_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_chapters_v" ADD CONSTRAINT "_guideline_chapters_v_parent_id_guideline_chapters_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_chapters_v_locales" ADD CONSTRAINT "_guideline_chapters_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_chapters_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_sections_checks" ADD CONSTRAINT "guideline_sections_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_sections_checks" ADD CONSTRAINT "guideline_sections_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cu_columns" ADD CONSTRAINT "section_cu_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cu_columns" ADD CONSTRAINT "section_cu_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cu_columns" ADD CONSTRAINT "section_cu_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cu_columns_locales" ADD CONSTRAINT "section_cu_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cu_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cu_checks" ADD CONSTRAINT "section_cu_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cu_checks" ADD CONSTRAINT "section_cu_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cu" ADD CONSTRAINT "section_cu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_ms_checks" ADD CONSTRAINT "section_ms_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_ms_checks" ADD CONSTRAINT "section_ms_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_ms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_ms" ADD CONSTRAINT "section_ms_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_ms" ADD CONSTRAINT "section_ms_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_ms" ADD CONSTRAINT "section_ms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cp_checks" ADD CONSTRAINT "section_cp_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cp_checks" ADD CONSTRAINT "section_cp_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cp" ADD CONSTRAINT "section_cp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cp_locales" ADD CONSTRAINT "section_cp_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_groups_examples" ADD CONSTRAINT "section_dd_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_dd_groups_examples" ADD CONSTRAINT "section_dd_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_groups_examples_locales" ADD CONSTRAINT "section_dd_groups_examples_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_groups" ADD CONSTRAINT "section_dd_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_groups_locales" ADD CONSTRAINT "section_dd_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_checks" ADD CONSTRAINT "section_dd_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_dd_checks" ADD CONSTRAINT "section_dd_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd" ADD CONSTRAINT "section_dd_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_locales" ADD CONSTRAINT "section_dd_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_sections" ADD CONSTRAINT "guideline_sections_chapter_id_guideline_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_sections" ADD CONSTRAINT "guideline_sections_header_image_id_application_images_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_sections_locales" ADD CONSTRAINT "guideline_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_sections_rels" ADD CONSTRAINT "guideline_sections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_sections_rels" ADD CONSTRAINT "guideline_sections_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_version_checks" ADD CONSTRAINT "_guideline_sections_v_version_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_version_checks" ADD CONSTRAINT "_guideline_sections_v_version_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v_columns" ADD CONSTRAINT "_section_cu_v_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cu_v_columns" ADD CONSTRAINT "_section_cu_v_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cu_v_columns" ADD CONSTRAINT "_section_cu_v_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cu_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v_columns_locales" ADD CONSTRAINT "_section_cu_v_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cu_v_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v_checks" ADD CONSTRAINT "_section_cu_v_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cu_v_checks" ADD CONSTRAINT "_section_cu_v_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cu_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v" ADD CONSTRAINT "_section_cu_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_ms_v_checks" ADD CONSTRAINT "_section_ms_v_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_ms_v_checks" ADD CONSTRAINT "_section_ms_v_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_ms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_ms_v" ADD CONSTRAINT "_section_ms_v_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_ms_v" ADD CONSTRAINT "_section_ms_v_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_ms_v" ADD CONSTRAINT "_section_ms_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cp_v_checks" ADD CONSTRAINT "_section_cp_v_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cp_v_checks" ADD CONSTRAINT "_section_cp_v_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cp_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cp_v" ADD CONSTRAINT "_section_cp_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cp_v_locales" ADD CONSTRAINT "_section_cp_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cp_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups_examples" ADD CONSTRAINT "_section_dd_v_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups_examples" ADD CONSTRAINT "_section_dd_v_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups_examples_locales" ADD CONSTRAINT "_section_dd_v_groups_examples_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups" ADD CONSTRAINT "_section_dd_v_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups_locales" ADD CONSTRAINT "_section_dd_v_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_checks" ADD CONSTRAINT "_section_dd_v_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_dd_v_checks" ADD CONSTRAINT "_section_dd_v_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v" ADD CONSTRAINT "_section_dd_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_locales" ADD CONSTRAINT "_section_dd_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v" ADD CONSTRAINT "_guideline_sections_v_parent_id_guideline_sections_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v" ADD CONSTRAINT "_guideline_sections_v_version_chapter_id_guideline_chapters_id_fk" FOREIGN KEY ("version_chapter_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v" ADD CONSTRAINT "_guideline_sections_v_version_header_image_id_application_images_id_fk" FOREIGN KEY ("version_header_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_locales" ADD CONSTRAINT "_guideline_sections_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_rels" ADD CONSTRAINT "_guideline_sections_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_rels" ADD CONSTRAINT "_guideline_sections_v_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_checks" ADD CONSTRAINT "guideline_pages_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_checks" ADD CONSTRAINT "guideline_pages_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit_columns" ADD CONSTRAINT "guideline_pages_blocks_column_unit_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit_columns" ADD CONSTRAINT "guideline_pages_blocks_column_unit_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit_columns" ADD CONSTRAINT "guideline_pages_blocks_column_unit_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit_columns_locales" ADD CONSTRAINT "guideline_pages_blocks_column_unit_columns_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_column_unit_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" ADD CONSTRAINT "guideline_pages_blocks_column_unit_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" ADD CONSTRAINT "guideline_pages_blocks_column_unit_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit" ADD CONSTRAINT "guideline_pages_blocks_column_unit_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" ADD CONSTRAINT "guideline_pages_blocks_media_showcase_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" ADD CONSTRAINT "guideline_pages_blocks_media_showcase_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_media_showcase" ADD CONSTRAINT "guideline_pages_blocks_media_showcase_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_media_showcase" ADD CONSTRAINT "guideline_pages_blocks_media_showcase_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_media_showcase" ADD CONSTRAINT "guideline_pages_blocks_media_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" ADD CONSTRAINT "guideline_pages_blocks_color_palette_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" ADD CONSTRAINT "guideline_pages_blocks_color_palette_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_color_palette" ADD CONSTRAINT "guideline_pages_blocks_color_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_color_palette_locales" ADD CONSTRAINT "guideline_pages_blocks_color_palette_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples_locales" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_examples_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_locales" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" ADD CONSTRAINT "guideline_pages_blocks_do_dont_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" ADD CONSTRAINT "guideline_pages_blocks_do_dont_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont" ADD CONSTRAINT "guideline_pages_blocks_do_dont_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_locales" ADD CONSTRAINT "guideline_pages_blocks_do_dont_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages" ADD CONSTRAINT "guideline_pages_section_id_guideline_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."guideline_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_locales" ADD CONSTRAINT "guideline_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_rels" ADD CONSTRAINT "guideline_pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_rels" ADD CONSTRAINT "guideline_pages_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_version_checks" ADD CONSTRAINT "_guideline_pages_v_version_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_version_checks" ADD CONSTRAINT "_guideline_pages_v_version_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_columns" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_columns" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_columns" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_columns_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_columns_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_column_unit_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_media_showcase_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_media_showcase_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_pages_v_blocks_media_showcase_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_pages_v_blocks_media_showcase_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_pages_v_blocks_media_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_examples_locales_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v" ADD CONSTRAINT "_guideline_pages_v_parent_id_guideline_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v" ADD CONSTRAINT "_guideline_pages_v_version_section_id_guideline_sections_id_fk" FOREIGN KEY ("version_section_id") REFERENCES "public"."guideline_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_locales" ADD CONSTRAINT "_guideline_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_rels" ADD CONSTRAINT "_guideline_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_rels" ADD CONSTRAINT "_guideline_pages_v_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_chapters_updated_at_idx" ON "guideline_chapters" USING btree ("updated_at");
  CREATE INDEX "guideline_chapters_created_at_idx" ON "guideline_chapters" USING btree ("created_at");
  CREATE INDEX "guideline_chapters__status_idx" ON "guideline_chapters" USING btree ("_status");
  CREATE UNIQUE INDEX "guideline_chapters_slug_idx" ON "guideline_chapters_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "guideline_chapters_locales_locale_parent_id_unique" ON "guideline_chapters_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_chapters_v_parent_idx" ON "_guideline_chapters_v" USING btree ("parent_id");
  CREATE INDEX "_guideline_chapters_v_version_version_updated_at_idx" ON "_guideline_chapters_v" USING btree ("version_updated_at");
  CREATE INDEX "_guideline_chapters_v_version_version_created_at_idx" ON "_guideline_chapters_v" USING btree ("version_created_at");
  CREATE INDEX "_guideline_chapters_v_version_version__status_idx" ON "_guideline_chapters_v" USING btree ("version__status");
  CREATE INDEX "_guideline_chapters_v_created_at_idx" ON "_guideline_chapters_v" USING btree ("created_at");
  CREATE INDEX "_guideline_chapters_v_updated_at_idx" ON "_guideline_chapters_v" USING btree ("updated_at");
  CREATE INDEX "_guideline_chapters_v_snapshot_idx" ON "_guideline_chapters_v" USING btree ("snapshot");
  CREATE INDEX "_guideline_chapters_v_published_locale_idx" ON "_guideline_chapters_v" USING btree ("published_locale");
  CREATE INDEX "_guideline_chapters_v_latest_idx" ON "_guideline_chapters_v" USING btree ("latest");
  CREATE INDEX "_guideline_chapters_v_version_version_slug_idx" ON "_guideline_chapters_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_guideline_chapters_v_locales_locale_parent_id_unique" ON "_guideline_chapters_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_sections_checks_order_idx" ON "guideline_sections_checks" USING btree ("_order");
  CREATE INDEX "guideline_sections_checks_parent_id_idx" ON "guideline_sections_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_sections_checks_checker_idx" ON "guideline_sections_checks" USING btree ("checker_id");
  CREATE INDEX "section_cu_columns_order_idx" ON "section_cu_columns" USING btree ("_order");
  CREATE INDEX "section_cu_columns_parent_id_idx" ON "section_cu_columns" USING btree ("_parent_id");
  CREATE INDEX "section_cu_columns_image_idx" ON "section_cu_columns" USING btree ("image_id");
  CREATE INDEX "section_cu_columns_image_background_color_idx" ON "section_cu_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "section_cu_columns_locales_locale_parent_id_unique" ON "section_cu_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_cu_checks_order_idx" ON "section_cu_checks" USING btree ("_order");
  CREATE INDEX "section_cu_checks_parent_id_idx" ON "section_cu_checks" USING btree ("_parent_id");
  CREATE INDEX "section_cu_checks_checker_idx" ON "section_cu_checks" USING btree ("checker_id");
  CREATE INDEX "section_cu_order_idx" ON "section_cu" USING btree ("_order");
  CREATE INDEX "section_cu_parent_id_idx" ON "section_cu" USING btree ("_parent_id");
  CREATE INDEX "section_cu_path_idx" ON "section_cu" USING btree ("_path");
  CREATE INDEX "section_ms_checks_order_idx" ON "section_ms_checks" USING btree ("_order");
  CREATE INDEX "section_ms_checks_parent_id_idx" ON "section_ms_checks" USING btree ("_parent_id");
  CREATE INDEX "section_ms_checks_checker_idx" ON "section_ms_checks" USING btree ("checker_id");
  CREATE INDEX "section_ms_order_idx" ON "section_ms" USING btree ("_order");
  CREATE INDEX "section_ms_parent_id_idx" ON "section_ms" USING btree ("_parent_id");
  CREATE INDEX "section_ms_path_idx" ON "section_ms" USING btree ("_path");
  CREATE INDEX "section_ms_image_idx" ON "section_ms" USING btree ("image_id");
  CREATE INDEX "section_ms_image_background_color_idx" ON "section_ms" USING btree ("image_background_color_id");
  CREATE INDEX "section_cp_checks_order_idx" ON "section_cp_checks" USING btree ("_order");
  CREATE INDEX "section_cp_checks_parent_id_idx" ON "section_cp_checks" USING btree ("_parent_id");
  CREATE INDEX "section_cp_checks_checker_idx" ON "section_cp_checks" USING btree ("checker_id");
  CREATE INDEX "section_cp_order_idx" ON "section_cp" USING btree ("_order");
  CREATE INDEX "section_cp_parent_id_idx" ON "section_cp" USING btree ("_parent_id");
  CREATE INDEX "section_cp_path_idx" ON "section_cp" USING btree ("_path");
  CREATE UNIQUE INDEX "section_cp_locales_locale_parent_id_unique" ON "section_cp_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_dd_groups_examples_order_idx" ON "section_dd_groups_examples" USING btree ("_order");
  CREATE INDEX "section_dd_groups_examples_parent_id_idx" ON "section_dd_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "section_dd_groups_examples_image_idx" ON "section_dd_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "section_dd_groups_examples_locales_locale_parent_id_unique" ON "section_dd_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_dd_groups_order_idx" ON "section_dd_groups" USING btree ("_order");
  CREATE INDEX "section_dd_groups_parent_id_idx" ON "section_dd_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "section_dd_groups_locales_locale_parent_id_unique" ON "section_dd_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_dd_checks_order_idx" ON "section_dd_checks" USING btree ("_order");
  CREATE INDEX "section_dd_checks_parent_id_idx" ON "section_dd_checks" USING btree ("_parent_id");
  CREATE INDEX "section_dd_checks_checker_idx" ON "section_dd_checks" USING btree ("checker_id");
  CREATE INDEX "section_dd_order_idx" ON "section_dd" USING btree ("_order");
  CREATE INDEX "section_dd_parent_id_idx" ON "section_dd" USING btree ("_parent_id");
  CREATE INDEX "section_dd_path_idx" ON "section_dd" USING btree ("_path");
  CREATE UNIQUE INDEX "section_dd_locales_locale_parent_id_unique" ON "section_dd_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_sections_chapter_idx" ON "guideline_sections" USING btree ("chapter_id");
  CREATE INDEX "guideline_sections_header_image_idx" ON "guideline_sections" USING btree ("header_image_id");
  CREATE INDEX "guideline_sections_updated_at_idx" ON "guideline_sections" USING btree ("updated_at");
  CREATE INDEX "guideline_sections_created_at_idx" ON "guideline_sections" USING btree ("created_at");
  CREATE INDEX "guideline_sections__status_idx" ON "guideline_sections" USING btree ("_status");
  CREATE UNIQUE INDEX "guideline_sections_slug_idx" ON "guideline_sections_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "guideline_sections_locales_locale_parent_id_unique" ON "guideline_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_sections_rels_order_idx" ON "guideline_sections_rels" USING btree ("order");
  CREATE INDEX "guideline_sections_rels_parent_idx" ON "guideline_sections_rels" USING btree ("parent_id");
  CREATE INDEX "guideline_sections_rels_path_idx" ON "guideline_sections_rels" USING btree ("path");
  CREATE INDEX "guideline_sections_rels_brand_colors_id_idx" ON "guideline_sections_rels" USING btree ("brand_colors_id");
  CREATE INDEX "_guideline_sections_v_version_checks_order_idx" ON "_guideline_sections_v_version_checks" USING btree ("_order");
  CREATE INDEX "_guideline_sections_v_version_checks_parent_id_idx" ON "_guideline_sections_v_version_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_sections_v_version_checks_checker_idx" ON "_guideline_sections_v_version_checks" USING btree ("checker_id");
  CREATE INDEX "_section_cu_v_columns_order_idx" ON "_section_cu_v_columns" USING btree ("_order");
  CREATE INDEX "_section_cu_v_columns_parent_id_idx" ON "_section_cu_v_columns" USING btree ("_parent_id");
  CREATE INDEX "_section_cu_v_columns_image_idx" ON "_section_cu_v_columns" USING btree ("image_id");
  CREATE INDEX "_section_cu_v_columns_image_background_color_idx" ON "_section_cu_v_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "_section_cu_v_columns_locales_locale_parent_id_unique" ON "_section_cu_v_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_cu_v_checks_order_idx" ON "_section_cu_v_checks" USING btree ("_order");
  CREATE INDEX "_section_cu_v_checks_parent_id_idx" ON "_section_cu_v_checks" USING btree ("_parent_id");
  CREATE INDEX "_section_cu_v_checks_checker_idx" ON "_section_cu_v_checks" USING btree ("checker_id");
  CREATE INDEX "_section_cu_v_order_idx" ON "_section_cu_v" USING btree ("_order");
  CREATE INDEX "_section_cu_v_parent_id_idx" ON "_section_cu_v" USING btree ("_parent_id");
  CREATE INDEX "_section_cu_v_path_idx" ON "_section_cu_v" USING btree ("_path");
  CREATE INDEX "_section_ms_v_checks_order_idx" ON "_section_ms_v_checks" USING btree ("_order");
  CREATE INDEX "_section_ms_v_checks_parent_id_idx" ON "_section_ms_v_checks" USING btree ("_parent_id");
  CREATE INDEX "_section_ms_v_checks_checker_idx" ON "_section_ms_v_checks" USING btree ("checker_id");
  CREATE INDEX "_section_ms_v_order_idx" ON "_section_ms_v" USING btree ("_order");
  CREATE INDEX "_section_ms_v_parent_id_idx" ON "_section_ms_v" USING btree ("_parent_id");
  CREATE INDEX "_section_ms_v_path_idx" ON "_section_ms_v" USING btree ("_path");
  CREATE INDEX "_section_ms_v_image_idx" ON "_section_ms_v" USING btree ("image_id");
  CREATE INDEX "_section_ms_v_image_background_color_idx" ON "_section_ms_v" USING btree ("image_background_color_id");
  CREATE INDEX "_section_cp_v_checks_order_idx" ON "_section_cp_v_checks" USING btree ("_order");
  CREATE INDEX "_section_cp_v_checks_parent_id_idx" ON "_section_cp_v_checks" USING btree ("_parent_id");
  CREATE INDEX "_section_cp_v_checks_checker_idx" ON "_section_cp_v_checks" USING btree ("checker_id");
  CREATE INDEX "_section_cp_v_order_idx" ON "_section_cp_v" USING btree ("_order");
  CREATE INDEX "_section_cp_v_parent_id_idx" ON "_section_cp_v" USING btree ("_parent_id");
  CREATE INDEX "_section_cp_v_path_idx" ON "_section_cp_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_section_cp_v_locales_locale_parent_id_unique" ON "_section_cp_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_dd_v_groups_examples_order_idx" ON "_section_dd_v_groups_examples" USING btree ("_order");
  CREATE INDEX "_section_dd_v_groups_examples_parent_id_idx" ON "_section_dd_v_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "_section_dd_v_groups_examples_image_idx" ON "_section_dd_v_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "_section_dd_v_groups_examples_locales_locale_parent_id_uniqu" ON "_section_dd_v_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_dd_v_groups_order_idx" ON "_section_dd_v_groups" USING btree ("_order");
  CREATE INDEX "_section_dd_v_groups_parent_id_idx" ON "_section_dd_v_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_section_dd_v_groups_locales_locale_parent_id_unique" ON "_section_dd_v_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_dd_v_checks_order_idx" ON "_section_dd_v_checks" USING btree ("_order");
  CREATE INDEX "_section_dd_v_checks_parent_id_idx" ON "_section_dd_v_checks" USING btree ("_parent_id");
  CREATE INDEX "_section_dd_v_checks_checker_idx" ON "_section_dd_v_checks" USING btree ("checker_id");
  CREATE INDEX "_section_dd_v_order_idx" ON "_section_dd_v" USING btree ("_order");
  CREATE INDEX "_section_dd_v_parent_id_idx" ON "_section_dd_v" USING btree ("_parent_id");
  CREATE INDEX "_section_dd_v_path_idx" ON "_section_dd_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_section_dd_v_locales_locale_parent_id_unique" ON "_section_dd_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_sections_v_parent_idx" ON "_guideline_sections_v" USING btree ("parent_id");
  CREATE INDEX "_guideline_sections_v_version_version_chapter_idx" ON "_guideline_sections_v" USING btree ("version_chapter_id");
  CREATE INDEX "_guideline_sections_v_version_version_header_image_idx" ON "_guideline_sections_v" USING btree ("version_header_image_id");
  CREATE INDEX "_guideline_sections_v_version_version_updated_at_idx" ON "_guideline_sections_v" USING btree ("version_updated_at");
  CREATE INDEX "_guideline_sections_v_version_version_created_at_idx" ON "_guideline_sections_v" USING btree ("version_created_at");
  CREATE INDEX "_guideline_sections_v_version_version__status_idx" ON "_guideline_sections_v" USING btree ("version__status");
  CREATE INDEX "_guideline_sections_v_created_at_idx" ON "_guideline_sections_v" USING btree ("created_at");
  CREATE INDEX "_guideline_sections_v_updated_at_idx" ON "_guideline_sections_v" USING btree ("updated_at");
  CREATE INDEX "_guideline_sections_v_snapshot_idx" ON "_guideline_sections_v" USING btree ("snapshot");
  CREATE INDEX "_guideline_sections_v_published_locale_idx" ON "_guideline_sections_v" USING btree ("published_locale");
  CREATE INDEX "_guideline_sections_v_latest_idx" ON "_guideline_sections_v" USING btree ("latest");
  CREATE INDEX "_guideline_sections_v_version_version_slug_idx" ON "_guideline_sections_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_guideline_sections_v_locales_locale_parent_id_unique" ON "_guideline_sections_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_sections_v_rels_order_idx" ON "_guideline_sections_v_rels" USING btree ("order");
  CREATE INDEX "_guideline_sections_v_rels_parent_idx" ON "_guideline_sections_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guideline_sections_v_rels_path_idx" ON "_guideline_sections_v_rels" USING btree ("path");
  CREATE INDEX "_guideline_sections_v_rels_brand_colors_id_idx" ON "_guideline_sections_v_rels" USING btree ("brand_colors_id");
  CREATE INDEX "guideline_pages_checks_order_idx" ON "guideline_pages_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_checks_parent_id_idx" ON "guideline_pages_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_checks_checker_idx" ON "guideline_pages_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_columns_order_idx" ON "guideline_pages_blocks_column_unit_columns" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_column_unit_columns_parent_id_idx" ON "guideline_pages_blocks_column_unit_columns" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_columns_image_idx" ON "guideline_pages_blocks_column_unit_columns" USING btree ("image_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_columns_image_backgro_idx" ON "guideline_pages_blocks_column_unit_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "guideline_pages_blocks_column_unit_columns_locales_locale_pa" ON "guideline_pages_blocks_column_unit_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_checks_order_idx" ON "guideline_pages_blocks_column_unit_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_column_unit_checks_parent_id_idx" ON "guideline_pages_blocks_column_unit_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_checks_checker_idx" ON "guideline_pages_blocks_column_unit_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_order_idx" ON "guideline_pages_blocks_column_unit" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_column_unit_parent_id_idx" ON "guideline_pages_blocks_column_unit" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_path_idx" ON "guideline_pages_blocks_column_unit" USING btree ("_path");
  CREATE INDEX "guideline_pages_blocks_media_showcase_checks_order_idx" ON "guideline_pages_blocks_media_showcase_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_media_showcase_checks_parent_id_idx" ON "guideline_pages_blocks_media_showcase_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_media_showcase_checks_checker_idx" ON "guideline_pages_blocks_media_showcase_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_blocks_media_showcase_order_idx" ON "guideline_pages_blocks_media_showcase" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_media_showcase_parent_id_idx" ON "guideline_pages_blocks_media_showcase" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_media_showcase_path_idx" ON "guideline_pages_blocks_media_showcase" USING btree ("_path");
  CREATE INDEX "guideline_pages_blocks_media_showcase_image_idx" ON "guideline_pages_blocks_media_showcase" USING btree ("image_id");
  CREATE INDEX "guideline_pages_blocks_media_showcase_image_background_c_idx" ON "guideline_pages_blocks_media_showcase" USING btree ("image_background_color_id");
  CREATE INDEX "guideline_pages_blocks_color_palette_checks_order_idx" ON "guideline_pages_blocks_color_palette_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_color_palette_checks_parent_id_idx" ON "guideline_pages_blocks_color_palette_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_color_palette_checks_checker_idx" ON "guideline_pages_blocks_color_palette_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_blocks_color_palette_order_idx" ON "guideline_pages_blocks_color_palette" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_color_palette_parent_id_idx" ON "guideline_pages_blocks_color_palette" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_color_palette_path_idx" ON "guideline_pages_blocks_color_palette" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_pages_blocks_color_palette_locales_locale_parent_i" ON "guideline_pages_blocks_color_palette_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_examples_order_idx" ON "guideline_pages_blocks_do_dont_groups_examples" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_examples_parent_id_idx" ON "guideline_pages_blocks_do_dont_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_examples_image_idx" ON "guideline_pages_blocks_do_dont_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "guideline_pages_blocks_do_dont_groups_examples_locales_local" ON "guideline_pages_blocks_do_dont_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_order_idx" ON "guideline_pages_blocks_do_dont_groups" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_parent_id_idx" ON "guideline_pages_blocks_do_dont_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_pages_blocks_do_dont_groups_locales_locale_parent_" ON "guideline_pages_blocks_do_dont_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_checks_order_idx" ON "guideline_pages_blocks_do_dont_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_do_dont_checks_parent_id_idx" ON "guideline_pages_blocks_do_dont_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_checks_checker_idx" ON "guideline_pages_blocks_do_dont_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_order_idx" ON "guideline_pages_blocks_do_dont" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_do_dont_parent_id_idx" ON "guideline_pages_blocks_do_dont" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_path_idx" ON "guideline_pages_blocks_do_dont" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_pages_blocks_do_dont_locales_locale_parent_id_uniq" ON "guideline_pages_blocks_do_dont_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_pages_section_idx" ON "guideline_pages" USING btree ("section_id");
  CREATE INDEX "guideline_pages_updated_at_idx" ON "guideline_pages" USING btree ("updated_at");
  CREATE INDEX "guideline_pages_created_at_idx" ON "guideline_pages" USING btree ("created_at");
  CREATE INDEX "guideline_pages__status_idx" ON "guideline_pages" USING btree ("_status");
  CREATE UNIQUE INDEX "guideline_pages_slug_idx" ON "guideline_pages_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "guideline_pages_locales_locale_parent_id_unique" ON "guideline_pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_pages_rels_order_idx" ON "guideline_pages_rels" USING btree ("order");
  CREATE INDEX "guideline_pages_rels_parent_idx" ON "guideline_pages_rels" USING btree ("parent_id");
  CREATE INDEX "guideline_pages_rels_path_idx" ON "guideline_pages_rels" USING btree ("path");
  CREATE INDEX "guideline_pages_rels_brand_colors_id_idx" ON "guideline_pages_rels" USING btree ("brand_colors_id");
  CREATE INDEX "_guideline_pages_v_version_checks_order_idx" ON "_guideline_pages_v_version_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_version_checks_parent_id_idx" ON "_guideline_pages_v_version_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_version_checks_checker_idx" ON "_guideline_pages_v_version_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_columns_order_idx" ON "_guideline_pages_v_blocks_column_unit_columns" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_columns_parent_id_idx" ON "_guideline_pages_v_blocks_column_unit_columns" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_columns_image_idx" ON "_guideline_pages_v_blocks_column_unit_columns" USING btree ("image_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_columns_image_back_idx" ON "_guideline_pages_v_blocks_column_unit_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_column_unit_columns_locales_locale" ON "_guideline_pages_v_blocks_column_unit_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_checks_order_idx" ON "_guideline_pages_v_blocks_column_unit_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_checks_parent_id_idx" ON "_guideline_pages_v_blocks_column_unit_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_checks_checker_idx" ON "_guideline_pages_v_blocks_column_unit_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_order_idx" ON "_guideline_pages_v_blocks_column_unit" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_parent_id_idx" ON "_guideline_pages_v_blocks_column_unit" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_path_idx" ON "_guideline_pages_v_blocks_column_unit" USING btree ("_path");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_checks_order_idx" ON "_guideline_pages_v_blocks_media_showcase_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_checks_parent_id_idx" ON "_guideline_pages_v_blocks_media_showcase_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_checks_checker_idx" ON "_guideline_pages_v_blocks_media_showcase_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_order_idx" ON "_guideline_pages_v_blocks_media_showcase" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_parent_id_idx" ON "_guideline_pages_v_blocks_media_showcase" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_path_idx" ON "_guideline_pages_v_blocks_media_showcase" USING btree ("_path");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_image_idx" ON "_guideline_pages_v_blocks_media_showcase" USING btree ("image_id");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_image_backgroun_idx" ON "_guideline_pages_v_blocks_media_showcase" USING btree ("image_background_color_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_checks_order_idx" ON "_guideline_pages_v_blocks_color_palette_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_checks_parent_id_idx" ON "_guideline_pages_v_blocks_color_palette_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_checks_checker_idx" ON "_guideline_pages_v_blocks_color_palette_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_order_idx" ON "_guideline_pages_v_blocks_color_palette" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_parent_id_idx" ON "_guideline_pages_v_blocks_color_palette" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_path_idx" ON "_guideline_pages_v_blocks_color_palette" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_color_palette_locales_locale_paren" ON "_guideline_pages_v_blocks_color_palette_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_examples_order_idx" ON "_guideline_pages_v_blocks_do_dont_groups_examples" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_examples_parent_id_idx" ON "_guideline_pages_v_blocks_do_dont_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_examples_image_idx" ON "_guideline_pages_v_blocks_do_dont_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_do_dont_groups_examples_locales_lo" ON "_guideline_pages_v_blocks_do_dont_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_order_idx" ON "_guideline_pages_v_blocks_do_dont_groups" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_parent_id_idx" ON "_guideline_pages_v_blocks_do_dont_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_do_dont_groups_locales_locale_pare" ON "_guideline_pages_v_blocks_do_dont_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_checks_order_idx" ON "_guideline_pages_v_blocks_do_dont_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_checks_parent_id_idx" ON "_guideline_pages_v_blocks_do_dont_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_checks_checker_idx" ON "_guideline_pages_v_blocks_do_dont_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_order_idx" ON "_guideline_pages_v_blocks_do_dont" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_parent_id_idx" ON "_guideline_pages_v_blocks_do_dont" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_path_idx" ON "_guideline_pages_v_blocks_do_dont" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_do_dont_locales_locale_parent_id_u" ON "_guideline_pages_v_blocks_do_dont_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_parent_idx" ON "_guideline_pages_v" USING btree ("parent_id");
  CREATE INDEX "_guideline_pages_v_version_version_section_idx" ON "_guideline_pages_v" USING btree ("version_section_id");
  CREATE INDEX "_guideline_pages_v_version_version_updated_at_idx" ON "_guideline_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_guideline_pages_v_version_version_created_at_idx" ON "_guideline_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_guideline_pages_v_version_version__status_idx" ON "_guideline_pages_v" USING btree ("version__status");
  CREATE INDEX "_guideline_pages_v_created_at_idx" ON "_guideline_pages_v" USING btree ("created_at");
  CREATE INDEX "_guideline_pages_v_updated_at_idx" ON "_guideline_pages_v" USING btree ("updated_at");
  CREATE INDEX "_guideline_pages_v_snapshot_idx" ON "_guideline_pages_v" USING btree ("snapshot");
  CREATE INDEX "_guideline_pages_v_published_locale_idx" ON "_guideline_pages_v" USING btree ("published_locale");
  CREATE INDEX "_guideline_pages_v_latest_idx" ON "_guideline_pages_v" USING btree ("latest");
  CREATE INDEX "_guideline_pages_v_version_version_slug_idx" ON "_guideline_pages_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_guideline_pages_v_locales_locale_parent_id_unique" ON "_guideline_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_rels_order_idx" ON "_guideline_pages_v_rels" USING btree ("order");
  CREATE INDEX "_guideline_pages_v_rels_parent_idx" ON "_guideline_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guideline_pages_v_rels_path_idx" ON "_guideline_pages_v_rels" USING btree ("path");
  CREATE INDEX "_guideline_pages_v_rels_brand_colors_id_idx" ON "_guideline_pages_v_rels" USING btree ("brand_colors_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guideline_chapters_fk" FOREIGN KEY ("guideline_chapters_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guideline_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guideline_pages_fk" FOREIGN KEY ("guideline_pages_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_guideline_chapters_id_idx" ON "payload_locked_documents_rels" USING btree ("guideline_chapters_id");
  CREATE INDEX "payload_locked_documents_rels_guideline_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("guideline_sections_id");
  CREATE INDEX "payload_locked_documents_rels_guideline_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("guideline_pages_id");`)
}
