import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_section_cu_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_section_ms_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum_section_dd_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TYPE "public"."enum__section_cu_v_columns_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__section_ms_v_image_scale" AS ENUM('10', '20', '30', '40', '50', '60', '70', '80', '90', '100');
  CREATE TYPE "public"."enum__section_dd_v_groups_examples_kind" AS ENUM('do', 'dont');
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

  CREATE TABLE "section_cu" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "rule_id" integer,
    "block_name" varchar
  );

  CREATE TABLE "section_cu_locales" (
    "title" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "section_ms" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "image_id" integer,
    "image_background_color_id" integer,
    "image_scale" "enum_section_ms_image_scale" DEFAULT '100',
    "rule_id" integer,
    "block_name" varchar
  );

  CREATE TABLE "section_cp" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "rule_id" integer,
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
    "id" varchar PRIMARY KEY NOT NULL,
    "rule_id" integer
  );

  CREATE TABLE "section_dd_groups_locales" (
    "category" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
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

  CREATE TABLE "guideline_sections_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "brand_colors_id" integer
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

  CREATE TABLE "_section_cu_v" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "rule_id" integer,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_section_cu_v_locales" (
    "title" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_section_ms_v" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "image_id" integer,
    "image_background_color_id" integer,
    "image_scale" "enum__section_ms_v_image_scale" DEFAULT '100',
    "rule_id" integer,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_section_cp_v" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "rule_id" integer,
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
    "rule_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_section_dd_v_groups_locales" (
    "category" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
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

  CREATE TABLE "_guideline_sections_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "brand_colors_id" integer
  );

  ALTER TABLE "section_cu_columns" ADD CONSTRAINT "section_cu_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cu_columns" ADD CONSTRAINT "section_cu_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cu_columns" ADD CONSTRAINT "section_cu_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cu_columns_locales" ADD CONSTRAINT "section_cu_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cu_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cu" ADD CONSTRAINT "section_cu_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cu" ADD CONSTRAINT "section_cu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cu_locales" ADD CONSTRAINT "section_cu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_ms" ADD CONSTRAINT "section_ms_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_ms" ADD CONSTRAINT "section_ms_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_ms" ADD CONSTRAINT "section_ms_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_ms" ADD CONSTRAINT "section_ms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cp" ADD CONSTRAINT "section_cp_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cp" ADD CONSTRAINT "section_cp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cp_locales" ADD CONSTRAINT "section_cp_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_groups_examples" ADD CONSTRAINT "section_dd_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_dd_groups_examples" ADD CONSTRAINT "section_dd_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_groups_examples_locales" ADD CONSTRAINT "section_dd_groups_examples_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_groups" ADD CONSTRAINT "section_dd_groups_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_dd_groups" ADD CONSTRAINT "section_dd_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_groups_locales" ADD CONSTRAINT "section_dd_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd" ADD CONSTRAINT "section_dd_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_locales" ADD CONSTRAINT "section_dd_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_sections_rels" ADD CONSTRAINT "guideline_sections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_sections_rels" ADD CONSTRAINT "guideline_sections_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v_columns" ADD CONSTRAINT "_section_cu_v_columns_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cu_v_columns" ADD CONSTRAINT "_section_cu_v_columns_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cu_v_columns" ADD CONSTRAINT "_section_cu_v_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cu_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v_columns_locales" ADD CONSTRAINT "_section_cu_v_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cu_v_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v" ADD CONSTRAINT "_section_cu_v_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cu_v" ADD CONSTRAINT "_section_cu_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v_locales" ADD CONSTRAINT "_section_cu_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cu_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_ms_v" ADD CONSTRAINT "_section_ms_v_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_ms_v" ADD CONSTRAINT "_section_ms_v_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_ms_v" ADD CONSTRAINT "_section_ms_v_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_ms_v" ADD CONSTRAINT "_section_ms_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cp_v" ADD CONSTRAINT "_section_cp_v_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cp_v" ADD CONSTRAINT "_section_cp_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cp_v_locales" ADD CONSTRAINT "_section_cp_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cp_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups_examples" ADD CONSTRAINT "_section_dd_v_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups_examples" ADD CONSTRAINT "_section_dd_v_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups_examples_locales" ADD CONSTRAINT "_section_dd_v_groups_examples_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups" ADD CONSTRAINT "_section_dd_v_groups_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups" ADD CONSTRAINT "_section_dd_v_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups_locales" ADD CONSTRAINT "_section_dd_v_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v" ADD CONSTRAINT "_section_dd_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_locales" ADD CONSTRAINT "_section_dd_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_rels" ADD CONSTRAINT "_guideline_sections_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_rels" ADD CONSTRAINT "_guideline_sections_v_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "section_cu_columns_order_idx" ON "section_cu_columns" USING btree ("_order");
  CREATE INDEX "section_cu_columns_parent_id_idx" ON "section_cu_columns" USING btree ("_parent_id");
  CREATE INDEX "section_cu_columns_image_idx" ON "section_cu_columns" USING btree ("image_id");
  CREATE INDEX "section_cu_columns_image_background_color_idx" ON "section_cu_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "section_cu_columns_locales_locale_parent_id_unique" ON "section_cu_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_cu_order_idx" ON "section_cu" USING btree ("_order");
  CREATE INDEX "section_cu_parent_id_idx" ON "section_cu" USING btree ("_parent_id");
  CREATE INDEX "section_cu_path_idx" ON "section_cu" USING btree ("_path");
  CREATE INDEX "section_cu_rule_idx" ON "section_cu" USING btree ("rule_id");
  CREATE UNIQUE INDEX "section_cu_locales_locale_parent_id_unique" ON "section_cu_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_ms_order_idx" ON "section_ms" USING btree ("_order");
  CREATE INDEX "section_ms_parent_id_idx" ON "section_ms" USING btree ("_parent_id");
  CREATE INDEX "section_ms_path_idx" ON "section_ms" USING btree ("_path");
  CREATE INDEX "section_ms_image_idx" ON "section_ms" USING btree ("image_id");
  CREATE INDEX "section_ms_image_background_color_idx" ON "section_ms" USING btree ("image_background_color_id");
  CREATE INDEX "section_ms_rule_idx" ON "section_ms" USING btree ("rule_id");
  CREATE INDEX "section_cp_order_idx" ON "section_cp" USING btree ("_order");
  CREATE INDEX "section_cp_parent_id_idx" ON "section_cp" USING btree ("_parent_id");
  CREATE INDEX "section_cp_path_idx" ON "section_cp" USING btree ("_path");
  CREATE INDEX "section_cp_rule_idx" ON "section_cp" USING btree ("rule_id");
  CREATE UNIQUE INDEX "section_cp_locales_locale_parent_id_unique" ON "section_cp_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_dd_groups_examples_order_idx" ON "section_dd_groups_examples" USING btree ("_order");
  CREATE INDEX "section_dd_groups_examples_parent_id_idx" ON "section_dd_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "section_dd_groups_examples_image_idx" ON "section_dd_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "section_dd_groups_examples_locales_locale_parent_id_unique" ON "section_dd_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_dd_groups_order_idx" ON "section_dd_groups" USING btree ("_order");
  CREATE INDEX "section_dd_groups_parent_id_idx" ON "section_dd_groups" USING btree ("_parent_id");
  CREATE INDEX "section_dd_groups_rule_idx" ON "section_dd_groups" USING btree ("rule_id");
  CREATE UNIQUE INDEX "section_dd_groups_locales_locale_parent_id_unique" ON "section_dd_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "section_dd_order_idx" ON "section_dd" USING btree ("_order");
  CREATE INDEX "section_dd_parent_id_idx" ON "section_dd" USING btree ("_parent_id");
  CREATE INDEX "section_dd_path_idx" ON "section_dd" USING btree ("_path");
  CREATE UNIQUE INDEX "section_dd_locales_locale_parent_id_unique" ON "section_dd_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_sections_rels_order_idx" ON "guideline_sections_rels" USING btree ("order");
  CREATE INDEX "guideline_sections_rels_parent_idx" ON "guideline_sections_rels" USING btree ("parent_id");
  CREATE INDEX "guideline_sections_rels_path_idx" ON "guideline_sections_rels" USING btree ("path");
  CREATE INDEX "guideline_sections_rels_brand_colors_id_idx" ON "guideline_sections_rels" USING btree ("brand_colors_id");
  CREATE INDEX "_section_cu_v_columns_order_idx" ON "_section_cu_v_columns" USING btree ("_order");
  CREATE INDEX "_section_cu_v_columns_parent_id_idx" ON "_section_cu_v_columns" USING btree ("_parent_id");
  CREATE INDEX "_section_cu_v_columns_image_idx" ON "_section_cu_v_columns" USING btree ("image_id");
  CREATE INDEX "_section_cu_v_columns_image_background_color_idx" ON "_section_cu_v_columns" USING btree ("image_background_color_id");
  CREATE UNIQUE INDEX "_section_cu_v_columns_locales_locale_parent_id_unique" ON "_section_cu_v_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_cu_v_order_idx" ON "_section_cu_v" USING btree ("_order");
  CREATE INDEX "_section_cu_v_parent_id_idx" ON "_section_cu_v" USING btree ("_parent_id");
  CREATE INDEX "_section_cu_v_path_idx" ON "_section_cu_v" USING btree ("_path");
  CREATE INDEX "_section_cu_v_rule_idx" ON "_section_cu_v" USING btree ("rule_id");
  CREATE UNIQUE INDEX "_section_cu_v_locales_locale_parent_id_unique" ON "_section_cu_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_ms_v_order_idx" ON "_section_ms_v" USING btree ("_order");
  CREATE INDEX "_section_ms_v_parent_id_idx" ON "_section_ms_v" USING btree ("_parent_id");
  CREATE INDEX "_section_ms_v_path_idx" ON "_section_ms_v" USING btree ("_path");
  CREATE INDEX "_section_ms_v_image_idx" ON "_section_ms_v" USING btree ("image_id");
  CREATE INDEX "_section_ms_v_image_background_color_idx" ON "_section_ms_v" USING btree ("image_background_color_id");
  CREATE INDEX "_section_ms_v_rule_idx" ON "_section_ms_v" USING btree ("rule_id");
  CREATE INDEX "_section_cp_v_order_idx" ON "_section_cp_v" USING btree ("_order");
  CREATE INDEX "_section_cp_v_parent_id_idx" ON "_section_cp_v" USING btree ("_parent_id");
  CREATE INDEX "_section_cp_v_path_idx" ON "_section_cp_v" USING btree ("_path");
  CREATE INDEX "_section_cp_v_rule_idx" ON "_section_cp_v" USING btree ("rule_id");
  CREATE UNIQUE INDEX "_section_cp_v_locales_locale_parent_id_unique" ON "_section_cp_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_dd_v_groups_examples_order_idx" ON "_section_dd_v_groups_examples" USING btree ("_order");
  CREATE INDEX "_section_dd_v_groups_examples_parent_id_idx" ON "_section_dd_v_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "_section_dd_v_groups_examples_image_idx" ON "_section_dd_v_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "_section_dd_v_groups_examples_locales_locale_parent_id_uniqu" ON "_section_dd_v_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_dd_v_groups_order_idx" ON "_section_dd_v_groups" USING btree ("_order");
  CREATE INDEX "_section_dd_v_groups_parent_id_idx" ON "_section_dd_v_groups" USING btree ("_parent_id");
  CREATE INDEX "_section_dd_v_groups_rule_idx" ON "_section_dd_v_groups" USING btree ("rule_id");
  CREATE UNIQUE INDEX "_section_dd_v_groups_locales_locale_parent_id_unique" ON "_section_dd_v_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_section_dd_v_order_idx" ON "_section_dd_v" USING btree ("_order");
  CREATE INDEX "_section_dd_v_parent_id_idx" ON "_section_dd_v" USING btree ("_parent_id");
  CREATE INDEX "_section_dd_v_path_idx" ON "_section_dd_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_section_dd_v_locales_locale_parent_id_unique" ON "_section_dd_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_sections_v_rels_order_idx" ON "_guideline_sections_v_rels" USING btree ("order");
  CREATE INDEX "_guideline_sections_v_rels_parent_idx" ON "_guideline_sections_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guideline_sections_v_rels_path_idx" ON "_guideline_sections_v_rels" USING btree ("path");
  CREATE INDEX "_guideline_sections_v_rels_brand_colors_id_idx" ON "_guideline_sections_v_rels" USING btree ("brand_colors_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "section_cu_columns" CASCADE;
  DROP TABLE "section_cu_columns_locales" CASCADE;
  DROP TABLE "section_cu" CASCADE;
  DROP TABLE "section_cu_locales" CASCADE;
  DROP TABLE "section_ms" CASCADE;
  DROP TABLE "section_cp" CASCADE;
  DROP TABLE "section_cp_locales" CASCADE;
  DROP TABLE "section_dd_groups_examples" CASCADE;
  DROP TABLE "section_dd_groups_examples_locales" CASCADE;
  DROP TABLE "section_dd_groups" CASCADE;
  DROP TABLE "section_dd_groups_locales" CASCADE;
  DROP TABLE "section_dd" CASCADE;
  DROP TABLE "section_dd_locales" CASCADE;
  DROP TABLE "guideline_sections_rels" CASCADE;
  DROP TABLE "_section_cu_v_columns" CASCADE;
  DROP TABLE "_section_cu_v_columns_locales" CASCADE;
  DROP TABLE "_section_cu_v" CASCADE;
  DROP TABLE "_section_cu_v_locales" CASCADE;
  DROP TABLE "_section_ms_v" CASCADE;
  DROP TABLE "_section_cp_v" CASCADE;
  DROP TABLE "_section_cp_v_locales" CASCADE;
  DROP TABLE "_section_dd_v_groups_examples" CASCADE;
  DROP TABLE "_section_dd_v_groups_examples_locales" CASCADE;
  DROP TABLE "_section_dd_v_groups" CASCADE;
  DROP TABLE "_section_dd_v_groups_locales" CASCADE;
  DROP TABLE "_section_dd_v" CASCADE;
  DROP TABLE "_section_dd_v_locales" CASCADE;
  DROP TABLE "_guideline_sections_v_rels" CASCADE;
  DROP TYPE "public"."enum_section_cu_columns_image_scale";
  DROP TYPE "public"."enum_section_ms_image_scale";
  DROP TYPE "public"."enum_section_dd_groups_examples_kind";
  DROP TYPE "public"."enum__section_cu_v_columns_image_scale";
  DROP TYPE "public"."enum__section_ms_v_image_scale";
  DROP TYPE "public"."enum__section_dd_v_groups_examples_kind";`)
}
