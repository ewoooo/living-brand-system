import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lgs_form" AS ENUM('horizontalA', 'horizontalB', 'vertical');
  CREATE TYPE "public"."enum_sla_type" AS ENUM('sign', 'effect');
  CREATE TYPE "public"."enum_brand_color_groups_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__brand_color_groups_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__brand_color_groups_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "cin" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "cin_locales" (
  	"lead" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "hcp" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "lgs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"form" "enum_lgs_form" DEFAULT 'horizontalA',
  	"block_name" varchar
  );
  
  CREATE TABLE "lgs_locales" (
  	"name_ko" varchar DEFAULT 'HD현대중공업',
  	"name_en" varchar DEFAULT 'HYUNDAI
  HEAVY INDUSTRIES',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "sdv" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "sdv_locales" (
  	"chapter_code" varchar,
  	"chapter_title" varchar,
  	"section_code" varchar,
  	"section_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "sla_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "sla_variants_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "sla_apps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_sla_type" DEFAULT 'sign',
  	"image_id" integer
  );
  
  CREATE TABLE "sla_apps_locales" (
  	"caption" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "sla" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cin_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cin_v_locales" (
  	"lead" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_hcp_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lgs_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"form" "enum_lgs_form" DEFAULT 'horizontalA',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lgs_v_locales" (
  	"name_ko" varchar DEFAULT 'HD현대중공업',
  	"name_en" varchar DEFAULT 'HYUNDAI
  HEAVY INDUSTRIES',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sdv_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_sdv_v_locales" (
  	"chapter_code" varchar,
  	"chapter_title" varchar,
  	"section_code" varchar,
  	"section_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sla_v_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sla_v_variants_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sla_v_apps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_sla_type" DEFAULT 'sign',
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sla_v_apps_locales" (
  	"caption" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sla_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "brand_color_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_brand_color_groups_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "brand_color_groups_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "brand_color_groups_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"brand_colors_id" integer
  );
  
  CREATE TABLE "_brand_color_groups_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__brand_color_groups_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__brand_color_groups_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_brand_color_groups_v_locales" (
  	"version_name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_brand_color_groups_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"brand_colors_id" integer
  );
  
  ALTER TABLE "brand_colors" ADD COLUMN "cmyk" varchar;
  ALTER TABLE "_brand_colors_v" ADD COLUMN "version_cmyk" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brand_color_groups_id" integer;
  ALTER TABLE "cin" ADD CONSTRAINT "cin_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cin" ADD CONSTRAINT "cin_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cin_locales" ADD CONSTRAINT "cin_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hcp" ADD CONSTRAINT "hcp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lgs" ADD CONSTRAINT "lgs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lgs_locales" ADD CONSTRAINT "lgs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lgs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sdv" ADD CONSTRAINT "sdv_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sdv_locales" ADD CONSTRAINT "sdv_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sdv"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla_variants" ADD CONSTRAINT "sla_variants_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sla_variants" ADD CONSTRAINT "sla_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sla"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla_variants_locales" ADD CONSTRAINT "sla_variants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sla_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla_apps" ADD CONSTRAINT "sla_apps_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sla_apps" ADD CONSTRAINT "sla_apps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sla"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla_apps_locales" ADD CONSTRAINT "sla_apps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sla_apps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla" ADD CONSTRAINT "sla_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cin_v" ADD CONSTRAINT "_cin_v_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cin_v" ADD CONSTRAINT "_cin_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cin_v_locales" ADD CONSTRAINT "_cin_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cin_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hcp_v" ADD CONSTRAINT "_hcp_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgs_v" ADD CONSTRAINT "_lgs_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgs_v_locales" ADD CONSTRAINT "_lgs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lgs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sdv_v" ADD CONSTRAINT "_sdv_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sdv_v_locales" ADD CONSTRAINT "_sdv_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sdv_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v_variants" ADD CONSTRAINT "_sla_v_variants_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sla_v_variants" ADD CONSTRAINT "_sla_v_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sla_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v_variants_locales" ADD CONSTRAINT "_sla_v_variants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sla_v_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v_apps" ADD CONSTRAINT "_sla_v_apps_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sla_v_apps" ADD CONSTRAINT "_sla_v_apps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sla_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v_apps_locales" ADD CONSTRAINT "_sla_v_apps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sla_v_apps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v" ADD CONSTRAINT "_sla_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_color_groups_locales" ADD CONSTRAINT "brand_color_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_color_groups_rels" ADD CONSTRAINT "brand_color_groups_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_color_groups_rels" ADD CONSTRAINT "brand_color_groups_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_brand_color_groups_v" ADD CONSTRAINT "_brand_color_groups_v_parent_id_brand_color_groups_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_brand_color_groups_v_locales" ADD CONSTRAINT "_brand_color_groups_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_brand_color_groups_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_brand_color_groups_v_rels" ADD CONSTRAINT "_brand_color_groups_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_brand_color_groups_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_brand_color_groups_v_rels" ADD CONSTRAINT "_brand_color_groups_v_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cin_order_idx" ON "cin" USING btree ("_order");
  CREATE INDEX "cin_parent_id_idx" ON "cin" USING btree ("_parent_id");
  CREATE INDEX "cin_path_idx" ON "cin" USING btree ("_path");
  CREATE INDEX "cin_logo_idx" ON "cin" USING btree ("logo_id");
  CREATE UNIQUE INDEX "cin_locales_locale_parent_id_unique" ON "cin_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hcp_order_idx" ON "hcp" USING btree ("_order");
  CREATE INDEX "hcp_parent_id_idx" ON "hcp" USING btree ("_parent_id");
  CREATE INDEX "hcp_path_idx" ON "hcp" USING btree ("_path");
  CREATE INDEX "lgs_order_idx" ON "lgs" USING btree ("_order");
  CREATE INDEX "lgs_parent_id_idx" ON "lgs" USING btree ("_parent_id");
  CREATE INDEX "lgs_path_idx" ON "lgs" USING btree ("_path");
  CREATE UNIQUE INDEX "lgs_locales_locale_parent_id_unique" ON "lgs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sdv_order_idx" ON "sdv" USING btree ("_order");
  CREATE INDEX "sdv_parent_id_idx" ON "sdv" USING btree ("_parent_id");
  CREATE INDEX "sdv_path_idx" ON "sdv" USING btree ("_path");
  CREATE UNIQUE INDEX "sdv_locales_locale_parent_id_unique" ON "sdv_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sla_variants_order_idx" ON "sla_variants" USING btree ("_order");
  CREATE INDEX "sla_variants_parent_id_idx" ON "sla_variants" USING btree ("_parent_id");
  CREATE INDEX "sla_variants_logo_idx" ON "sla_variants" USING btree ("logo_id");
  CREATE UNIQUE INDEX "sla_variants_locales_locale_parent_id_unique" ON "sla_variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sla_apps_order_idx" ON "sla_apps" USING btree ("_order");
  CREATE INDEX "sla_apps_parent_id_idx" ON "sla_apps" USING btree ("_parent_id");
  CREATE INDEX "sla_apps_image_idx" ON "sla_apps" USING btree ("image_id");
  CREATE UNIQUE INDEX "sla_apps_locales_locale_parent_id_unique" ON "sla_apps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sla_order_idx" ON "sla" USING btree ("_order");
  CREATE INDEX "sla_parent_id_idx" ON "sla" USING btree ("_parent_id");
  CREATE INDEX "sla_path_idx" ON "sla" USING btree ("_path");
  CREATE INDEX "_cin_v_order_idx" ON "_cin_v" USING btree ("_order");
  CREATE INDEX "_cin_v_parent_id_idx" ON "_cin_v" USING btree ("_parent_id");
  CREATE INDEX "_cin_v_path_idx" ON "_cin_v" USING btree ("_path");
  CREATE INDEX "_cin_v_logo_idx" ON "_cin_v" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_cin_v_locales_locale_parent_id_unique" ON "_cin_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hcp_v_order_idx" ON "_hcp_v" USING btree ("_order");
  CREATE INDEX "_hcp_v_parent_id_idx" ON "_hcp_v" USING btree ("_parent_id");
  CREATE INDEX "_hcp_v_path_idx" ON "_hcp_v" USING btree ("_path");
  CREATE INDEX "_lgs_v_order_idx" ON "_lgs_v" USING btree ("_order");
  CREATE INDEX "_lgs_v_parent_id_idx" ON "_lgs_v" USING btree ("_parent_id");
  CREATE INDEX "_lgs_v_path_idx" ON "_lgs_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_lgs_v_locales_locale_parent_id_unique" ON "_lgs_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sdv_v_order_idx" ON "_sdv_v" USING btree ("_order");
  CREATE INDEX "_sdv_v_parent_id_idx" ON "_sdv_v" USING btree ("_parent_id");
  CREATE INDEX "_sdv_v_path_idx" ON "_sdv_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_sdv_v_locales_locale_parent_id_unique" ON "_sdv_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sla_v_variants_order_idx" ON "_sla_v_variants" USING btree ("_order");
  CREATE INDEX "_sla_v_variants_parent_id_idx" ON "_sla_v_variants" USING btree ("_parent_id");
  CREATE INDEX "_sla_v_variants_logo_idx" ON "_sla_v_variants" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_sla_v_variants_locales_locale_parent_id_unique" ON "_sla_v_variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sla_v_apps_order_idx" ON "_sla_v_apps" USING btree ("_order");
  CREATE INDEX "_sla_v_apps_parent_id_idx" ON "_sla_v_apps" USING btree ("_parent_id");
  CREATE INDEX "_sla_v_apps_image_idx" ON "_sla_v_apps" USING btree ("image_id");
  CREATE UNIQUE INDEX "_sla_v_apps_locales_locale_parent_id_unique" ON "_sla_v_apps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sla_v_order_idx" ON "_sla_v" USING btree ("_order");
  CREATE INDEX "_sla_v_parent_id_idx" ON "_sla_v" USING btree ("_parent_id");
  CREATE INDEX "_sla_v_path_idx" ON "_sla_v" USING btree ("_path");
  CREATE INDEX "brand_color_groups_updated_at_idx" ON "brand_color_groups" USING btree ("updated_at");
  CREATE INDEX "brand_color_groups_created_at_idx" ON "brand_color_groups" USING btree ("created_at");
  CREATE INDEX "brand_color_groups__status_idx" ON "brand_color_groups" USING btree ("_status");
  CREATE UNIQUE INDEX "brand_color_groups_locales_locale_parent_id_unique" ON "brand_color_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "brand_color_groups_rels_order_idx" ON "brand_color_groups_rels" USING btree ("order");
  CREATE INDEX "brand_color_groups_rels_parent_idx" ON "brand_color_groups_rels" USING btree ("parent_id");
  CREATE INDEX "brand_color_groups_rels_path_idx" ON "brand_color_groups_rels" USING btree ("path");
  CREATE INDEX "brand_color_groups_rels_brand_colors_id_idx" ON "brand_color_groups_rels" USING btree ("brand_colors_id");
  CREATE INDEX "_brand_color_groups_v_parent_idx" ON "_brand_color_groups_v" USING btree ("parent_id");
  CREATE INDEX "_brand_color_groups_v_version_version_updated_at_idx" ON "_brand_color_groups_v" USING btree ("version_updated_at");
  CREATE INDEX "_brand_color_groups_v_version_version_created_at_idx" ON "_brand_color_groups_v" USING btree ("version_created_at");
  CREATE INDEX "_brand_color_groups_v_version_version__status_idx" ON "_brand_color_groups_v" USING btree ("version__status");
  CREATE INDEX "_brand_color_groups_v_created_at_idx" ON "_brand_color_groups_v" USING btree ("created_at");
  CREATE INDEX "_brand_color_groups_v_updated_at_idx" ON "_brand_color_groups_v" USING btree ("updated_at");
  CREATE INDEX "_brand_color_groups_v_snapshot_idx" ON "_brand_color_groups_v" USING btree ("snapshot");
  CREATE INDEX "_brand_color_groups_v_published_locale_idx" ON "_brand_color_groups_v" USING btree ("published_locale");
  CREATE INDEX "_brand_color_groups_v_latest_idx" ON "_brand_color_groups_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_brand_color_groups_v_locales_locale_parent_id_unique" ON "_brand_color_groups_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_brand_color_groups_v_rels_order_idx" ON "_brand_color_groups_v_rels" USING btree ("order");
  CREATE INDEX "_brand_color_groups_v_rels_parent_idx" ON "_brand_color_groups_v_rels" USING btree ("parent_id");
  CREATE INDEX "_brand_color_groups_v_rels_path_idx" ON "_brand_color_groups_v_rels" USING btree ("path");
  CREATE INDEX "_brand_color_groups_v_rels_brand_colors_id_idx" ON "_brand_color_groups_v_rels" USING btree ("brand_colors_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_color_groups_fk" FOREIGN KEY ("brand_color_groups_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_brand_color_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_color_groups_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cin" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cin_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hcp" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lgs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lgs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sdv" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sdv_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla_variants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla_apps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla_apps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cin_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cin_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hcp_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lgs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lgs_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sdv_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sdv_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v_variants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v_apps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v_apps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "brand_color_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "brand_color_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "brand_color_groups_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_brand_color_groups_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_brand_color_groups_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_brand_color_groups_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cin" CASCADE;
  DROP TABLE "cin_locales" CASCADE;
  DROP TABLE "hcp" CASCADE;
  DROP TABLE "lgs" CASCADE;
  DROP TABLE "lgs_locales" CASCADE;
  DROP TABLE "sdv" CASCADE;
  DROP TABLE "sdv_locales" CASCADE;
  DROP TABLE "sla_variants" CASCADE;
  DROP TABLE "sla_variants_locales" CASCADE;
  DROP TABLE "sla_apps" CASCADE;
  DROP TABLE "sla_apps_locales" CASCADE;
  DROP TABLE "sla" CASCADE;
  DROP TABLE "_cin_v" CASCADE;
  DROP TABLE "_cin_v_locales" CASCADE;
  DROP TABLE "_hcp_v" CASCADE;
  DROP TABLE "_lgs_v" CASCADE;
  DROP TABLE "_lgs_v_locales" CASCADE;
  DROP TABLE "_sdv_v" CASCADE;
  DROP TABLE "_sdv_v_locales" CASCADE;
  DROP TABLE "_sla_v_variants" CASCADE;
  DROP TABLE "_sla_v_variants_locales" CASCADE;
  DROP TABLE "_sla_v_apps" CASCADE;
  DROP TABLE "_sla_v_apps_locales" CASCADE;
  DROP TABLE "_sla_v" CASCADE;
  DROP TABLE "brand_color_groups" CASCADE;
  DROP TABLE "brand_color_groups_locales" CASCADE;
  DROP TABLE "brand_color_groups_rels" CASCADE;
  DROP TABLE "_brand_color_groups_v" CASCADE;
  DROP TABLE "_brand_color_groups_v_locales" CASCADE;
  DROP TABLE "_brand_color_groups_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brand_color_groups_fk";
  
  DROP INDEX "payload_locked_documents_rels_brand_color_groups_id_idx";
  ALTER TABLE "brand_colors" DROP COLUMN "cmyk";
  ALTER TABLE "_brand_colors_v" DROP COLUMN "version_cmyk";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brand_color_groups_id";
  DROP TYPE "public"."enum_lgs_form";
  DROP TYPE "public"."enum_sla_type";
  DROP TYPE "public"."enum_brand_color_groups_status";
  DROP TYPE "public"."enum__brand_color_groups_v_version_status";
  DROP TYPE "public"."enum__brand_color_groups_v_published_locale";`)
}
