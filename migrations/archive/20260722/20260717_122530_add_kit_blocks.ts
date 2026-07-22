import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // fresh replay에서는 20260714_031500 프렐류드(kit-blocks-schema-prelude)가 현재 스키마를
  // 선반영하므로 rename과 생성을 건너뛰고 잔재 정리만 한다. 이미 운영 중인 DB에서는
  // column_unit 계열을 contentColumns로 rename해 기존 데이터를 보존한다.
  const { rows: shaped } = await db.execute(
    sql`SELECT to_regclass('public.guideline_docs_blocks_content_columns') AS shaped`,
  )
  const alreadyShaped = shaped?.[0]?.shaped != null

  if (!alreadyShaped) {
    await db.execute(sql`
  CREATE TYPE "public"."enum_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_guideline_docs_blocks_policy_callout_kind" AS ENUM('must', 'recommended', 'dont');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_policy_callout_kind" AS ENUM('must', 'recommended', 'dont');
  CREATE TABLE "guideline_docs_blocks_policy_callout_items" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
    );
  CREATE TABLE "guideline_docs_blocks_policy_callout_items_locales" (
	"text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
    );
  CREATE TABLE "guideline_docs_blocks_policy_callout" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"kind" "enum_guideline_docs_blocks_policy_callout_kind" DEFAULT 'must',
	"block_name" varchar
    );
  CREATE TABLE "guideline_docs_blocks_policy_callout_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
    );
  CREATE TABLE "guideline_docs_blocks_spec_list_groups_specs" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" varchar
    );
  CREATE TABLE "guideline_docs_blocks_spec_list_groups" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
    );
  CREATE TABLE "guideline_docs_blocks_spec_list_groups_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
    );
  CREATE TABLE "guideline_docs_blocks_spec_list" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
    );
  CREATE TABLE "guideline_docs_blocks_signature_showcase_signatures" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"phrase" varchar
    );
  CREATE TABLE "guideline_docs_blocks_signature_showcase_signatures_locales" (
	"label" varchar,
	"note" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
    );
  CREATE TABLE "guideline_docs_blocks_signature_showcase" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
    );
  CREATE TABLE "guideline_docs_blocks_type_specimen" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"typeface_id" integer,
	"block_name" varchar
    );
  CREATE TABLE "guideline_docs_blocks_type_specimen_locales" (
	"samples_word" varchar,
	"samples_sentence" varchar,
	"samples_paragraph" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
    );
  CREATE TABLE "guideline_docs_blocks_type_scale_items" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar,
	"size_px" numeric,
	"line_height_px" numeric,
	"weight" numeric
    );
  CREATE TABLE "guideline_docs_blocks_type_scale_items_locales" (
	"sample" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
    );
  CREATE TABLE "guideline_docs_blocks_type_scale" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"typeface_id" integer,
	"block_name" varchar
    );
  CREATE TABLE "guideline_docs_blocks_layout_grid_variants" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"columns" numeric,
	"gutter" varchar,
	"margin" varchar
    );
  CREATE TABLE "guideline_docs_blocks_layout_grid_variants_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
    );
  CREATE TABLE "guideline_docs_blocks_layout_grid" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"accent_id" integer,
	"block_name" varchar
    );
  CREATE TABLE "guideline_docs_blocks_glyph_grid" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"typeface_id" integer,
	"block_name" varchar
    );
  CREATE TABLE "guideline_docs_blocks_glyph_grid_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
    );
  CREATE TABLE "_guideline_docs_v_blocks_policy_callout_items" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_policy_callout_items_locales" (
	"text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
    );
  CREATE TABLE "_guideline_docs_v_blocks_policy_callout" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "enum__guideline_docs_v_blocks_policy_callout_kind" DEFAULT 'must',
	"_uuid" varchar,
	"block_name" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_policy_callout_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
    );
  CREATE TABLE "_guideline_docs_v_blocks_spec_list_groups_specs" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" varchar,
	"_uuid" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_spec_list_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_spec_list_groups_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
    );
  CREATE TABLE "_guideline_docs_v_blocks_spec_list" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_signature_showcase_signatures" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"phrase" varchar,
	"_uuid" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_signature_showcase_signatures_locales" (
	"label" varchar,
	"note" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
    );
  CREATE TABLE "_guideline_docs_v_blocks_signature_showcase" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_type_specimen" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"typeface_id" integer,
	"_uuid" varchar,
	"block_name" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_type_specimen_locales" (
	"samples_word" varchar,
	"samples_sentence" varchar,
	"samples_paragraph" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
    );
  CREATE TABLE "_guideline_docs_v_blocks_type_scale_items" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"size_px" numeric,
	"line_height_px" numeric,
	"weight" numeric,
	"_uuid" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_type_scale_items_locales" (
	"sample" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
    );
  CREATE TABLE "_guideline_docs_v_blocks_type_scale" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"typeface_id" integer,
	"_uuid" varchar,
	"block_name" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_layout_grid_variants" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"columns" numeric,
	"gutter" varchar,
	"margin" varchar,
	"_uuid" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_layout_grid_variants_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
    );
  CREATE TABLE "_guideline_docs_v_blocks_layout_grid" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"accent_id" integer,
	"_uuid" varchar,
	"block_name" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_glyph_grid" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"typeface_id" integer,
	"_uuid" varchar,
	"block_name" varchar
    );
  CREATE TABLE "_guideline_docs_v_blocks_glyph_grid_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
    );
  ALTER TABLE "guideline_docs_blocks_policy_callout_items" ADD CONSTRAINT "guideline_docs_blocks_policy_callout_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_policy_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_policy_callout_items_locales" ADD CONSTRAINT "guideline_docs_blocks_policy_callout_items_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_policy_callout_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_policy_callout" ADD CONSTRAINT "guideline_docs_blocks_policy_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_policy_callout_locales" ADD CONSTRAINT "guideline_docs_blocks_policy_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_policy_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups_specs" ADD CONSTRAINT "guideline_docs_blocks_spec_list_groups_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups" ADD CONSTRAINT "guideline_docs_blocks_spec_list_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_spec_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups_locales" ADD CONSTRAINT "guideline_docs_blocks_spec_list_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_spec_list" ADD CONSTRAINT "guideline_docs_blocks_spec_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures" ADD CONSTRAINT "guideline_docs_blocks_signature_showcase_signatures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_signature_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures_locales" ADD CONSTRAINT "guideline_docs_blocks_signature_showcase_signatures_local_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_signature_showcase_signatures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_signature_showcase" ADD CONSTRAINT "guideline_docs_blocks_signature_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_specimen" ADD CONSTRAINT "guideline_docs_blocks_type_specimen_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_specimen" ADD CONSTRAINT "guideline_docs_blocks_type_specimen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_specimen_locales" ADD CONSTRAINT "guideline_docs_blocks_type_specimen_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_type_specimen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_scale_items" ADD CONSTRAINT "guideline_docs_blocks_type_scale_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_type_scale"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_scale_items_locales" ADD CONSTRAINT "guideline_docs_blocks_type_scale_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_type_scale_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_scale" ADD CONSTRAINT "guideline_docs_blocks_type_scale_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_scale" ADD CONSTRAINT "guideline_docs_blocks_type_scale_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_layout_grid_variants" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_layout_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_layout_grid_variants_locales" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_variants_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_layout_grid_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_layout_grid" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_accent_id_brand_colors_id_fk" FOREIGN KEY ("accent_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_layout_grid" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_glyph_grid" ADD CONSTRAINT "guideline_docs_blocks_glyph_grid_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_glyph_grid" ADD CONSTRAINT "guideline_docs_blocks_glyph_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_glyph_grid_locales" ADD CONSTRAINT "guideline_docs_blocks_glyph_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_glyph_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items" ADD CONSTRAINT "_guideline_docs_v_blocks_policy_callout_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_policy_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_policy_callout_items_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_policy_callout_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout" ADD CONSTRAINT "_guideline_docs_v_blocks_policy_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_policy_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_policy_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_specs" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_groups_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_spec_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_groups_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures" ADD CONSTRAINT "_guideline_docs_v_blocks_signature_showcase_signatures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_signature_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_signature_showcase_signatures_lo_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_signature_showcase_signatures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase" ADD CONSTRAINT "_guideline_docs_v_blocks_signature_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen" ADD CONSTRAINT "_guideline_docs_v_blocks_type_specimen_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen" ADD CONSTRAINT "_guideline_docs_v_blocks_type_specimen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_type_specimen_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_type_specimen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale_items" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_type_scale"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale_items_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_items_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_type_scale_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_layout_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_variants_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_layout_grid_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_accent_id_brand_colors_id_fk" FOREIGN KEY ("accent_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_glyph_grid_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_glyph_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_glyph_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_glyph_grid"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_policy_callout_items_order_idx" ON "guideline_docs_blocks_policy_callout_items" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_policy_callout_items_parent_id_idx" ON "guideline_docs_blocks_policy_callout_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_policy_callout_items_locales_locale_pa" ON "guideline_docs_blocks_policy_callout_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_policy_callout_order_idx" ON "guideline_docs_blocks_policy_callout" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_policy_callout_parent_id_idx" ON "guideline_docs_blocks_policy_callout" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_policy_callout_path_idx" ON "guideline_docs_blocks_policy_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_policy_callout_locales_locale_parent_i" ON "guideline_docs_blocks_policy_callout_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_spec_list_groups_specs_order_idx" ON "guideline_docs_blocks_spec_list_groups_specs" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_spec_list_groups_specs_parent_id_idx" ON "guideline_docs_blocks_spec_list_groups_specs" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_spec_list_groups_order_idx" ON "guideline_docs_blocks_spec_list_groups" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_spec_list_groups_parent_id_idx" ON "guideline_docs_blocks_spec_list_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_spec_list_groups_locales_locale_parent" ON "guideline_docs_blocks_spec_list_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_spec_list_order_idx" ON "guideline_docs_blocks_spec_list" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_spec_list_parent_id_idx" ON "guideline_docs_blocks_spec_list" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_spec_list_path_idx" ON "guideline_docs_blocks_spec_list" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_signatures_order_idx" ON "guideline_docs_blocks_signature_showcase_signatures" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_signatures_parent_id_idx" ON "guideline_docs_blocks_signature_showcase_signatures" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_signature_showcase_signatures_locales_" ON "guideline_docs_blocks_signature_showcase_signatures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_order_idx" ON "guideline_docs_blocks_signature_showcase" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_parent_id_idx" ON "guideline_docs_blocks_signature_showcase" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_path_idx" ON "guideline_docs_blocks_signature_showcase" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_type_specimen_order_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_type_specimen_parent_id_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_type_specimen_path_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_type_specimen_typeface_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("typeface_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_type_specimen_locales_locale_parent_id" ON "guideline_docs_blocks_type_specimen_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_type_scale_items_order_idx" ON "guideline_docs_blocks_type_scale_items" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_type_scale_items_parent_id_idx" ON "guideline_docs_blocks_type_scale_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_type_scale_items_locales_locale_parent" ON "guideline_docs_blocks_type_scale_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_type_scale_order_idx" ON "guideline_docs_blocks_type_scale" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_type_scale_parent_id_idx" ON "guideline_docs_blocks_type_scale" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_type_scale_path_idx" ON "guideline_docs_blocks_type_scale" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_type_scale_typeface_idx" ON "guideline_docs_blocks_type_scale" USING btree ("typeface_id");
  CREATE INDEX "guideline_docs_blocks_layout_grid_variants_order_idx" ON "guideline_docs_blocks_layout_grid_variants" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_layout_grid_variants_parent_id_idx" ON "guideline_docs_blocks_layout_grid_variants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_layout_grid_variants_locales_locale_pa" ON "guideline_docs_blocks_layout_grid_variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_layout_grid_order_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_layout_grid_parent_id_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_layout_grid_path_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_layout_grid_accent_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("accent_id");
  CREATE INDEX "guideline_docs_blocks_glyph_grid_order_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_glyph_grid_parent_id_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_glyph_grid_path_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_glyph_grid_typeface_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("typeface_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_glyph_grid_locales_locale_parent_id_un" ON "guideline_docs_blocks_glyph_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_items_order_idx" ON "_guideline_docs_v_blocks_policy_callout_items" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_items_parent_id_idx" ON "_guideline_docs_v_blocks_policy_callout_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_policy_callout_items_locales_locale" ON "_guideline_docs_v_blocks_policy_callout_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_order_idx" ON "_guideline_docs_v_blocks_policy_callout" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_parent_id_idx" ON "_guideline_docs_v_blocks_policy_callout" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_path_idx" ON "_guideline_docs_v_blocks_policy_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_policy_callout_locales_locale_paren" ON "_guideline_docs_v_blocks_policy_callout_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_groups_specs_order_idx" ON "_guideline_docs_v_blocks_spec_list_groups_specs" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_groups_specs_parent_id_idx" ON "_guideline_docs_v_blocks_spec_list_groups_specs" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_groups_order_idx" ON "_guideline_docs_v_blocks_spec_list_groups" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_groups_parent_id_idx" ON "_guideline_docs_v_blocks_spec_list_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_spec_list_groups_locales_locale_par" ON "_guideline_docs_v_blocks_spec_list_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_order_idx" ON "_guideline_docs_v_blocks_spec_list" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_parent_id_idx" ON "_guideline_docs_v_blocks_spec_list" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_path_idx" ON "_guideline_docs_v_blocks_spec_list" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_signatures_order_idx" ON "_guideline_docs_v_blocks_signature_showcase_signatures" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_signatures_parent_id_idx" ON "_guideline_docs_v_blocks_signature_showcase_signatures" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_signature_showcase_signatures_local" ON "_guideline_docs_v_blocks_signature_showcase_signatures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_order_idx" ON "_guideline_docs_v_blocks_signature_showcase" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_parent_id_idx" ON "_guideline_docs_v_blocks_signature_showcase" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_path_idx" ON "_guideline_docs_v_blocks_signature_showcase" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_type_specimen_order_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_type_specimen_parent_id_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_type_specimen_path_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_type_specimen_typeface_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("typeface_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_type_specimen_locales_locale_parent" ON "_guideline_docs_v_blocks_type_specimen_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_items_order_idx" ON "_guideline_docs_v_blocks_type_scale_items" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_items_parent_id_idx" ON "_guideline_docs_v_blocks_type_scale_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_type_scale_items_locales_locale_par" ON "_guideline_docs_v_blocks_type_scale_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_order_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_parent_id_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_path_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_typeface_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("typeface_id");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_variants_order_idx" ON "_guideline_docs_v_blocks_layout_grid_variants" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_variants_parent_id_idx" ON "_guideline_docs_v_blocks_layout_grid_variants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_layout_grid_variants_locales_locale" ON "_guideline_docs_v_blocks_layout_grid_variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_order_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_parent_id_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_path_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_accent_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("accent_id");
  CREATE INDEX "_guideline_docs_v_blocks_glyph_grid_order_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_glyph_grid_parent_id_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_glyph_grid_path_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_glyph_grid_typeface_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("typeface_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_glyph_grid_locales_locale_parent_id" ON "_guideline_docs_v_blocks_glyph_grid_locales" USING btree ("_locale","_parent_id");
  `)

    // columnUnit → contentColumns 개명: DROP/CREATE 대신 rename으로 기존 데이터를 보존한다.
    await db.execute(sql`
  ALTER TYPE "public"."enum_guideline_docs_blocks_column_unit_image_ratio" RENAME TO "enum_guideline_docs_blocks_content_columns_image_ratio";
  ALTER TYPE "public"."enum__guideline_docs_v_blocks_column_unit_image_ratio" RENAME TO "enum__guideline_docs_v_blocks_content_columns_image_ratio";
  ALTER TABLE "guideline_docs_blocks_column_unit" RENAME TO "guideline_docs_blocks_content_columns";
  ALTER TABLE "guideline_docs_blocks_column_unit_columns" RENAME TO "guideline_docs_blocks_content_columns_columns";
  ALTER TABLE "guideline_docs_blocks_column_unit_columns_locales" RENAME TO "guideline_docs_blocks_content_columns_columns_locales";
  ALTER TABLE "_guideline_docs_v_blocks_column_unit" RENAME TO "_guideline_docs_v_blocks_content_columns";
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns" RENAME TO "_guideline_docs_v_blocks_content_columns_columns";
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns_locales" RENAME TO "_guideline_docs_v_blocks_content_columns_columns_locales";
  ALTER TABLE "guideline_docs_blocks_content_columns_columns" ALTER COLUMN "image_scale" DROP DEFAULT;
  ALTER TABLE "guideline_docs_blocks_content_columns_columns" ALTER COLUMN "image_scale" SET DATA TYPE "public"."enum_image_scale" USING "image_scale"::text::"public"."enum_image_scale";
  ALTER TABLE "guideline_docs_blocks_content_columns_columns" ALTER COLUMN "image_scale" SET DEFAULT '100';
  ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" ALTER COLUMN "image_scale" DROP DEFAULT;
  ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" ALTER COLUMN "image_scale" SET DATA TYPE "public"."enum_image_scale" USING "image_scale"::text::"public"."enum_image_scale";
  ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" ALTER COLUMN "image_scale" SET DEFAULT '100';
  ALTER TABLE "guideline_docs_blocks_content_columns_columns" RENAME CONSTRAINT "guideline_docs_blocks_column_unit_columns_image_id_application_images_id_fk" TO "guideline_docs_blocks_content_columns_columns_image_id_application_images_id_fk";
  ALTER TABLE "guideline_docs_blocks_content_columns_columns" RENAME CONSTRAINT "guideline_docs_blocks_column_unit_columns_image_background_color_id_brand_colors_id_fk" TO "guideline_docs_blocks_content_columns_columns_image_background_color_id_brand_colors_id_fk";
  ALTER TABLE "guideline_docs_blocks_content_columns_columns" RENAME CONSTRAINT "guideline_docs_blocks_column_unit_columns_parent_id_fk" TO "guideline_docs_blocks_content_columns_columns_parent_id_fk";
  ALTER TABLE "guideline_docs_blocks_content_columns_columns_locales" RENAME CONSTRAINT "guideline_docs_blocks_column_unit_columns_locales_parent__fk" TO "guideline_docs_blocks_content_columns_columns_locales_par_fk";
  ALTER TABLE "guideline_docs_blocks_content_columns" RENAME CONSTRAINT "guideline_docs_blocks_column_unit_parent_id_fk" TO "guideline_docs_blocks_content_columns_parent_id_fk";
  ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" RENAME CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_image_id_application_images_id_fk" TO "_guideline_docs_v_blocks_content_columns_columns_image_id_application_images_id_fk";
  ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" RENAME CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_image_background_color_id_brand_colors_id_fk" TO "_guideline_docs_v_blocks_content_columns_columns_image_background_color_id_brand_colors_id_fk";
  ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" RENAME CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_parent_id_fk" TO "_guideline_docs_v_blocks_content_columns_columns_parent_id_fk";
  ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns_locales" RENAME CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_locales_pare_fk" TO "_guideline_docs_v_blocks_content_columns_columns_locales__fk";
  ALTER TABLE "_guideline_docs_v_blocks_content_columns" RENAME CONSTRAINT "_guideline_docs_v_blocks_column_unit_parent_id_fk" TO "_guideline_docs_v_blocks_content_columns_parent_id_fk";
  ALTER INDEX "guideline_docs_blocks_column_unit_columns_order_idx" RENAME TO "guideline_docs_blocks_content_columns_columns_order_idx";
  ALTER INDEX "guideline_docs_blocks_column_unit_columns_parent_id_idx" RENAME TO "guideline_docs_blocks_content_columns_columns_parent_id_idx";
  ALTER INDEX "guideline_docs_blocks_column_unit_columns_image_idx" RENAME TO "guideline_docs_blocks_content_columns_columns_image_idx";
  ALTER INDEX "guideline_docs_blocks_column_unit_columns_image_backgrou_idx" RENAME TO "guideline_docs_blocks_content_columns_columns_image_back_idx";
  ALTER INDEX "guideline_docs_blocks_column_unit_columns_locales_locale_par" RENAME TO "guideline_docs_blocks_content_columns_columns_locales_locale";
  ALTER INDEX "guideline_docs_blocks_column_unit_order_idx" RENAME TO "guideline_docs_blocks_content_columns_order_idx";
  ALTER INDEX "guideline_docs_blocks_column_unit_parent_id_idx" RENAME TO "guideline_docs_blocks_content_columns_parent_id_idx";
  ALTER INDEX "guideline_docs_blocks_column_unit_path_idx" RENAME TO "guideline_docs_blocks_content_columns_path_idx";
  ALTER INDEX "_guideline_docs_v_blocks_column_unit_columns_order_idx" RENAME TO "_guideline_docs_v_blocks_content_columns_columns_order_idx";
  ALTER INDEX "_guideline_docs_v_blocks_column_unit_columns_parent_id_idx" RENAME TO "_guideline_docs_v_blocks_content_columns_columns_parent_id_idx";
  ALTER INDEX "_guideline_docs_v_blocks_column_unit_columns_image_idx" RENAME TO "_guideline_docs_v_blocks_content_columns_columns_image_idx";
  ALTER INDEX "_guideline_docs_v_blocks_column_unit_columns_image_backg_idx" RENAME TO "_guideline_docs_v_blocks_content_columns_columns_image_b_idx";
  ALTER INDEX "_guideline_docs_v_blocks_column_unit_columns_locales_locale_" RENAME TO "_guideline_docs_v_blocks_content_columns_columns_locales_loc";
  ALTER INDEX "_guideline_docs_v_blocks_column_unit_order_idx" RENAME TO "_guideline_docs_v_blocks_content_columns_order_idx";
  ALTER INDEX "_guideline_docs_v_blocks_column_unit_parent_id_idx" RENAME TO "_guideline_docs_v_blocks_content_columns_parent_id_idx";
  ALTER INDEX "_guideline_docs_v_blocks_column_unit_path_idx" RENAME TO "_guideline_docs_v_blocks_content_columns_path_idx";
  `)
  }

  await db.execute(sql`
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "weight_range" varchar;
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "url" varchar;
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "thumbnail_u_r_l" varchar;
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "filename" varchar;
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "mime_type" varchar;
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "filesize" numeric;
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "width" numeric;
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "height" numeric;
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "focal_x" numeric;
  ALTER TABLE "brand_typefaces" ADD COLUMN IF NOT EXISTS "focal_y" numeric;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_weight_range" varchar;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_url" varchar;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_thumbnail_u_r_l" varchar;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_filename" varchar;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_mime_type" varchar;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_filesize" numeric;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_width" numeric;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_height" numeric;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_focal_x" numeric;
  ALTER TABLE "_brand_typefaces_v" ADD COLUMN IF NOT EXISTS "version_focal_y" numeric;
  CREATE UNIQUE INDEX IF NOT EXISTS "brand_typefaces_filename_idx" ON "brand_typefaces" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "_brand_typefaces_v_version_version_filename_idx" ON "_brand_typefaces_v" USING btree ("version_filename");
  ALTER TABLE "guideline_docs_blocks_media_showcase" ALTER COLUMN "image_scale" DROP DEFAULT;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ALTER COLUMN "image_scale" SET DATA TYPE "public"."enum_image_scale" USING "image_scale"::text::"public"."enum_image_scale";
  ALTER TABLE "guideline_docs_blocks_media_showcase" ALTER COLUMN "image_scale" SET DEFAULT '100';
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ALTER COLUMN "image_scale" DROP DEFAULT;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ALTER COLUMN "image_scale" SET DATA TYPE "public"."enum_image_scale" USING "image_scale"::text::"public"."enum_image_scale";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ALTER COLUMN "image_scale" SET DEFAULT '100';
  DROP TABLE IF EXISTS "guideline_docs_blocks_column_unit_columns" CASCADE;
  DROP TABLE IF EXISTS "guideline_docs_blocks_column_unit_columns_locales" CASCADE;
  DROP TABLE IF EXISTS "guideline_docs_blocks_column_unit" CASCADE;
  DROP TABLE IF EXISTS "_guideline_docs_v_blocks_column_unit_columns" CASCADE;
  DROP TABLE IF EXISTS "_guideline_docs_v_blocks_column_unit_columns_locales" CASCADE;
  DROP TABLE IF EXISTS "_guideline_docs_v_blocks_column_unit" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_guideline_docs_blocks_column_unit_columns_image_scale";
  DROP TYPE IF EXISTS "public"."enum_guideline_docs_blocks_column_unit_image_ratio";
  DROP TYPE IF EXISTS "public"."enum_guideline_docs_blocks_media_showcase_image_scale";
  DROP TYPE IF EXISTS "public"."enum__guideline_docs_v_blocks_column_unit_columns_image_scale";
  DROP TYPE IF EXISTS "public"."enum__guideline_docs_v_blocks_column_unit_image_ratio";
  DROP TYPE IF EXISTS "public"."enum__guideline_docs_v_blocks_media_showcase_image_scale";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // 스키마 역연산만 수행한다. contentColumns로 개명된 데이터는 복원하지 않는다.
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_blocks_column_unit_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_guideline_docs_blocks_column_unit_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
  CREATE TYPE "public"."enum_guideline_docs_blocks_media_showcase_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_column_unit_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_column_unit_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
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

  CREATE TABLE "guideline_docs_blocks_column_unit" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_ratio" "enum_guideline_docs_blocks_column_unit_image_ratio" DEFAULT '4:3',
	"block_name" varchar
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

  CREATE TABLE "_guideline_docs_v_blocks_column_unit" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_ratio" "enum__guideline_docs_v_blocks_column_unit_image_ratio" DEFAULT '4:3',
	"_uuid" varchar,
	"block_name" varchar
  );

  ALTER TABLE "guideline_docs_blocks_content_columns_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_content_columns_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_content_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_policy_callout_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_policy_callout_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_policy_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_policy_callout_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups_specs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_spec_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_signature_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_specimen" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_specimen_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_scale_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_scale_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_scale" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_layout_grid_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_layout_grid_variants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_layout_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_glyph_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_glyph_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_content_columns_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_content_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_specs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_docs_blocks_content_columns_columns" CASCADE;
  DROP TABLE "guideline_docs_blocks_content_columns_columns_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_content_columns" CASCADE;
  DROP TABLE "guideline_docs_blocks_policy_callout_items" CASCADE;
  DROP TABLE "guideline_docs_blocks_policy_callout_items_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_policy_callout" CASCADE;
  DROP TABLE "guideline_docs_blocks_policy_callout_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_spec_list_groups_specs" CASCADE;
  DROP TABLE "guideline_docs_blocks_spec_list_groups" CASCADE;
  DROP TABLE "guideline_docs_blocks_spec_list_groups_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_spec_list" CASCADE;
  DROP TABLE "guideline_docs_blocks_signature_showcase_signatures" CASCADE;
  DROP TABLE "guideline_docs_blocks_signature_showcase_signatures_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_signature_showcase" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_specimen" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_specimen_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_scale_items" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_scale_items_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_scale" CASCADE;
  DROP TABLE "guideline_docs_blocks_layout_grid_variants" CASCADE;
  DROP TABLE "guideline_docs_blocks_layout_grid_variants_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_layout_grid" CASCADE;
  DROP TABLE "guideline_docs_blocks_glyph_grid" CASCADE;
  DROP TABLE "guideline_docs_blocks_glyph_grid_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_content_columns_columns" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_content_columns_columns_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_content_columns" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_policy_callout_items" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_policy_callout_items_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_policy_callout" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_policy_callout_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_spec_list_groups_specs" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_spec_list_groups" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_spec_list_groups_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_spec_list" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_signature_showcase_signatures" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_signature_showcase_signatures_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_signature_showcase" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_specimen" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_specimen_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_scale_items" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_scale_items_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_scale" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_layout_grid_variants" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_layout_grid_variants_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_layout_grid" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_glyph_grid" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_glyph_grid_locales" CASCADE;
  DROP INDEX "brand_typefaces_filename_idx";
  DROP INDEX "_brand_typefaces_v_version_version_filename_idx";
  ALTER TABLE "guideline_docs_blocks_media_showcase" ALTER COLUMN "image_scale" DROP DEFAULT;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ALTER COLUMN "image_scale" SET DATA TYPE "public"."enum_guideline_docs_blocks_media_showcase_image_scale" USING "image_scale"::text::"public"."enum_guideline_docs_blocks_media_showcase_image_scale";
  ALTER TABLE "guideline_docs_blocks_media_showcase" ALTER COLUMN "image_scale" SET DEFAULT '100';
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ALTER COLUMN "image_scale" DROP DEFAULT;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ALTER COLUMN "image_scale" SET DATA TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_image_scale" USING "image_scale"::text::"public"."enum__guideline_docs_v_blocks_media_showcase_image_scale";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ALTER COLUMN "image_scale" SET DEFAULT '100';
  ALTER TABLE "guideline_docs_blocks_column_unit_columns" ADD CONSTRAINT "guideline_docs_blocks_column_unit_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_columns" ADD CONSTRAINT "guideline_docs_blocks_column_unit_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_columns" ADD CONSTRAINT "guideline_docs_blocks_column_unit_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_columns_locales" ADD CONSTRAINT "guideline_docs_blocks_column_unit_columns_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_column_unit_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit" ADD CONSTRAINT "guideline_docs_blocks_column_unit_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_columns_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_columns_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_column_unit_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_column_unit_columns_order_idx" ON "guideline_docs_blocks_column_unit_columns" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_column_unit_columns_parent_id_idx" ON "guideline_docs_blocks_column_unit_columns" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_columns_image_idx" ON "guideline_docs_blocks_column_unit_columns" USING btree ("image_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_columns_image_backgrou_idx" ON "guideline_docs_blocks_column_unit_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_column_unit_columns_locales_locale_par" ON "guideline_docs_blocks_column_unit_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_order_idx" ON "guideline_docs_blocks_column_unit" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_column_unit_parent_id_idx" ON "guideline_docs_blocks_column_unit" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_path_idx" ON "guideline_docs_blocks_column_unit" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_columns_order_idx" ON "_guideline_docs_v_blocks_column_unit_columns" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_columns_parent_id_idx" ON "_guideline_docs_v_blocks_column_unit_columns" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_columns_image_idx" ON "_guideline_docs_v_blocks_column_unit_columns" USING btree ("image_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_columns_image_backg_idx" ON "_guideline_docs_v_blocks_column_unit_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_column_unit_columns_locales_locale_" ON "_guideline_docs_v_blocks_column_unit_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_order_idx" ON "_guideline_docs_v_blocks_column_unit" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_parent_id_idx" ON "_guideline_docs_v_blocks_column_unit" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_path_idx" ON "_guideline_docs_v_blocks_column_unit" USING btree ("_path");
  ALTER TABLE "brand_typefaces" DROP COLUMN "weight_range";
  ALTER TABLE "brand_typefaces" DROP COLUMN "url";
  ALTER TABLE "brand_typefaces" DROP COLUMN "thumbnail_u_r_l";
  ALTER TABLE "brand_typefaces" DROP COLUMN "filename";
  ALTER TABLE "brand_typefaces" DROP COLUMN "mime_type";
  ALTER TABLE "brand_typefaces" DROP COLUMN "filesize";
  ALTER TABLE "brand_typefaces" DROP COLUMN "width";
  ALTER TABLE "brand_typefaces" DROP COLUMN "height";
  ALTER TABLE "brand_typefaces" DROP COLUMN "focal_x";
  ALTER TABLE "brand_typefaces" DROP COLUMN "focal_y";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_weight_range";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_url";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_thumbnail_u_r_l";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_filename";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_mime_type";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_filesize";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_width";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_height";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_focal_x";
  ALTER TABLE "_brand_typefaces_v" DROP COLUMN "version_focal_y";
  DROP TYPE "public"."enum_image_scale";
  DROP TYPE "public"."enum_guideline_docs_blocks_content_columns_image_ratio";
  DROP TYPE "public"."enum_guideline_docs_blocks_policy_callout_kind";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_content_columns_image_ratio";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_policy_callout_kind";`)
}
