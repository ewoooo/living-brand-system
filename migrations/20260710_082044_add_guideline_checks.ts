import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_sections_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_section_cu_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_section_ms_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_section_cp_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_section_dd_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_sections_v_version_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__section_cu_v_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__section_ms_v_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__section_cp_v_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__section_dd_v_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_blocks_column_unit_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_blocks_media_showcase_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_blocks_color_palette_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_pages_blocks_do_dont_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_version_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_column_unit_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_color_palette_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_do_dont_checks_tier" AS ENUM('required', 'recommended');
  CREATE TABLE "guideline_sections_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_guideline_sections_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "section_cu_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_section_cu_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "section_ms_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_section_ms_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "section_cp_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_section_cp_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "section_dd_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_section_dd_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "_guideline_sections_v_version_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__guideline_sections_v_version_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_section_cu_v_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__section_cu_v_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_section_ms_v_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__section_ms_v_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_section_cp_v_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__section_cp_v_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_section_dd_v_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__section_dd_v_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "guideline_pages_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_guideline_pages_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "guideline_pages_blocks_column_unit_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_guideline_pages_blocks_column_unit_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "guideline_pages_blocks_media_showcase_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_guideline_pages_blocks_media_showcase_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "guideline_pages_blocks_color_palette_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_guideline_pages_blocks_color_palette_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "guideline_pages_blocks_do_dont_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum_guideline_pages_blocks_do_dont_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "_guideline_pages_v_version_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__guideline_pages_v_version_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_column_unit_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__guideline_pages_v_blocks_column_unit_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_media_showcase_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__guideline_pages_v_blocks_media_showcase_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_color_palette_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__guideline_pages_v_blocks_color_palette_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_do_dont_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"tier" "enum__guideline_pages_v_blocks_do_dont_checks_tier",
  	"checker_id" integer,
  	"options" jsonb,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "guideline_sections_checks" ADD CONSTRAINT "guideline_sections_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_sections_checks" ADD CONSTRAINT "guideline_sections_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cu_checks" ADD CONSTRAINT "section_cu_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cu_checks" ADD CONSTRAINT "section_cu_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_ms_checks" ADD CONSTRAINT "section_ms_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_ms_checks" ADD CONSTRAINT "section_ms_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_ms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_cp_checks" ADD CONSTRAINT "section_cp_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cp_checks" ADD CONSTRAINT "section_cp_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_dd_checks" ADD CONSTRAINT "section_dd_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_dd_checks" ADD CONSTRAINT "section_dd_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_dd"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_version_checks" ADD CONSTRAINT "_guideline_sections_v_version_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_version_checks" ADD CONSTRAINT "_guideline_sections_v_version_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v_checks" ADD CONSTRAINT "_section_cu_v_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cu_v_checks" ADD CONSTRAINT "_section_cu_v_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cu_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_ms_v_checks" ADD CONSTRAINT "_section_ms_v_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_ms_v_checks" ADD CONSTRAINT "_section_ms_v_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_ms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cp_v_checks" ADD CONSTRAINT "_section_cp_v_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cp_v_checks" ADD CONSTRAINT "_section_cp_v_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cp_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_dd_v_checks" ADD CONSTRAINT "_section_dd_v_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_dd_v_checks" ADD CONSTRAINT "_section_dd_v_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_dd_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_checks" ADD CONSTRAINT "guideline_pages_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_checks" ADD CONSTRAINT "guideline_pages_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" ADD CONSTRAINT "guideline_pages_blocks_column_unit_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit_checks" ADD CONSTRAINT "guideline_pages_blocks_column_unit_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" ADD CONSTRAINT "guideline_pages_blocks_media_showcase_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_media_showcase_checks" ADD CONSTRAINT "guideline_pages_blocks_media_showcase_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" ADD CONSTRAINT "guideline_pages_blocks_color_palette_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_color_palette_checks" ADD CONSTRAINT "guideline_pages_blocks_color_palette_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" ADD CONSTRAINT "guideline_pages_blocks_do_dont_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_checks" ADD CONSTRAINT "guideline_pages_blocks_do_dont_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_version_checks" ADD CONSTRAINT "_guideline_pages_v_version_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_version_checks" ADD CONSTRAINT "_guideline_pages_v_version_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_media_showcase_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_media_showcase_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_checks" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_sections_checks_order_idx" ON "guideline_sections_checks" USING btree ("_order");
  CREATE INDEX "guideline_sections_checks_parent_id_idx" ON "guideline_sections_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_sections_checks_checker_idx" ON "guideline_sections_checks" USING btree ("checker_id");
  CREATE INDEX "section_cu_checks_order_idx" ON "section_cu_checks" USING btree ("_order");
  CREATE INDEX "section_cu_checks_parent_id_idx" ON "section_cu_checks" USING btree ("_parent_id");
  CREATE INDEX "section_cu_checks_checker_idx" ON "section_cu_checks" USING btree ("checker_id");
  CREATE INDEX "section_ms_checks_order_idx" ON "section_ms_checks" USING btree ("_order");
  CREATE INDEX "section_ms_checks_parent_id_idx" ON "section_ms_checks" USING btree ("_parent_id");
  CREATE INDEX "section_ms_checks_checker_idx" ON "section_ms_checks" USING btree ("checker_id");
  CREATE INDEX "section_cp_checks_order_idx" ON "section_cp_checks" USING btree ("_order");
  CREATE INDEX "section_cp_checks_parent_id_idx" ON "section_cp_checks" USING btree ("_parent_id");
  CREATE INDEX "section_cp_checks_checker_idx" ON "section_cp_checks" USING btree ("checker_id");
  CREATE INDEX "section_dd_checks_order_idx" ON "section_dd_checks" USING btree ("_order");
  CREATE INDEX "section_dd_checks_parent_id_idx" ON "section_dd_checks" USING btree ("_parent_id");
  CREATE INDEX "section_dd_checks_checker_idx" ON "section_dd_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_sections_v_version_checks_order_idx" ON "_guideline_sections_v_version_checks" USING btree ("_order");
  CREATE INDEX "_guideline_sections_v_version_checks_parent_id_idx" ON "_guideline_sections_v_version_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_sections_v_version_checks_checker_idx" ON "_guideline_sections_v_version_checks" USING btree ("checker_id");
  CREATE INDEX "_section_cu_v_checks_order_idx" ON "_section_cu_v_checks" USING btree ("_order");
  CREATE INDEX "_section_cu_v_checks_parent_id_idx" ON "_section_cu_v_checks" USING btree ("_parent_id");
  CREATE INDEX "_section_cu_v_checks_checker_idx" ON "_section_cu_v_checks" USING btree ("checker_id");
  CREATE INDEX "_section_ms_v_checks_order_idx" ON "_section_ms_v_checks" USING btree ("_order");
  CREATE INDEX "_section_ms_v_checks_parent_id_idx" ON "_section_ms_v_checks" USING btree ("_parent_id");
  CREATE INDEX "_section_ms_v_checks_checker_idx" ON "_section_ms_v_checks" USING btree ("checker_id");
  CREATE INDEX "_section_cp_v_checks_order_idx" ON "_section_cp_v_checks" USING btree ("_order");
  CREATE INDEX "_section_cp_v_checks_parent_id_idx" ON "_section_cp_v_checks" USING btree ("_parent_id");
  CREATE INDEX "_section_cp_v_checks_checker_idx" ON "_section_cp_v_checks" USING btree ("checker_id");
  CREATE INDEX "_section_dd_v_checks_order_idx" ON "_section_dd_v_checks" USING btree ("_order");
  CREATE INDEX "_section_dd_v_checks_parent_id_idx" ON "_section_dd_v_checks" USING btree ("_parent_id");
  CREATE INDEX "_section_dd_v_checks_checker_idx" ON "_section_dd_v_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_checks_order_idx" ON "guideline_pages_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_checks_parent_id_idx" ON "guideline_pages_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_checks_checker_idx" ON "guideline_pages_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_checks_order_idx" ON "guideline_pages_blocks_column_unit_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_column_unit_checks_parent_id_idx" ON "guideline_pages_blocks_column_unit_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_checks_checker_idx" ON "guideline_pages_blocks_column_unit_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_blocks_media_showcase_checks_order_idx" ON "guideline_pages_blocks_media_showcase_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_media_showcase_checks_parent_id_idx" ON "guideline_pages_blocks_media_showcase_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_media_showcase_checks_checker_idx" ON "guideline_pages_blocks_media_showcase_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_blocks_color_palette_checks_order_idx" ON "guideline_pages_blocks_color_palette_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_color_palette_checks_parent_id_idx" ON "guideline_pages_blocks_color_palette_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_color_palette_checks_checker_idx" ON "guideline_pages_blocks_color_palette_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_checks_order_idx" ON "guideline_pages_blocks_do_dont_checks" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_do_dont_checks_parent_id_idx" ON "guideline_pages_blocks_do_dont_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_checks_checker_idx" ON "guideline_pages_blocks_do_dont_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_version_checks_order_idx" ON "_guideline_pages_v_version_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_version_checks_parent_id_idx" ON "_guideline_pages_v_version_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_version_checks_checker_idx" ON "_guideline_pages_v_version_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_checks_order_idx" ON "_guideline_pages_v_blocks_column_unit_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_checks_parent_id_idx" ON "_guideline_pages_v_blocks_column_unit_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_checks_checker_idx" ON "_guideline_pages_v_blocks_column_unit_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_checks_order_idx" ON "_guideline_pages_v_blocks_media_showcase_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_checks_parent_id_idx" ON "_guideline_pages_v_blocks_media_showcase_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_checks_checker_idx" ON "_guideline_pages_v_blocks_media_showcase_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_checks_order_idx" ON "_guideline_pages_v_blocks_color_palette_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_checks_parent_id_idx" ON "_guideline_pages_v_blocks_color_palette_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_checks_checker_idx" ON "_guideline_pages_v_blocks_color_palette_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_checks_order_idx" ON "_guideline_pages_v_blocks_do_dont_checks" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_checks_parent_id_idx" ON "_guideline_pages_v_blocks_do_dont_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_checks_checker_idx" ON "_guideline_pages_v_blocks_do_dont_checks" USING btree ("checker_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guideline_sections_checks" CASCADE;
  DROP TABLE "section_cu_checks" CASCADE;
  DROP TABLE "section_ms_checks" CASCADE;
  DROP TABLE "section_cp_checks" CASCADE;
  DROP TABLE "section_dd_checks" CASCADE;
  DROP TABLE "_guideline_sections_v_version_checks" CASCADE;
  DROP TABLE "_section_cu_v_checks" CASCADE;
  DROP TABLE "_section_ms_v_checks" CASCADE;
  DROP TABLE "_section_cp_v_checks" CASCADE;
  DROP TABLE "_section_dd_v_checks" CASCADE;
  DROP TABLE "guideline_pages_checks" CASCADE;
  DROP TABLE "guideline_pages_blocks_column_unit_checks" CASCADE;
  DROP TABLE "guideline_pages_blocks_media_showcase_checks" CASCADE;
  DROP TABLE "guideline_pages_blocks_color_palette_checks" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_version_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_column_unit_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_media_showcase_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_color_palette_checks" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_checks" CASCADE;
  DROP TYPE "public"."enum_guideline_sections_checks_tier";
  DROP TYPE "public"."enum_section_cu_checks_tier";
  DROP TYPE "public"."enum_section_ms_checks_tier";
  DROP TYPE "public"."enum_section_cp_checks_tier";
  DROP TYPE "public"."enum_section_dd_checks_tier";
  DROP TYPE "public"."enum__guideline_sections_v_version_checks_tier";
  DROP TYPE "public"."enum__section_cu_v_checks_tier";
  DROP TYPE "public"."enum__section_ms_v_checks_tier";
  DROP TYPE "public"."enum__section_cp_v_checks_tier";
  DROP TYPE "public"."enum__section_dd_v_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_blocks_column_unit_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_blocks_media_showcase_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_blocks_color_palette_checks_tier";
  DROP TYPE "public"."enum_guideline_pages_blocks_do_dont_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_version_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_column_unit_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_media_showcase_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_color_palette_checks_tier";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_do_dont_checks_tier";`)
}
