import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_docs_blocks_column_unit_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_guideline_docs_blocks_column_unit_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_blocks_column_unit_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_docs_blocks_media_showcase_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_blocks_media_showcase_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_docs_blocks_media_showcase_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_guideline_docs_blocks_color_palette_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_blocks_color_palette_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_docs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_docs_v_version_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_version_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_column_unit_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_column_unit_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_column_unit_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_color_palette_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_color_palette_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_docs_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "guideline_docs_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_docs_checks_tier",
	"executor" "enum_guideline_docs_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_docs_blocks_column_unit_columns" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum_guideline_docs_blocks_column_unit_columns_image_scale" DEFAULT '100'
  );

  CREATE TABLE "guideline_docs_blocks_column_unit_columns_locales" (
	"heading" varchar,
	"body" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_docs_blocks_column_unit_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_docs_blocks_column_unit_checks_tier",
	"executor" "enum_guideline_docs_blocks_column_unit_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_docs_blocks_column_unit" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "guideline_docs_blocks_media_showcase_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_docs_blocks_media_showcase_checks_tier",
	"executor" "enum_guideline_docs_blocks_media_showcase_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_docs_blocks_media_showcase" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum_guideline_docs_blocks_media_showcase_image_scale" DEFAULT '100',
	"block_name" varchar
  );

  CREATE TABLE "guideline_docs_blocks_color_palette_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_docs_blocks_color_palette_checks_tier",
	"executor" "enum_guideline_docs_blocks_color_palette_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_docs_blocks_color_palette" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "guideline_docs_blocks_color_palette_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_docs_blocks_do_dont_groups_examples" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"kind" "enum_guideline_docs_blocks_do_dont_groups_examples_kind" DEFAULT 'dont',
	"image_id" integer
  );

  CREATE TABLE "guideline_docs_blocks_do_dont_groups_examples_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_docs_blocks_do_dont_groups" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "guideline_docs_blocks_do_dont_groups_locales" (
	"category" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_docs_blocks_do_dont_checks" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum_guideline_docs_blocks_do_dont_checks_tier",
	"executor" "enum_guideline_docs_blocks_do_dont_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar
  );

  CREATE TABLE "guideline_docs_blocks_do_dont" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE "guideline_docs_blocks_do_dont_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_docs_breadcrumbs" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"doc_id" integer,
	"url" varchar,
	"label" varchar
  );

  CREATE TABLE "guideline_docs" (
	"id" serial PRIMARY KEY NOT NULL,
	"header_image_id" integer,
	"display_order" numeric DEFAULT 0,
	"parent_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_guideline_docs_status" DEFAULT 'draft'
  );

  CREATE TABLE "guideline_docs_locales" (
	"title" varchar,
	"label" varchar,
	"generate_slug" boolean DEFAULT true,
	"slug" varchar,
	"description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "guideline_docs_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"brand_colors_id" integer
  );

  CREATE TABLE "_guideline_docs_v_version_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_docs_v_version_checks_tier",
	"executor" "enum__guideline_docs_v_version_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_column_unit_columns" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum__guideline_docs_v_blocks_column_unit_columns_image_scale" DEFAULT '100',
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_column_unit_columns_locales" (
	"heading" varchar,
	"body" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_docs_v_blocks_column_unit_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_docs_v_blocks_column_unit_checks_tier",
	"executor" "enum__guideline_docs_v_blocks_column_unit_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_column_unit" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_media_showcase_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_docs_v_blocks_media_showcase_checks_tier",
	"executor" "enum__guideline_docs_v_blocks_media_showcase_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_media_showcase" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum__guideline_docs_v_blocks_media_showcase_image_scale" DEFAULT '100',
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_color_palette_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_docs_v_blocks_color_palette_checks_tier",
	"executor" "enum__guideline_docs_v_blocks_color_palette_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_color_palette" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_color_palette_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "enum__guideline_docs_v_blocks_do_dont_groups_examples_kind" DEFAULT 'dont',
	"image_id" integer,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_do_dont_groups_examples_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_docs_v_blocks_do_dont_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" (
	"category" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_docs_v_blocks_do_dont_checks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"title_ko" varchar,
	"key" varchar,
	"tier" "enum__guideline_docs_v_blocks_do_dont_checks_tier",
	"executor" "enum__guideline_docs_v_blocks_do_dont_checks_executor" DEFAULT 'deterministic',
	"checker_id" integer,
	"options" jsonb,
	"heuristic_prompt" varchar,
	"messages_pass" varchar,
	"messages_ok" varchar,
	"messages_needs_review" varchar,
	"messages_fail" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_do_dont" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_do_dont_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_docs_v_version_breadcrumbs" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"doc_id" integer,
	"url" varchar,
	"label" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_header_image_id" integer,
	"version_display_order" numeric DEFAULT 0,
	"version_parent_id" integer,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__guideline_docs_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__guideline_docs_v_published_locale",
	"latest" boolean
  );

  CREATE TABLE "_guideline_docs_v_locales" (
	"version_title" varchar,
	"version_label" varchar,
	"version_generate_slug" boolean DEFAULT true,
	"version_slug" varchar,
	"version_description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_docs_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"brand_colors_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guideline_docs_id" integer;
  ALTER TABLE "guideline_docs_checks" ADD CONSTRAINT "guideline_docs_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_checks" ADD CONSTRAINT "guideline_docs_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_columns" ADD CONSTRAINT "guideline_docs_blocks_column_unit_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_columns" ADD CONSTRAINT "guideline_docs_blocks_column_unit_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_columns" ADD CONSTRAINT "guideline_docs_blocks_column_unit_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_columns_locales" ADD CONSTRAINT "guideline_docs_blocks_column_unit_columns_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_column_unit_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks" ADD CONSTRAINT "guideline_docs_blocks_column_unit_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks" ADD CONSTRAINT "guideline_docs_blocks_column_unit_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit" ADD CONSTRAINT "guideline_docs_blocks_column_unit_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks" ADD CONSTRAINT "guideline_docs_blocks_color_palette_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks" ADD CONSTRAINT "guideline_docs_blocks_color_palette_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_palette" ADD CONSTRAINT "guideline_docs_blocks_color_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_palette_locales" ADD CONSTRAINT "guideline_docs_blocks_color_palette_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples_locales" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_examples_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_locales" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks" ADD CONSTRAINT "guideline_docs_blocks_do_dont_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks" ADD CONSTRAINT "guideline_docs_blocks_do_dont_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont" ADD CONSTRAINT "guideline_docs_blocks_do_dont_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_locales" ADD CONSTRAINT "guideline_docs_blocks_do_dont_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_breadcrumbs" ADD CONSTRAINT "guideline_docs_breadcrumbs_doc_id_guideline_docs_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."guideline_docs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_breadcrumbs" ADD CONSTRAINT "guideline_docs_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs" ADD CONSTRAINT "guideline_docs_header_image_id_application_images_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs" ADD CONSTRAINT "guideline_docs_parent_id_guideline_docs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_locales" ADD CONSTRAINT "guideline_docs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_rels" ADD CONSTRAINT "guideline_docs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_rels" ADD CONSTRAINT "guideline_docs_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_version_checks" ADD CONSTRAINT "_guideline_docs_v_version_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_version_checks" ADD CONSTRAINT "_guideline_docs_v_version_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_column_unit_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_examples_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_version_breadcrumbs" ADD CONSTRAINT "_guideline_docs_v_version_breadcrumbs_doc_id_guideline_docs_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."guideline_docs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_version_breadcrumbs" ADD CONSTRAINT "_guideline_docs_v_version_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v" ADD CONSTRAINT "_guideline_docs_v_parent_id_guideline_docs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v" ADD CONSTRAINT "_guideline_docs_v_version_header_image_id_application_images_id_fk" FOREIGN KEY ("version_header_image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v" ADD CONSTRAINT "_guideline_docs_v_version_parent_id_guideline_docs_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_locales" ADD CONSTRAINT "_guideline_docs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_rels" ADD CONSTRAINT "_guideline_docs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_rels" ADD CONSTRAINT "_guideline_docs_v_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_checks_order_idx" ON "guideline_docs_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_checks_parent_id_idx" ON "guideline_docs_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_checks_checker_idx" ON "guideline_docs_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_columns_order_idx" ON "guideline_docs_blocks_column_unit_columns" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_column_unit_columns_parent_id_idx" ON "guideline_docs_blocks_column_unit_columns" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_columns_image_idx" ON "guideline_docs_blocks_column_unit_columns" USING btree ("image_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_columns_image_backgrou_idx" ON "guideline_docs_blocks_column_unit_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_column_unit_columns_locales_locale_par" ON "guideline_docs_blocks_column_unit_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_checks_order_idx" ON "guideline_docs_blocks_column_unit_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_column_unit_checks_parent_id_idx" ON "guideline_docs_blocks_column_unit_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_checks_checker_idx" ON "guideline_docs_blocks_column_unit_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_order_idx" ON "guideline_docs_blocks_column_unit" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_column_unit_parent_id_idx" ON "guideline_docs_blocks_column_unit" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_path_idx" ON "guideline_docs_blocks_column_unit" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_media_showcase_checks_order_idx" ON "guideline_docs_blocks_media_showcase_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_media_showcase_checks_parent_id_idx" ON "guideline_docs_blocks_media_showcase_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_checks_checker_idx" ON "guideline_docs_blocks_media_showcase_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_order_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_media_showcase_parent_id_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_path_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_media_showcase_image_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("image_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_image_background_co_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("image_background_color_id");
  CREATE INDEX "guideline_docs_blocks_color_palette_checks_order_idx" ON "guideline_docs_blocks_color_palette_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_color_palette_checks_parent_id_idx" ON "guideline_docs_blocks_color_palette_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_color_palette_checks_checker_idx" ON "guideline_docs_blocks_color_palette_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_docs_blocks_color_palette_order_idx" ON "guideline_docs_blocks_color_palette" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_color_palette_parent_id_idx" ON "guideline_docs_blocks_color_palette" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_color_palette_path_idx" ON "guideline_docs_blocks_color_palette" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_color_palette_locales_locale_parent_id" ON "guideline_docs_blocks_color_palette_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_examples_order_idx" ON "guideline_docs_blocks_do_dont_groups_examples" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_examples_parent_id_idx" ON "guideline_docs_blocks_do_dont_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_examples_image_idx" ON "guideline_docs_blocks_do_dont_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_do_dont_groups_examples_locales_locale" ON "guideline_docs_blocks_do_dont_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_order_idx" ON "guideline_docs_blocks_do_dont_groups" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_parent_id_idx" ON "guideline_docs_blocks_do_dont_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_do_dont_groups_locales_locale_parent_i" ON "guideline_docs_blocks_do_dont_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_checks_order_idx" ON "guideline_docs_blocks_do_dont_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_do_dont_checks_parent_id_idx" ON "guideline_docs_blocks_do_dont_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_checks_checker_idx" ON "guideline_docs_blocks_do_dont_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_order_idx" ON "guideline_docs_blocks_do_dont" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_do_dont_parent_id_idx" ON "guideline_docs_blocks_do_dont" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_path_idx" ON "guideline_docs_blocks_do_dont" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_do_dont_locales_locale_parent_id_uniqu" ON "guideline_docs_blocks_do_dont_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_breadcrumbs_order_idx" ON "guideline_docs_breadcrumbs" USING btree ("_order");
  CREATE INDEX "guideline_docs_breadcrumbs_parent_id_idx" ON "guideline_docs_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_breadcrumbs_locale_idx" ON "guideline_docs_breadcrumbs" USING btree ("_locale");
  CREATE INDEX "guideline_docs_breadcrumbs_doc_idx" ON "guideline_docs_breadcrumbs" USING btree ("doc_id");
  CREATE INDEX "guideline_docs_header_image_idx" ON "guideline_docs" USING btree ("header_image_id");
  CREATE INDEX "guideline_docs_parent_idx" ON "guideline_docs" USING btree ("parent_id");
  CREATE INDEX "guideline_docs_updated_at_idx" ON "guideline_docs" USING btree ("updated_at");
  CREATE INDEX "guideline_docs_created_at_idx" ON "guideline_docs" USING btree ("created_at");
  CREATE INDEX "guideline_docs__status_idx" ON "guideline_docs" USING btree ("_status");
  CREATE UNIQUE INDEX "guideline_docs_slug_idx" ON "guideline_docs_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "guideline_docs_locales_locale_parent_id_unique" ON "guideline_docs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_rels_order_idx" ON "guideline_docs_rels" USING btree ("order");
  CREATE INDEX "guideline_docs_rels_parent_idx" ON "guideline_docs_rels" USING btree ("parent_id");
  CREATE INDEX "guideline_docs_rels_path_idx" ON "guideline_docs_rels" USING btree ("path");
  CREATE INDEX "guideline_docs_rels_brand_colors_id_idx" ON "guideline_docs_rels" USING btree ("brand_colors_id");
  CREATE INDEX "_guideline_docs_v_version_checks_order_idx" ON "_guideline_docs_v_version_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_version_checks_parent_id_idx" ON "_guideline_docs_v_version_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_version_checks_checker_idx" ON "_guideline_docs_v_version_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_columns_order_idx" ON "_guideline_docs_v_blocks_column_unit_columns" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_columns_parent_id_idx" ON "_guideline_docs_v_blocks_column_unit_columns" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_columns_image_idx" ON "_guideline_docs_v_blocks_column_unit_columns" USING btree ("image_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_columns_image_backg_idx" ON "_guideline_docs_v_blocks_column_unit_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_column_unit_columns_locales_locale_" ON "_guideline_docs_v_blocks_column_unit_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_checks_order_idx" ON "_guideline_docs_v_blocks_column_unit_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_checks_parent_id_idx" ON "_guideline_docs_v_blocks_column_unit_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_checks_checker_idx" ON "_guideline_docs_v_blocks_column_unit_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_order_idx" ON "_guideline_docs_v_blocks_column_unit" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_parent_id_idx" ON "_guideline_docs_v_blocks_column_unit" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_path_idx" ON "_guideline_docs_v_blocks_column_unit" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_checks_order_idx" ON "_guideline_docs_v_blocks_media_showcase_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_checks_parent_id_idx" ON "_guideline_docs_v_blocks_media_showcase_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_checks_checker_idx" ON "_guideline_docs_v_blocks_media_showcase_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_order_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_parent_id_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_path_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_image_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("image_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_image_background_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("image_background_color_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_checks_order_idx" ON "_guideline_docs_v_blocks_color_palette_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_checks_parent_id_idx" ON "_guideline_docs_v_blocks_color_palette_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_checks_checker_idx" ON "_guideline_docs_v_blocks_color_palette_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_order_idx" ON "_guideline_docs_v_blocks_color_palette" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_parent_id_idx" ON "_guideline_docs_v_blocks_color_palette" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_path_idx" ON "_guideline_docs_v_blocks_color_palette" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_color_palette_locales_locale_parent" ON "_guideline_docs_v_blocks_color_palette_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_examples_order_idx" ON "_guideline_docs_v_blocks_do_dont_groups_examples" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_examples_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_examples_image_idx" ON "_guideline_docs_v_blocks_do_dont_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_do_dont_groups_examples_locales_loc" ON "_guideline_docs_v_blocks_do_dont_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_order_idx" ON "_guideline_docs_v_blocks_do_dont_groups" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_do_dont_groups_locales_locale_paren" ON "_guideline_docs_v_blocks_do_dont_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_checks_order_idx" ON "_guideline_docs_v_blocks_do_dont_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_checks_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_checks_checker_idx" ON "_guideline_docs_v_blocks_do_dont_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_order_idx" ON "_guideline_docs_v_blocks_do_dont" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_path_idx" ON "_guideline_docs_v_blocks_do_dont" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_do_dont_locales_locale_parent_id_un" ON "_guideline_docs_v_blocks_do_dont_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_version_breadcrumbs_order_idx" ON "_guideline_docs_v_version_breadcrumbs" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_version_breadcrumbs_parent_id_idx" ON "_guideline_docs_v_version_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_version_breadcrumbs_locale_idx" ON "_guideline_docs_v_version_breadcrumbs" USING btree ("_locale");
  CREATE INDEX "_guideline_docs_v_version_breadcrumbs_doc_idx" ON "_guideline_docs_v_version_breadcrumbs" USING btree ("doc_id");
  CREATE INDEX "_guideline_docs_v_parent_idx" ON "_guideline_docs_v" USING btree ("parent_id");
  CREATE INDEX "_guideline_docs_v_version_version_header_image_idx" ON "_guideline_docs_v" USING btree ("version_header_image_id");
  CREATE INDEX "_guideline_docs_v_version_version_parent_idx" ON "_guideline_docs_v" USING btree ("version_parent_id");
  CREATE INDEX "_guideline_docs_v_version_version_updated_at_idx" ON "_guideline_docs_v" USING btree ("version_updated_at");
  CREATE INDEX "_guideline_docs_v_version_version_created_at_idx" ON "_guideline_docs_v" USING btree ("version_created_at");
  CREATE INDEX "_guideline_docs_v_version_version__status_idx" ON "_guideline_docs_v" USING btree ("version__status");
  CREATE INDEX "_guideline_docs_v_created_at_idx" ON "_guideline_docs_v" USING btree ("created_at");
  CREATE INDEX "_guideline_docs_v_updated_at_idx" ON "_guideline_docs_v" USING btree ("updated_at");
  CREATE INDEX "_guideline_docs_v_snapshot_idx" ON "_guideline_docs_v" USING btree ("snapshot");
  CREATE INDEX "_guideline_docs_v_published_locale_idx" ON "_guideline_docs_v" USING btree ("published_locale");
  CREATE INDEX "_guideline_docs_v_latest_idx" ON "_guideline_docs_v" USING btree ("latest");
  CREATE INDEX "_guideline_docs_v_version_version_slug_idx" ON "_guideline_docs_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_guideline_docs_v_locales_locale_parent_id_unique" ON "_guideline_docs_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_rels_order_idx" ON "_guideline_docs_v_rels" USING btree ("order");
  CREATE INDEX "_guideline_docs_v_rels_parent_idx" ON "_guideline_docs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guideline_docs_v_rels_path_idx" ON "_guideline_docs_v_rels" USING btree ("path");
  CREATE INDEX "_guideline_docs_v_rels_brand_colors_id_idx" ON "_guideline_docs_v_rels" USING btree ("brand_colors_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guideline_documents_fk" FOREIGN KEY ("guideline_docs_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_guideline_docs_id_idx" ON "payload_locked_documents_rels" USING btree ("guideline_docs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_column_unit_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_column_unit_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_column_unit" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_media_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_palette" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_palette_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_breadcrumbs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_version_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_version_breadcrumbs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_docs_checks" CASCADE;
  DROP TABLE "guideline_docs_blocks_column_unit_columns" CASCADE;
  DROP TABLE "guideline_docs_blocks_column_unit_columns_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_column_unit_checks" CASCADE;
  DROP TABLE "guideline_docs_blocks_column_unit" CASCADE;
  DROP TABLE "guideline_docs_blocks_media_showcase_checks" CASCADE;
  DROP TABLE "guideline_docs_blocks_media_showcase" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_palette_checks" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_palette" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_palette_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_groups_examples" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_groups_examples_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_groups" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_groups_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_checks" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_locales" CASCADE;
  DROP TABLE "guideline_docs_breadcrumbs" CASCADE;
  DROP TABLE "guideline_docs" CASCADE;
  DROP TABLE "guideline_docs_locales" CASCADE;
  DROP TABLE "guideline_docs_rels" CASCADE;
  DROP TABLE "_guideline_docs_v_version_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_column_unit_columns" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_column_unit_columns_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_column_unit_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_column_unit" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_media_showcase_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_media_showcase" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_palette_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_palette" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_palette_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_groups_examples_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_groups" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_version_breadcrumbs" CASCADE;
  DROP TABLE "_guideline_docs_v" CASCADE;
  DROP TABLE "_guideline_docs_v_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guideline_documents_fk";

  DROP INDEX "payload_locked_documents_rels_guideline_docs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guideline_docs_id";
  DROP TYPE "public"."enum_guideline_docs_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_checks_executor";
  DROP TYPE "public"."enum_guideline_docs_blocks_column_unit_columns_image_scale";
  DROP TYPE "public"."enum_guideline_docs_blocks_column_unit_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_blocks_column_unit_checks_executor";
  DROP TYPE "public"."enum_guideline_docs_blocks_media_showcase_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_blocks_media_showcase_checks_executor";
  DROP TYPE "public"."enum_guideline_docs_blocks_media_showcase_image_scale";
  DROP TYPE "public"."enum_guideline_docs_blocks_color_palette_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_blocks_color_palette_checks_executor";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_groups_examples_kind";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_checks_executor";
  DROP TYPE "public"."enum_guideline_docs_status";
  DROP TYPE "public"."enum__guideline_docs_v_version_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_version_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_column_unit_columns_image_scale";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_column_unit_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_column_unit_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_image_scale";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_color_palette_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_color_palette_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_groups_examples_kind";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_version_status";
  DROP TYPE "public"."enum__guideline_docs_v_published_locale";`)
}
