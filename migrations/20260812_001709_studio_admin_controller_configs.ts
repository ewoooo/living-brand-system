import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_graphic_profiles_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_graphic_profiles_runtime" AS ENUM('forward-straight');
  CREATE TYPE "public"."enum_graphic_profiles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__graphic_profiles_v_version_runtime" AS ENUM('forward-straight');
  CREATE TYPE "public"."enum__graphic_profiles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__graphic_profiles_v_published_locale" AS ENUM('ko', 'en');
  CREATE TYPE "public"."enum_templates_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_templates_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__templates_v_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TABLE "graphic_profiles_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_text_availability" DEFAULT 'enabled',
	"default_value" varchar DEFAULT '',
	"multiline" boolean DEFAULT false,
	"max_length" numeric,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_toggle_availability" DEFAULT 'enabled',
	"default_value" boolean DEFAULT false,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_select_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_color_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_range_availability" DEFAULT 'enabled',
	"default_value" numeric DEFAULT 0,
	"min" numeric DEFAULT 0,
	"max" numeric DEFAULT 1,
	"step" numeric DEFAULT 0.01,
	"display_unit" varchar,
	"display_precision" numeric,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_graphic_profiles_blocks_pad_availability" DEFAULT 'enabled',
	"default_value_x" numeric DEFAULT 0,
	"default_value_y" numeric DEFAULT 0,
	"aspect_ratio" numeric,
	"block_name" varchar
  );

  CREATE TABLE "graphic_profiles_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean DEFAULT false,
	"default_open" boolean
  );

  CREATE TABLE "graphic_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"runtime" "enum_graphic_profiles_runtime",
	"display_order" numeric DEFAULT 0,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_graphic_profiles_status" DEFAULT 'draft'
  );

  CREATE TABLE "_graphic_profiles_v_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_text_availability" DEFAULT 'enabled',
	"default_value" varchar DEFAULT '',
	"multiline" boolean DEFAULT false,
	"max_length" numeric,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_toggle_availability" DEFAULT 'enabled',
	"default_value" boolean DEFAULT false,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_select_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_color_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_range_availability" DEFAULT 'enabled',
	"default_value" numeric DEFAULT 0,
	"min" numeric DEFAULT 0,
	"max" numeric DEFAULT 1,
	"step" numeric DEFAULT 0.01,
	"display_unit" varchar,
	"display_precision" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__graphic_profiles_v_blocks_pad_availability" DEFAULT 'enabled',
	"default_value_x" numeric DEFAULT 0,
	"default_value_y" numeric DEFAULT 0,
	"aspect_ratio" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_graphic_profiles_v_version_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean DEFAULT false,
	"default_open" boolean,
	"_uuid" varchar
  );

  CREATE TABLE "_graphic_profiles_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_name" varchar,
	"version_runtime" "enum__graphic_profiles_v_version_runtime",
	"version_display_order" numeric DEFAULT 0,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__graphic_profiles_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__graphic_profiles_v_published_locale",
	"latest" boolean
  );

  CREATE TABLE "templates_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_text_availability" DEFAULT 'enabled',
	"default_value" varchar DEFAULT '',
	"multiline" boolean DEFAULT false,
	"max_length" numeric,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_toggle_availability" DEFAULT 'enabled',
	"default_value" boolean DEFAULT false,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar
  );

  CREATE TABLE "templates_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_select_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"placeholder" varchar,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_color_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_range_availability" DEFAULT 'enabled',
	"default_value" numeric DEFAULT 0,
	"min" numeric DEFAULT 0,
	"max" numeric DEFAULT 1,
	"step" numeric DEFAULT 0.01,
	"display_unit" varchar,
	"display_precision" numeric,
	"block_name" varchar
  );

  CREATE TABLE "templates_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum_templates_blocks_pad_availability" DEFAULT 'enabled',
	"default_value_x" numeric DEFAULT 0,
	"default_value_y" numeric DEFAULT 0,
	"aspect_ratio" numeric,
	"block_name" varchar
  );

  CREATE TABLE "templates_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean DEFAULT false,
	"default_open" boolean
  );

  CREATE TABLE "_templates_v_blocks_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_text_availability" DEFAULT 'enabled',
	"default_value" varchar DEFAULT '',
	"multiline" boolean DEFAULT false,
	"max_length" numeric,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_toggle" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_toggle_availability" DEFAULT 'enabled',
	"default_value" boolean DEFAULT false,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_select_options" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar,
	"label" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_templates_v_blocks_select" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_select_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"placeholder" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_color" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_color_availability" DEFAULT 'enabled',
	"default_value" varchar,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_range" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_range_availability" DEFAULT 'enabled',
	"default_value" numeric DEFAULT 0,
	"min" numeric DEFAULT 0,
	"max" numeric DEFAULT 1,
	"step" numeric DEFAULT 0.01,
	"display_unit" varchar,
	"display_precision" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_blocks_pad" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"label" varchar,
	"availability" "enum__templates_v_blocks_pad_availability" DEFAULT 'enabled',
	"default_value_x" numeric DEFAULT 0,
	"default_value_y" numeric DEFAULT 0,
	"aspect_ratio" numeric,
	"_uuid" varchar,
	"block_name" varchar
  );

  CREATE TABLE "_templates_v_version_controller_groups" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"title" varchar,
	"collapsible" boolean DEFAULT false,
	"default_open" boolean,
	"_uuid" varchar
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "graphic_profiles_id" integer;
  ALTER TABLE "graphic_profiles_blocks_text" ADD CONSTRAINT "graphic_profiles_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_toggle" ADD CONSTRAINT "graphic_profiles_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_select_options" ADD CONSTRAINT "graphic_profiles_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_select" ADD CONSTRAINT "graphic_profiles_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_color" ADD CONSTRAINT "graphic_profiles_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_range" ADD CONSTRAINT "graphic_profiles_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_blocks_pad" ADD CONSTRAINT "graphic_profiles_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_controller_groups" ADD CONSTRAINT "graphic_profiles_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_text" ADD CONSTRAINT "_graphic_profiles_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_toggle" ADD CONSTRAINT "_graphic_profiles_v_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_select_options" ADD CONSTRAINT "_graphic_profiles_v_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_select" ADD CONSTRAINT "_graphic_profiles_v_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_color" ADD CONSTRAINT "_graphic_profiles_v_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_range" ADD CONSTRAINT "_graphic_profiles_v_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_blocks_pad" ADD CONSTRAINT "_graphic_profiles_v_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_version_controller_groups" ADD CONSTRAINT "_graphic_profiles_v_version_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v" ADD CONSTRAINT "_graphic_profiles_v_parent_id_graphic_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "templates_blocks_text" ADD CONSTRAINT "templates_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_toggle" ADD CONSTRAINT "templates_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_select_options" ADD CONSTRAINT "templates_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_select" ADD CONSTRAINT "templates_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_color" ADD CONSTRAINT "templates_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_range" ADD CONSTRAINT "templates_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_blocks_pad" ADD CONSTRAINT "templates_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_controller_groups" ADD CONSTRAINT "templates_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_text" ADD CONSTRAINT "_templates_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_toggle" ADD CONSTRAINT "_templates_v_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_select_options" ADD CONSTRAINT "_templates_v_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_select" ADD CONSTRAINT "_templates_v_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_color" ADD CONSTRAINT "_templates_v_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_range" ADD CONSTRAINT "_templates_v_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_blocks_pad" ADD CONSTRAINT "_templates_v_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_controller_groups" ADD CONSTRAINT "_templates_v_version_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "graphic_profiles_blocks_text_order_idx" ON "graphic_profiles_blocks_text" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_text_parent_id_idx" ON "graphic_profiles_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_text_path_idx" ON "graphic_profiles_blocks_text" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_toggle_order_idx" ON "graphic_profiles_blocks_toggle" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_toggle_parent_id_idx" ON "graphic_profiles_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_toggle_path_idx" ON "graphic_profiles_blocks_toggle" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_select_options_order_idx" ON "graphic_profiles_blocks_select_options" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_select_options_parent_id_idx" ON "graphic_profiles_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_select_order_idx" ON "graphic_profiles_blocks_select" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_select_parent_id_idx" ON "graphic_profiles_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_select_path_idx" ON "graphic_profiles_blocks_select" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_color_order_idx" ON "graphic_profiles_blocks_color" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_color_parent_id_idx" ON "graphic_profiles_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_color_path_idx" ON "graphic_profiles_blocks_color" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_range_order_idx" ON "graphic_profiles_blocks_range" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_range_parent_id_idx" ON "graphic_profiles_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_range_path_idx" ON "graphic_profiles_blocks_range" USING btree ("_path");
  CREATE INDEX "graphic_profiles_blocks_pad_order_idx" ON "graphic_profiles_blocks_pad" USING btree ("_order");
  CREATE INDEX "graphic_profiles_blocks_pad_parent_id_idx" ON "graphic_profiles_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "graphic_profiles_blocks_pad_path_idx" ON "graphic_profiles_blocks_pad" USING btree ("_path");
  CREATE INDEX "graphic_profiles_controller_groups_order_idx" ON "graphic_profiles_controller_groups" USING btree ("_order");
  CREATE INDEX "graphic_profiles_controller_groups_parent_id_idx" ON "graphic_profiles_controller_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "graphic_profiles_runtime_idx" ON "graphic_profiles" USING btree ("runtime");
  CREATE INDEX "graphic_profiles_updated_at_idx" ON "graphic_profiles" USING btree ("updated_at");
  CREATE INDEX "graphic_profiles_created_at_idx" ON "graphic_profiles" USING btree ("created_at");
  CREATE INDEX "graphic_profiles__status_idx" ON "graphic_profiles" USING btree ("_status");
  CREATE INDEX "_graphic_profiles_v_blocks_text_order_idx" ON "_graphic_profiles_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_text_parent_id_idx" ON "_graphic_profiles_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_text_path_idx" ON "_graphic_profiles_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_toggle_order_idx" ON "_graphic_profiles_v_blocks_toggle" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_toggle_parent_id_idx" ON "_graphic_profiles_v_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_toggle_path_idx" ON "_graphic_profiles_v_blocks_toggle" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_select_options_order_idx" ON "_graphic_profiles_v_blocks_select_options" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_select_options_parent_id_idx" ON "_graphic_profiles_v_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_select_order_idx" ON "_graphic_profiles_v_blocks_select" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_select_parent_id_idx" ON "_graphic_profiles_v_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_select_path_idx" ON "_graphic_profiles_v_blocks_select" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_color_order_idx" ON "_graphic_profiles_v_blocks_color" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_color_parent_id_idx" ON "_graphic_profiles_v_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_color_path_idx" ON "_graphic_profiles_v_blocks_color" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_range_order_idx" ON "_graphic_profiles_v_blocks_range" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_range_parent_id_idx" ON "_graphic_profiles_v_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_range_path_idx" ON "_graphic_profiles_v_blocks_range" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_blocks_pad_order_idx" ON "_graphic_profiles_v_blocks_pad" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_blocks_pad_parent_id_idx" ON "_graphic_profiles_v_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_blocks_pad_path_idx" ON "_graphic_profiles_v_blocks_pad" USING btree ("_path");
  CREATE INDEX "_graphic_profiles_v_version_controller_groups_order_idx" ON "_graphic_profiles_v_version_controller_groups" USING btree ("_order");
  CREATE INDEX "_graphic_profiles_v_version_controller_groups_parent_id_idx" ON "_graphic_profiles_v_version_controller_groups" USING btree ("_parent_id");
  CREATE INDEX "_graphic_profiles_v_parent_idx" ON "_graphic_profiles_v" USING btree ("parent_id");
  CREATE INDEX "_graphic_profiles_v_version_version_runtime_idx" ON "_graphic_profiles_v" USING btree ("version_runtime");
  CREATE INDEX "_graphic_profiles_v_version_version_updated_at_idx" ON "_graphic_profiles_v" USING btree ("version_updated_at");
  CREATE INDEX "_graphic_profiles_v_version_version_created_at_idx" ON "_graphic_profiles_v" USING btree ("version_created_at");
  CREATE INDEX "_graphic_profiles_v_version_version__status_idx" ON "_graphic_profiles_v" USING btree ("version__status");
  CREATE INDEX "_graphic_profiles_v_created_at_idx" ON "_graphic_profiles_v" USING btree ("created_at");
  CREATE INDEX "_graphic_profiles_v_updated_at_idx" ON "_graphic_profiles_v" USING btree ("updated_at");
  CREATE INDEX "_graphic_profiles_v_snapshot_idx" ON "_graphic_profiles_v" USING btree ("snapshot");
  CREATE INDEX "_graphic_profiles_v_published_locale_idx" ON "_graphic_profiles_v" USING btree ("published_locale");
  CREATE INDEX "_graphic_profiles_v_latest_idx" ON "_graphic_profiles_v" USING btree ("latest");
  CREATE INDEX "templates_blocks_text_order_idx" ON "templates_blocks_text" USING btree ("_order");
  CREATE INDEX "templates_blocks_text_parent_id_idx" ON "templates_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_text_path_idx" ON "templates_blocks_text" USING btree ("_path");
  CREATE INDEX "templates_blocks_toggle_order_idx" ON "templates_blocks_toggle" USING btree ("_order");
  CREATE INDEX "templates_blocks_toggle_parent_id_idx" ON "templates_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_toggle_path_idx" ON "templates_blocks_toggle" USING btree ("_path");
  CREATE INDEX "templates_blocks_select_options_order_idx" ON "templates_blocks_select_options" USING btree ("_order");
  CREATE INDEX "templates_blocks_select_options_parent_id_idx" ON "templates_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_select_order_idx" ON "templates_blocks_select" USING btree ("_order");
  CREATE INDEX "templates_blocks_select_parent_id_idx" ON "templates_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_select_path_idx" ON "templates_blocks_select" USING btree ("_path");
  CREATE INDEX "templates_blocks_color_order_idx" ON "templates_blocks_color" USING btree ("_order");
  CREATE INDEX "templates_blocks_color_parent_id_idx" ON "templates_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_color_path_idx" ON "templates_blocks_color" USING btree ("_path");
  CREATE INDEX "templates_blocks_range_order_idx" ON "templates_blocks_range" USING btree ("_order");
  CREATE INDEX "templates_blocks_range_parent_id_idx" ON "templates_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_range_path_idx" ON "templates_blocks_range" USING btree ("_path");
  CREATE INDEX "templates_blocks_pad_order_idx" ON "templates_blocks_pad" USING btree ("_order");
  CREATE INDEX "templates_blocks_pad_parent_id_idx" ON "templates_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "templates_blocks_pad_path_idx" ON "templates_blocks_pad" USING btree ("_path");
  CREATE INDEX "templates_controller_groups_order_idx" ON "templates_controller_groups" USING btree ("_order");
  CREATE INDEX "templates_controller_groups_parent_id_idx" ON "templates_controller_groups" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_text_order_idx" ON "_templates_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_text_parent_id_idx" ON "_templates_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_text_path_idx" ON "_templates_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_toggle_order_idx" ON "_templates_v_blocks_toggle" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_toggle_parent_id_idx" ON "_templates_v_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_toggle_path_idx" ON "_templates_v_blocks_toggle" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_select_options_order_idx" ON "_templates_v_blocks_select_options" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_select_options_parent_id_idx" ON "_templates_v_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_select_order_idx" ON "_templates_v_blocks_select" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_select_parent_id_idx" ON "_templates_v_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_select_path_idx" ON "_templates_v_blocks_select" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_color_order_idx" ON "_templates_v_blocks_color" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_color_parent_id_idx" ON "_templates_v_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_color_path_idx" ON "_templates_v_blocks_color" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_range_order_idx" ON "_templates_v_blocks_range" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_range_parent_id_idx" ON "_templates_v_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_range_path_idx" ON "_templates_v_blocks_range" USING btree ("_path");
  CREATE INDEX "_templates_v_blocks_pad_order_idx" ON "_templates_v_blocks_pad" USING btree ("_order");
  CREATE INDEX "_templates_v_blocks_pad_parent_id_idx" ON "_templates_v_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "_templates_v_blocks_pad_path_idx" ON "_templates_v_blocks_pad" USING btree ("_path");
  CREATE INDEX "_templates_v_version_controller_groups_order_idx" ON "_templates_v_version_controller_groups" USING btree ("_order");
  CREATE INDEX "_templates_v_version_controller_groups_parent_id_idx" ON "_templates_v_version_controller_groups" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_graphic_profiles_fk" FOREIGN KEY ("graphic_profiles_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_graphic_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("graphic_profiles_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "graphic_profiles_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles_controller_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "graphic_profiles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v_version_controller_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_graphic_profiles_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_controller_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_color" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_range" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_blocks_pad" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_version_controller_groups" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "graphic_profiles_blocks_text" CASCADE;
  DROP TABLE "graphic_profiles_blocks_toggle" CASCADE;
  DROP TABLE "graphic_profiles_blocks_select_options" CASCADE;
  DROP TABLE "graphic_profiles_blocks_select" CASCADE;
  DROP TABLE "graphic_profiles_blocks_color" CASCADE;
  DROP TABLE "graphic_profiles_blocks_range" CASCADE;
  DROP TABLE "graphic_profiles_blocks_pad" CASCADE;
  DROP TABLE "graphic_profiles_controller_groups" CASCADE;
  DROP TABLE "graphic_profiles" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_text" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_toggle" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_select_options" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_select" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_color" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_range" CASCADE;
  DROP TABLE "_graphic_profiles_v_blocks_pad" CASCADE;
  DROP TABLE "_graphic_profiles_v_version_controller_groups" CASCADE;
  DROP TABLE "_graphic_profiles_v" CASCADE;
  DROP TABLE "templates_blocks_text" CASCADE;
  DROP TABLE "templates_blocks_toggle" CASCADE;
  DROP TABLE "templates_blocks_select_options" CASCADE;
  DROP TABLE "templates_blocks_select" CASCADE;
  DROP TABLE "templates_blocks_color" CASCADE;
  DROP TABLE "templates_blocks_range" CASCADE;
  DROP TABLE "templates_blocks_pad" CASCADE;
  DROP TABLE "templates_controller_groups" CASCADE;
  DROP TABLE "_templates_v_blocks_text" CASCADE;
  DROP TABLE "_templates_v_blocks_toggle" CASCADE;
  DROP TABLE "_templates_v_blocks_select_options" CASCADE;
  DROP TABLE "_templates_v_blocks_select" CASCADE;
  DROP TABLE "_templates_v_blocks_color" CASCADE;
  DROP TABLE "_templates_v_blocks_range" CASCADE;
  DROP TABLE "_templates_v_blocks_pad" CASCADE;
  DROP TABLE "_templates_v_version_controller_groups" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_graphic_profiles_fk";

  DROP INDEX "payload_locked_documents_rels_graphic_profiles_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "graphic_profiles_id";
  DROP TYPE "public"."enum_graphic_profiles_blocks_text_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_toggle_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_select_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_color_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_range_availability";
  DROP TYPE "public"."enum_graphic_profiles_blocks_pad_availability";
  DROP TYPE "public"."enum_graphic_profiles_runtime";
  DROP TYPE "public"."enum_graphic_profiles_status";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_text_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_toggle_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_select_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_color_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_range_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_blocks_pad_availability";
  DROP TYPE "public"."enum__graphic_profiles_v_version_runtime";
  DROP TYPE "public"."enum__graphic_profiles_v_version_status";
  DROP TYPE "public"."enum__graphic_profiles_v_published_locale";
  DROP TYPE "public"."enum_templates_blocks_text_availability";
  DROP TYPE "public"."enum_templates_blocks_toggle_availability";
  DROP TYPE "public"."enum_templates_blocks_select_availability";
  DROP TYPE "public"."enum_templates_blocks_color_availability";
  DROP TYPE "public"."enum_templates_blocks_range_availability";
  DROP TYPE "public"."enum_templates_blocks_pad_availability";
  DROP TYPE "public"."enum__templates_v_blocks_text_availability";
  DROP TYPE "public"."enum__templates_v_blocks_toggle_availability";
  DROP TYPE "public"."enum__templates_v_blocks_select_availability";
  DROP TYPE "public"."enum__templates_v_blocks_color_availability";
  DROP TYPE "public"."enum__templates_v_blocks_range_availability";
  DROP TYPE "public"."enum__templates_v_blocks_pad_availability";`)
}
