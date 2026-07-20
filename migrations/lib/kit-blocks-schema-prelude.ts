// 20260714_031500 백필이 Local API를 호출하기 전에, 현재 config가 조회하는 kit 블록 스키마
// (contentColumns 개명 결과 + 20260718_063009까지의 신규 블록)를 미리 만든다.
// 모든 구문이 멱등이라 최신 스키마가 이미 있는 DB에서는 no-op이다. 실데이터가 있는 운영 DB는
// 이 프렐류드가 아니라 후속 rename 마이그레이션으로 스키마를 얻는다(그 시점엔 031500이 이미 적용됨).
export const kitBlocksPreludeSql = `
	DO $$ BEGIN
		CREATE TYPE "public"."enum_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		CREATE TYPE "public"."enum_guideline_docs_blocks_content_columns_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		CREATE TYPE "public"."enum_guideline_docs_blocks_carousel_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		CREATE TYPE "public"."enum_guideline_docs_blocks_callout_kind" AS ENUM('must', 'recommended', 'dont');
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		CREATE TYPE "public"."enum__guideline_docs_v_blocks_content_columns_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		CREATE TYPE "public"."enum__guideline_docs_v_blocks_carousel_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		CREATE TYPE "public"."enum__guideline_docs_v_blocks_callout_kind" AS ENUM('must', 'recommended', 'dont');
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_example_columns" AS ENUM('2', '3', '4');
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_example_columns" AS ENUM('2', '3', '4');
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	ALTER TABLE "guideline_docs_blocks_do_dont" ADD COLUMN IF NOT EXISTS "example_columns" "enum_guideline_docs_blocks_do_dont_example_columns" DEFAULT '3';
	ALTER TABLE "_guideline_docs_v_blocks_do_dont" ADD COLUMN IF NOT EXISTS "example_columns" "enum__guideline_docs_v_blocks_do_dont_example_columns" DEFAULT '3';
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_content_columns_columns" (
		"_order" integer NOT NULL,
		"_parent_id" varchar NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"image_id" integer,
		"image_background_color_id" integer,
		"image_scale" "enum_image_scale" DEFAULT '100'
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_content_columns_columns_locales" (
		"heading" varchar,
		"body" jsonb,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_content_columns" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"image_ratio" "enum_guideline_docs_blocks_content_columns_image_ratio" DEFAULT '4:3',
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_media_showcase_images" (
		"_order" integer NOT NULL,
		"_parent_id" varchar NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"image_id" integer,
		"image_background_color_id" integer,
		"image_scale" "enum_image_scale" DEFAULT '100'
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_carousel_slides" (
		"_order" integer NOT NULL,
		"_parent_id" varchar NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"image_id" integer
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_carousel_slides_locales" (
		"caption" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_carousel" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"image_ratio" "enum_guideline_docs_blocks_carousel_image_ratio" DEFAULT '16:9',
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_callout_items" (
		"_order" integer NOT NULL,
		"_parent_id" varchar NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_callout_items_locales" (
		"text" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_callout" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"kind" "enum_guideline_docs_blocks_callout_kind" DEFAULT 'must',
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_callout_locales" (
		"title" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_spec_list_groups_specs" (
		"_order" integer NOT NULL,
		"_parent_id" varchar NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"key" varchar,
		"value" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_spec_list_groups" (
		"_order" integer NOT NULL,
		"_parent_id" varchar NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_spec_list_groups_locales" (
		"label" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_spec_list" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_signature_showcase_signatures" (
		"_order" integer NOT NULL,
		"_parent_id" varchar NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"phrase" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_signature_showcase_signatures_locales" (
		"label" varchar,
		"note" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_signature_showcase" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_type_specimen" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"typeface_id" integer,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_type_specimen_locales" (
		"samples_word" varchar,
		"samples_sentence" varchar,
		"samples_paragraph" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_type_scale_items" (
		"_order" integer NOT NULL,
		"_parent_id" varchar NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"name" varchar,
		"size_px" numeric,
		"line_height_px" numeric,
		"weight" numeric
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_type_scale_items_locales" (
		"sample" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_type_scale" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"typeface_id" integer,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_layout_grid_variants" (
		"_order" integer NOT NULL,
		"_parent_id" varchar NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"columns" numeric,
		"gutter" varchar,
		"margin" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_layout_grid_variants_locales" (
		"label" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_layout_grid" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"accent_id" integer,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_glyph_grid" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" varchar PRIMARY KEY NOT NULL,
		"typeface_id" integer,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_glyph_grid_locales" (
		"title" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" varchar NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_columns" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"image_id" integer,
		"image_background_color_id" integer,
		"image_scale" "enum_image_scale" DEFAULT '100',
		"_uuid" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_columns_locales" (
		"heading" varchar,
		"body" jsonb,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_content_columns" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"image_ratio" "enum__guideline_docs_v_blocks_content_columns_image_ratio" DEFAULT '4:3',
		"_uuid" varchar,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_media_showcase_images" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"image_id" integer,
		"image_background_color_id" integer,
		"image_scale" "enum_image_scale" DEFAULT '100',
		"_uuid" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_carousel_slides" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"image_id" integer,
		"_uuid" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_carousel_slides_locales" (
		"caption" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_carousel" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"image_ratio" "enum__guideline_docs_v_blocks_carousel_image_ratio" DEFAULT '16:9',
		"_uuid" varchar,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_callout_items" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"_uuid" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_callout_items_locales" (
		"text" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_callout" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"kind" "enum__guideline_docs_v_blocks_callout_kind" DEFAULT 'must',
		"_uuid" varchar,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_callout_locales" (
		"title" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_groups_specs" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"key" varchar,
		"value" varchar,
		"_uuid" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_groups" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"_uuid" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_groups_locales" (
		"label" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_spec_list" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"_uuid" varchar,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_signature_showcase_signatures" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"phrase" varchar,
		"_uuid" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_signature_showcase_signatures_locales" (
		"label" varchar,
		"note" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_signature_showcase" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"_uuid" varchar,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_type_specimen" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"typeface_id" integer,
		"_uuid" varchar,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_type_specimen_locales" (
		"samples_word" varchar,
		"samples_sentence" varchar,
		"samples_paragraph" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_type_scale_items" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"name" varchar,
		"size_px" numeric,
		"line_height_px" numeric,
		"weight" numeric,
		"_uuid" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_type_scale_items_locales" (
		"sample" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_type_scale" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"typeface_id" integer,
		"_uuid" varchar,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid_variants" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"columns" numeric,
		"gutter" varchar,
		"margin" varchar,
		"_uuid" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid_variants_locales" (
		"label" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"accent_id" integer,
		"_uuid" varchar,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_glyph_grid" (
		"_order" integer NOT NULL,
		"_parent_id" integer NOT NULL,
		"_path" text NOT NULL,
		"id" serial PRIMARY KEY NOT NULL,
		"typeface_id" integer,
		"_uuid" varchar,
		"block_name" varchar
	  );
	CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_glyph_grid_locales" (
		"title" varchar,
		"id" serial PRIMARY KEY NOT NULL,
		"_locale" "_locales" NOT NULL,
		"_parent_id" integer NOT NULL
	  );
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_content_columns_columns" ADD CONSTRAINT "guideline_docs_blocks_content_columns_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_content_columns_columns" ADD CONSTRAINT "guideline_docs_blocks_content_columns_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_content_columns_columns" ADD CONSTRAINT "guideline_docs_blocks_content_columns_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_content_columns"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_content_columns_columns_locales" ADD CONSTRAINT "guideline_docs_blocks_content_columns_columns_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_content_columns_columns"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_content_columns" ADD CONSTRAINT "guideline_docs_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_carousel_slides" ADD CONSTRAINT "guideline_docs_blocks_carousel_slides_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_carousel_slides" ADD CONSTRAINT "guideline_docs_blocks_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_carousel_slides_locales" ADD CONSTRAINT "guideline_docs_blocks_carousel_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_carousel_slides"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_carousel" ADD CONSTRAINT "guideline_docs_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_callout_items" ADD CONSTRAINT "guideline_docs_blocks_callout_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_callout_items_locales" ADD CONSTRAINT "guideline_docs_blocks_callout_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_callout_items"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_callout" ADD CONSTRAINT "guideline_docs_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_callout_locales" ADD CONSTRAINT "guideline_docs_blocks_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_spec_list_groups_specs" ADD CONSTRAINT "guideline_docs_blocks_spec_list_groups_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_spec_list_groups" ADD CONSTRAINT "guideline_docs_blocks_spec_list_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_spec_list"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_spec_list_groups_locales" ADD CONSTRAINT "guideline_docs_blocks_spec_list_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_spec_list" ADD CONSTRAINT "guideline_docs_blocks_spec_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures" ADD CONSTRAINT "guideline_docs_blocks_signature_showcase_signatures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_signature_showcase"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures_locales" ADD CONSTRAINT "guideline_docs_blocks_signature_showcase_signatures_local_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_signature_showcase_signatures"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_signature_showcase" ADD CONSTRAINT "guideline_docs_blocks_signature_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_type_specimen" ADD CONSTRAINT "guideline_docs_blocks_type_specimen_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_type_specimen" ADD CONSTRAINT "guideline_docs_blocks_type_specimen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_type_specimen_locales" ADD CONSTRAINT "guideline_docs_blocks_type_specimen_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_type_specimen"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_type_scale_items" ADD CONSTRAINT "guideline_docs_blocks_type_scale_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_type_scale"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_type_scale_items_locales" ADD CONSTRAINT "guideline_docs_blocks_type_scale_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_type_scale_items"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_type_scale" ADD CONSTRAINT "guideline_docs_blocks_type_scale_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_type_scale" ADD CONSTRAINT "guideline_docs_blocks_type_scale_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_layout_grid_variants" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_layout_grid"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_layout_grid_variants_locales" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_variants_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_layout_grid_variants"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_layout_grid" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_accent_id_brand_colors_id_fk" FOREIGN KEY ("accent_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_layout_grid" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_glyph_grid" ADD CONSTRAINT "guideline_docs_blocks_glyph_grid_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_glyph_grid" ADD CONSTRAINT "guideline_docs_blocks_glyph_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "guideline_docs_blocks_glyph_grid_locales" ADD CONSTRAINT "guideline_docs_blocks_glyph_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_glyph_grid"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_content_columns_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_content_columns_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_content_columns_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_content_columns"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_content_columns_columns_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_content_columns_columns"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_content_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_carousel_slides" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_slides_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_carousel_slides" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_carousel_slides_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_slides_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_carousel_slides"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_carousel" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_callout_items" ADD CONSTRAINT "_guideline_docs_v_blocks_callout_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_callout_items_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_callout_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_callout_items"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_callout" ADD CONSTRAINT "_guideline_docs_v_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_callout_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_specs" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_groups_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_spec_list"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_groups_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_spec_list" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures" ADD CONSTRAINT "_guideline_docs_v_blocks_signature_showcase_signatures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_signature_showcase"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_signature_showcase_signatures_lo_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_signature_showcase_signatures"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_signature_showcase" ADD CONSTRAINT "_guideline_docs_v_blocks_signature_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_type_specimen" ADD CONSTRAINT "_guideline_docs_v_blocks_type_specimen_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_type_specimen" ADD CONSTRAINT "_guideline_docs_v_blocks_type_specimen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_type_specimen_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_type_specimen_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_type_specimen"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_type_scale_items" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_type_scale"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_type_scale_items_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_items_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_type_scale_items"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_type_scale" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_type_scale" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_layout_grid"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_variants_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_layout_grid_variants"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_layout_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_accent_id_brand_colors_id_fk" FOREIGN KEY ("accent_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_layout_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_glyph_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_glyph_grid_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_glyph_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_glyph_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	DO $$ BEGIN
		ALTER TABLE "_guideline_docs_v_blocks_glyph_grid_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_glyph_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_glyph_grid"("id") ON DELETE cascade ON UPDATE no action;
	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_content_columns_columns_order_idx" ON "guideline_docs_blocks_content_columns_columns" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_content_columns_columns_parent_id_idx" ON "guideline_docs_blocks_content_columns_columns" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_content_columns_columns_image_idx" ON "guideline_docs_blocks_content_columns_columns" USING btree ("image_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_content_columns_columns_image_back_idx" ON "guideline_docs_blocks_content_columns_columns" USING btree ("image_background_color_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_content_columns_columns_locales_locale" ON "guideline_docs_blocks_content_columns_columns_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_content_columns_order_idx" ON "guideline_docs_blocks_content_columns" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_content_columns_parent_id_idx" ON "guideline_docs_blocks_content_columns" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_content_columns_path_idx" ON "guideline_docs_blocks_content_columns" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_carousel_slides_order_idx" ON "guideline_docs_blocks_carousel_slides" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_carousel_slides_parent_id_idx" ON "guideline_docs_blocks_carousel_slides" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_carousel_slides_image_idx" ON "guideline_docs_blocks_carousel_slides" USING btree ("image_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_carousel_slides_locales_locale_parent_" ON "guideline_docs_blocks_carousel_slides_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_carousel_order_idx" ON "guideline_docs_blocks_carousel" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_carousel_parent_id_idx" ON "guideline_docs_blocks_carousel" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_carousel_path_idx" ON "guideline_docs_blocks_carousel" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_callout_items_order_idx" ON "guideline_docs_blocks_callout_items" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_callout_items_parent_id_idx" ON "guideline_docs_blocks_callout_items" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_callout_items_locales_locale_parent_id" ON "guideline_docs_blocks_callout_items_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_callout_order_idx" ON "guideline_docs_blocks_callout" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_callout_parent_id_idx" ON "guideline_docs_blocks_callout" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_callout_path_idx" ON "guideline_docs_blocks_callout" USING btree ("_path");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_callout_locales_locale_parent_id_uniqu" ON "guideline_docs_blocks_callout_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_spec_list_groups_specs_order_idx" ON "guideline_docs_blocks_spec_list_groups_specs" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_spec_list_groups_specs_parent_id_idx" ON "guideline_docs_blocks_spec_list_groups_specs" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_spec_list_groups_order_idx" ON "guideline_docs_blocks_spec_list_groups" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_spec_list_groups_parent_id_idx" ON "guideline_docs_blocks_spec_list_groups" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_spec_list_groups_locales_locale_parent" ON "guideline_docs_blocks_spec_list_groups_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_spec_list_order_idx" ON "guideline_docs_blocks_spec_list" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_spec_list_parent_id_idx" ON "guideline_docs_blocks_spec_list" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_spec_list_path_idx" ON "guideline_docs_blocks_spec_list" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_signature_showcase_signatures_order_idx" ON "guideline_docs_blocks_signature_showcase_signatures" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_signature_showcase_signatures_parent_id_idx" ON "guideline_docs_blocks_signature_showcase_signatures" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_signature_showcase_signatures_locales_" ON "guideline_docs_blocks_signature_showcase_signatures_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_signature_showcase_order_idx" ON "guideline_docs_blocks_signature_showcase" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_signature_showcase_parent_id_idx" ON "guideline_docs_blocks_signature_showcase" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_signature_showcase_path_idx" ON "guideline_docs_blocks_signature_showcase" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_specimen_order_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_specimen_parent_id_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_specimen_path_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_specimen_typeface_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("typeface_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_type_specimen_locales_locale_parent_id" ON "guideline_docs_blocks_type_specimen_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_scale_items_order_idx" ON "guideline_docs_blocks_type_scale_items" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_scale_items_parent_id_idx" ON "guideline_docs_blocks_type_scale_items" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_type_scale_items_locales_locale_parent" ON "guideline_docs_blocks_type_scale_items_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_scale_order_idx" ON "guideline_docs_blocks_type_scale" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_scale_parent_id_idx" ON "guideline_docs_blocks_type_scale" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_scale_path_idx" ON "guideline_docs_blocks_type_scale" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_type_scale_typeface_idx" ON "guideline_docs_blocks_type_scale" USING btree ("typeface_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_layout_grid_variants_order_idx" ON "guideline_docs_blocks_layout_grid_variants" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_layout_grid_variants_parent_id_idx" ON "guideline_docs_blocks_layout_grid_variants" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_layout_grid_variants_locales_locale_pa" ON "guideline_docs_blocks_layout_grid_variants_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_layout_grid_order_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_layout_grid_parent_id_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_layout_grid_path_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_layout_grid_accent_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("accent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_glyph_grid_order_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_glyph_grid_parent_id_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_glyph_grid_path_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "guideline_docs_blocks_glyph_grid_typeface_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("typeface_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "guideline_docs_blocks_glyph_grid_locales_locale_parent_id_un" ON "guideline_docs_blocks_glyph_grid_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_columns_order_idx" ON "_guideline_docs_v_blocks_content_columns_columns" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_columns_parent_id_idx" ON "_guideline_docs_v_blocks_content_columns_columns" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_columns_image_idx" ON "_guideline_docs_v_blocks_content_columns_columns" USING btree ("image_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_columns_image_b_idx" ON "_guideline_docs_v_blocks_content_columns_columns" USING btree ("image_background_color_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_columns_locales_loc" ON "_guideline_docs_v_blocks_content_columns_columns_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_order_idx" ON "_guideline_docs_v_blocks_content_columns" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_parent_id_idx" ON "_guideline_docs_v_blocks_content_columns" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_content_columns_path_idx" ON "_guideline_docs_v_blocks_content_columns" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_carousel_slides_order_idx" ON "_guideline_docs_v_blocks_carousel_slides" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_carousel_slides_parent_id_idx" ON "_guideline_docs_v_blocks_carousel_slides" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_carousel_slides_image_idx" ON "_guideline_docs_v_blocks_carousel_slides" USING btree ("image_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_carousel_slides_locales_locale_pare" ON "_guideline_docs_v_blocks_carousel_slides_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_carousel_order_idx" ON "_guideline_docs_v_blocks_carousel" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_carousel_parent_id_idx" ON "_guideline_docs_v_blocks_carousel" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_carousel_path_idx" ON "_guideline_docs_v_blocks_carousel" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_callout_items_order_idx" ON "_guideline_docs_v_blocks_callout_items" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_callout_items_parent_id_idx" ON "_guideline_docs_v_blocks_callout_items" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_callout_items_locales_locale_parent" ON "_guideline_docs_v_blocks_callout_items_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_callout_order_idx" ON "_guideline_docs_v_blocks_callout" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_callout_parent_id_idx" ON "_guideline_docs_v_blocks_callout" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_callout_path_idx" ON "_guideline_docs_v_blocks_callout" USING btree ("_path");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_callout_locales_locale_parent_id_un" ON "_guideline_docs_v_blocks_callout_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_groups_specs_order_idx" ON "_guideline_docs_v_blocks_spec_list_groups_specs" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_groups_specs_parent_id_idx" ON "_guideline_docs_v_blocks_spec_list_groups_specs" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_groups_order_idx" ON "_guideline_docs_v_blocks_spec_list_groups" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_groups_parent_id_idx" ON "_guideline_docs_v_blocks_spec_list_groups" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_groups_locales_locale_par" ON "_guideline_docs_v_blocks_spec_list_groups_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_order_idx" ON "_guideline_docs_v_blocks_spec_list" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_parent_id_idx" ON "_guideline_docs_v_blocks_spec_list" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_spec_list_path_idx" ON "_guideline_docs_v_blocks_spec_list" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_signature_showcase_signatures_order_idx" ON "_guideline_docs_v_blocks_signature_showcase_signatures" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_signature_showcase_signatures_parent_id_idx" ON "_guideline_docs_v_blocks_signature_showcase_signatures" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_signature_showcase_signatures_local" ON "_guideline_docs_v_blocks_signature_showcase_signatures_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_signature_showcase_order_idx" ON "_guideline_docs_v_blocks_signature_showcase" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_signature_showcase_parent_id_idx" ON "_guideline_docs_v_blocks_signature_showcase" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_signature_showcase_path_idx" ON "_guideline_docs_v_blocks_signature_showcase" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_specimen_order_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_specimen_parent_id_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_specimen_path_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_specimen_typeface_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("typeface_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_specimen_locales_locale_parent" ON "_guideline_docs_v_blocks_type_specimen_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_scale_items_order_idx" ON "_guideline_docs_v_blocks_type_scale_items" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_scale_items_parent_id_idx" ON "_guideline_docs_v_blocks_type_scale_items" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_scale_items_locales_locale_par" ON "_guideline_docs_v_blocks_type_scale_items_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_scale_order_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_scale_parent_id_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_scale_path_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_type_scale_typeface_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("typeface_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid_variants_order_idx" ON "_guideline_docs_v_blocks_layout_grid_variants" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid_variants_parent_id_idx" ON "_guideline_docs_v_blocks_layout_grid_variants" USING btree ("_parent_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid_variants_locales_locale" ON "_guideline_docs_v_blocks_layout_grid_variants_locales" USING btree ("_locale","_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid_order_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid_parent_id_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid_path_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_layout_grid_accent_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("accent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_glyph_grid_order_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("_order");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_glyph_grid_parent_id_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("_parent_id");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_glyph_grid_path_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("_path");
	CREATE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_glyph_grid_typeface_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("typeface_id");
	CREATE UNIQUE INDEX IF NOT EXISTS "_guideline_docs_v_blocks_glyph_grid_locales_locale_parent_id" ON "_guideline_docs_v_blocks_glyph_grid_locales" USING btree ("_locale","_parent_id");
`
