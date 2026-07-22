import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "section_cu" DROP CONSTRAINT "section_cu_rule_id_rules_id_fk";
  ALTER TABLE "section_ms" DROP CONSTRAINT "section_ms_rule_id_rules_id_fk";
  ALTER TABLE "section_cp" DROP CONSTRAINT "section_cp_rule_id_rules_id_fk";
  ALTER TABLE "section_dd_groups" DROP CONSTRAINT "section_dd_groups_rule_id_rules_id_fk";
  ALTER TABLE "_section_cu_v" DROP CONSTRAINT "_section_cu_v_rule_id_rules_id_fk";
  ALTER TABLE "_section_ms_v" DROP CONSTRAINT "_section_ms_v_rule_id_rules_id_fk";
  ALTER TABLE "_section_cp_v" DROP CONSTRAINT "_section_cp_v_rule_id_rules_id_fk";
  ALTER TABLE "_section_dd_v_groups" DROP CONSTRAINT "_section_dd_v_groups_rule_id_rules_id_fk";
  ALTER TABLE "guideline_pages_blocks_column_unit" DROP CONSTRAINT "guideline_pages_blocks_column_unit_rule_id_rules_id_fk";
  ALTER TABLE "guideline_pages_blocks_media_showcase" DROP CONSTRAINT "guideline_pages_blocks_media_showcase_rule_id_rules_id_fk";
  ALTER TABLE "guideline_pages_blocks_color_palette" DROP CONSTRAINT "guideline_pages_blocks_color_palette_rule_id_rules_id_fk";
  ALTER TABLE "guideline_pages_blocks_do_dont_groups" DROP CONSTRAINT "guideline_pages_blocks_do_dont_groups_rule_id_rules_id_fk";
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" DROP CONSTRAINT "_guideline_pages_v_blocks_column_unit_rule_id_rules_id_fk";
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" DROP CONSTRAINT "_guideline_pages_v_blocks_media_showcase_rule_id_rules_id_fk";
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" DROP CONSTRAINT "_guideline_pages_v_blocks_color_palette_rule_id_rules_id_fk";
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" DROP CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_rule_id_rules_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guideline_blocks_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rules_fk";
  DROP INDEX "section_cu_rule_idx";
  DROP INDEX "section_ms_rule_idx";
  DROP INDEX "section_cp_rule_idx";
  DROP INDEX "section_dd_groups_rule_idx";
  DROP INDEX "_section_cu_v_rule_idx";
  DROP INDEX "_section_ms_v_rule_idx";
  DROP INDEX "_section_cp_v_rule_idx";
  DROP INDEX "_section_dd_v_groups_rule_idx";
  DROP INDEX "guideline_pages_blocks_column_unit_rule_idx";
  DROP INDEX "guideline_pages_blocks_media_showcase_rule_idx";
  DROP INDEX "guideline_pages_blocks_color_palette_rule_idx";
  DROP INDEX "guideline_pages_blocks_do_dont_groups_rule_idx";
  DROP INDEX "_guideline_pages_v_blocks_column_unit_rule_idx";
  DROP INDEX "_guideline_pages_v_blocks_media_showcase_rule_idx";
  DROP INDEX "_guideline_pages_v_blocks_color_palette_rule_idx";
  DROP INDEX "_guideline_pages_v_blocks_do_dont_groups_rule_idx";
  DROP INDEX "payload_locked_documents_rels_guideline_blocks_id_idx";
  DROP INDEX "payload_locked_documents_rels_rules_id_idx";
  ALTER TABLE "section_cu" DROP COLUMN "rule_id";
  ALTER TABLE "section_ms" DROP COLUMN "rule_id";
  ALTER TABLE "section_cp" DROP COLUMN "rule_id";
  ALTER TABLE "section_dd_groups" DROP COLUMN "rule_id";
  ALTER TABLE "_section_cu_v" DROP COLUMN "rule_id";
  ALTER TABLE "_section_ms_v" DROP COLUMN "rule_id";
  ALTER TABLE "_section_cp_v" DROP COLUMN "rule_id";
  ALTER TABLE "_section_dd_v_groups" DROP COLUMN "rule_id";
  ALTER TABLE "guideline_pages_blocks_column_unit" DROP COLUMN "rule_id";
  ALTER TABLE "guideline_pages_blocks_media_showcase" DROP COLUMN "rule_id";
  ALTER TABLE "guideline_pages_blocks_color_palette" DROP COLUMN "rule_id";
  ALTER TABLE "guideline_pages_blocks_do_dont_groups" DROP COLUMN "rule_id";
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" DROP COLUMN "rule_id";
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" DROP COLUMN "rule_id";
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" DROP COLUMN "rule_id";
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" DROP COLUMN "rule_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guideline_blocks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rules_id";
  ALTER TABLE "guideline_blocks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_blocks_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rules_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_template_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_template_rules_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_version_template_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_version_template_rules_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "templates_template_rules_locales";
  DROP TABLE "templates_template_rules";
  DROP TABLE "_templates_v_version_template_rules_locales";
  DROP TABLE "_templates_v_version_template_rules";
  DROP TABLE IF EXISTS "_rules_v_rels" CASCADE;
  DROP TABLE IF EXISTS "_rules_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_rules_v" CASCADE;
  DROP TABLE "rules_rels";
  DROP TABLE "guideline_blocks_rels";
  DROP TABLE "guideline_blocks";
  DROP TABLE "rules" CASCADE;
  DROP TYPE "public"."enum_guideline_blocks_block_type";
  DROP TYPE "public"."enum_rules_tier";
  DROP TYPE "public"."enum_rules_status";
  DROP TYPE IF EXISTS "public"."enum__rules_v_version_tier";
  DROP TYPE IF EXISTS "public"."enum__rules_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__rules_v_published_locale";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_blocks_block_type" AS ENUM('columnUnit', 'mediaShowcase', 'colorPalette', 'doDont');
  CREATE TYPE "public"."enum_rules_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_rules_status" AS ENUM('draft', 'live', 'archived');
  CREATE TABLE "guideline_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"source_block_id" varchar NOT NULL,
  	"block_type" "enum_guideline_blocks_block_type" NOT NULL,
  	"display_order" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guideline_blocks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"guideline_sections_id" integer,
  	"guideline_pages_id" integer
  );
  
  CREATE TABLE "rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"checker_id" integer NOT NULL,
  	"source_block_id" varchar,
  	"key" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"tier" "enum_rules_tier",
  	"evidence" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"status" "enum_rules_status" DEFAULT 'live',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rules_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"guideline_sections_id" integer,
  	"guideline_pages_id" integer,
  	"guideline_blocks_id" integer,
  	"application_images_id" integer
  );
  
  CREATE TABLE "templates_template_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rule_id" integer
  );
  
  CREATE TABLE "templates_template_rules_locales" (
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_templates_v_version_template_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rule_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_templates_v_version_template_rules_locales" (
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "section_cu" ADD COLUMN "rule_id" integer;
  ALTER TABLE "section_ms" ADD COLUMN "rule_id" integer;
  ALTER TABLE "section_cp" ADD COLUMN "rule_id" integer;
  ALTER TABLE "section_dd_groups" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_section_cu_v" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_section_ms_v" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_section_cp_v" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_section_dd_v_groups" ADD COLUMN "rule_id" integer;
  ALTER TABLE "guideline_pages_blocks_column_unit" ADD COLUMN "rule_id" integer;
  ALTER TABLE "guideline_pages_blocks_media_showcase" ADD COLUMN "rule_id" integer;
  ALTER TABLE "guideline_pages_blocks_color_palette" ADD COLUMN "rule_id" integer;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" ADD COLUMN "rule_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guideline_blocks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rules_id" integer;
  ALTER TABLE "guideline_blocks_rels" ADD CONSTRAINT "guideline_blocks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_blocks_rels" ADD CONSTRAINT "guideline_blocks_rels_guideline_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_blocks_rels" ADD CONSTRAINT "guideline_blocks_rels_guideline_pages_fk" FOREIGN KEY ("guideline_pages_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rules" ADD CONSTRAINT "rules_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rules_rels" ADD CONSTRAINT "rules_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rules_rels" ADD CONSTRAINT "rules_rels_guideline_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rules_rels" ADD CONSTRAINT "rules_rels_guideline_pages_fk" FOREIGN KEY ("guideline_pages_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rules_rels" ADD CONSTRAINT "rules_rels_guideline_blocks_fk" FOREIGN KEY ("guideline_blocks_id") REFERENCES "public"."guideline_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rules_rels" ADD CONSTRAINT "rules_rels_application_images_fk" FOREIGN KEY ("application_images_id") REFERENCES "public"."application_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_template_rules" ADD CONSTRAINT "templates_template_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "templates_template_rules" ADD CONSTRAINT "templates_template_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_template_rules_locales" ADD CONSTRAINT "templates_template_rules_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates_template_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_rules" ADD CONSTRAINT "_templates_v_version_template_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_rules" ADD CONSTRAINT "_templates_v_version_template_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_rules_locales" ADD CONSTRAINT "_templates_v_version_template_rules_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v_version_template_rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "guideline_blocks_key_idx" ON "guideline_blocks" USING btree ("key");
  CREATE INDEX "guideline_blocks_source_block_id_idx" ON "guideline_blocks" USING btree ("source_block_id");
  CREATE INDEX "guideline_blocks_updated_at_idx" ON "guideline_blocks" USING btree ("updated_at");
  CREATE INDEX "guideline_blocks_created_at_idx" ON "guideline_blocks" USING btree ("created_at");
  CREATE INDEX "guideline_blocks_rels_order_idx" ON "guideline_blocks_rels" USING btree ("order");
  CREATE INDEX "guideline_blocks_rels_parent_idx" ON "guideline_blocks_rels" USING btree ("parent_id");
  CREATE INDEX "guideline_blocks_rels_path_idx" ON "guideline_blocks_rels" USING btree ("path");
  CREATE INDEX "guideline_blocks_rels_guideline_sections_id_idx" ON "guideline_blocks_rels" USING btree ("guideline_sections_id");
  CREATE INDEX "guideline_blocks_rels_guideline_pages_id_idx" ON "guideline_blocks_rels" USING btree ("guideline_pages_id");
  CREATE INDEX "rules_checker_idx" ON "rules" USING btree ("checker_id");
  CREATE INDEX "rules_source_source_block_id_idx" ON "rules" USING btree ("source_block_id");
  CREATE UNIQUE INDEX "rules_key_idx" ON "rules" USING btree ("key");
  CREATE INDEX "rules_updated_at_idx" ON "rules" USING btree ("updated_at");
  CREATE INDEX "rules_created_at_idx" ON "rules" USING btree ("created_at");
  CREATE INDEX "rules_rels_order_idx" ON "rules_rels" USING btree ("order");
  CREATE INDEX "rules_rels_parent_idx" ON "rules_rels" USING btree ("parent_id");
  CREATE INDEX "rules_rels_path_idx" ON "rules_rels" USING btree ("path");
  CREATE INDEX "rules_rels_guideline_sections_id_idx" ON "rules_rels" USING btree ("guideline_sections_id");
  CREATE INDEX "rules_rels_guideline_pages_id_idx" ON "rules_rels" USING btree ("guideline_pages_id");
  CREATE INDEX "rules_rels_guideline_blocks_id_idx" ON "rules_rels" USING btree ("guideline_blocks_id");
  CREATE INDEX "rules_rels_application_images_id_idx" ON "rules_rels" USING btree ("application_images_id");
  CREATE INDEX "templates_template_rules_order_idx" ON "templates_template_rules" USING btree ("_order");
  CREATE INDEX "templates_template_rules_parent_id_idx" ON "templates_template_rules" USING btree ("_parent_id");
  CREATE INDEX "templates_template_rules_rule_idx" ON "templates_template_rules" USING btree ("rule_id");
  CREATE UNIQUE INDEX "templates_template_rules_locales_locale_parent_id_unique" ON "templates_template_rules_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_templates_v_version_template_rules_order_idx" ON "_templates_v_version_template_rules" USING btree ("_order");
  CREATE INDEX "_templates_v_version_template_rules_parent_id_idx" ON "_templates_v_version_template_rules" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_version_template_rules_rule_idx" ON "_templates_v_version_template_rules" USING btree ("rule_id");
  CREATE UNIQUE INDEX "_templates_v_version_template_rules_locales_locale_parent_id" ON "_templates_v_version_template_rules_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "section_cu" ADD CONSTRAINT "section_cu_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_ms" ADD CONSTRAINT "section_ms_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_cp" ADD CONSTRAINT "section_cp_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_dd_groups" ADD CONSTRAINT "section_dd_groups_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cu_v" ADD CONSTRAINT "_section_cu_v_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_ms_v" ADD CONSTRAINT "_section_ms_v_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_cp_v" ADD CONSTRAINT "_section_cp_v_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_dd_v_groups" ADD CONSTRAINT "_section_dd_v_groups_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit" ADD CONSTRAINT "guideline_pages_blocks_column_unit_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_media_showcase" ADD CONSTRAINT "guideline_pages_blocks_media_showcase_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_color_palette" ADD CONSTRAINT "guideline_pages_blocks_color_palette_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_pages_v_blocks_media_showcase_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guideline_blocks_fk" FOREIGN KEY ("guideline_blocks_id") REFERENCES "public"."guideline_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "section_cu_rule_idx" ON "section_cu" USING btree ("rule_id");
  CREATE INDEX "section_ms_rule_idx" ON "section_ms" USING btree ("rule_id");
  CREATE INDEX "section_cp_rule_idx" ON "section_cp" USING btree ("rule_id");
  CREATE INDEX "section_dd_groups_rule_idx" ON "section_dd_groups" USING btree ("rule_id");
  CREATE INDEX "_section_cu_v_rule_idx" ON "_section_cu_v" USING btree ("rule_id");
  CREATE INDEX "_section_ms_v_rule_idx" ON "_section_ms_v" USING btree ("rule_id");
  CREATE INDEX "_section_cp_v_rule_idx" ON "_section_cp_v" USING btree ("rule_id");
  CREATE INDEX "_section_dd_v_groups_rule_idx" ON "_section_dd_v_groups" USING btree ("rule_id");
  CREATE INDEX "guideline_pages_blocks_column_unit_rule_idx" ON "guideline_pages_blocks_column_unit" USING btree ("rule_id");
  CREATE INDEX "guideline_pages_blocks_media_showcase_rule_idx" ON "guideline_pages_blocks_media_showcase" USING btree ("rule_id");
  CREATE INDEX "guideline_pages_blocks_color_palette_rule_idx" ON "guideline_pages_blocks_color_palette" USING btree ("rule_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_rule_idx" ON "guideline_pages_blocks_do_dont_groups" USING btree ("rule_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_rule_idx" ON "_guideline_pages_v_blocks_column_unit" USING btree ("rule_id");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_rule_idx" ON "_guideline_pages_v_blocks_media_showcase" USING btree ("rule_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_rule_idx" ON "_guideline_pages_v_blocks_color_palette" USING btree ("rule_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_rule_idx" ON "_guideline_pages_v_blocks_do_dont_groups" USING btree ("rule_id");
  CREATE INDEX "payload_locked_documents_rels_guideline_blocks_id_idx" ON "payload_locked_documents_rels" USING btree ("guideline_blocks_id");
  CREATE INDEX "payload_locked_documents_rels_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("rules_id");`)
}
