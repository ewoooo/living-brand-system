import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_image_profiles_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum_image_profiles_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_text_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_toggle_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_select_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_color_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_range_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TYPE "public"."enum__image_profiles_v_blocks_pad_availability" AS ENUM('enabled', 'readonly', 'disabled');
  CREATE TABLE "image_profiles_blocks_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum_image_profiles_blocks_text_availability" DEFAULT 'enabled',
    "default_value" varchar DEFAULT '',
    "multiline" boolean DEFAULT false,
    "max_length" numeric,
    "placeholder" varchar,
    "block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_toggle" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum_image_profiles_blocks_toggle_availability" DEFAULT 'enabled',
    "default_value" boolean DEFAULT false,
    "block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_select_options" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar,
    "label" varchar
  );

  CREATE TABLE "image_profiles_blocks_select" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum_image_profiles_blocks_select_availability" DEFAULT 'enabled',
    "default_value" varchar,
    "placeholder" varchar,
    "block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_color" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum_image_profiles_blocks_color_availability" DEFAULT 'enabled',
    "default_value" varchar,
    "block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_range" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum_image_profiles_blocks_range_availability" DEFAULT 'enabled',
    "default_value" numeric DEFAULT 0,
    "min" numeric DEFAULT 0,
    "max" numeric DEFAULT 1,
    "step" numeric DEFAULT 0.01,
    "display_unit" varchar,
    "display_precision" numeric,
    "block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_pad" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum_image_profiles_blocks_pad_availability" DEFAULT 'enabled',
    "default_value_x" numeric DEFAULT 0,
    "default_value_y" numeric DEFAULT 0,
    "aspect_ratio" numeric,
    "block_name" varchar
  );

  CREATE TABLE "image_profiles_controller_groups" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "title" varchar,
    "collapsible" boolean DEFAULT false,
    "default_open" boolean
  );

  CREATE TABLE "_image_profiles_v_blocks_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum__image_profiles_v_blocks_text_availability" DEFAULT 'enabled',
    "default_value" varchar DEFAULT '',
    "multiline" boolean DEFAULT false,
    "max_length" numeric,
    "placeholder" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_toggle" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum__image_profiles_v_blocks_toggle_availability" DEFAULT 'enabled',
    "default_value" boolean DEFAULT false,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_select_options" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "value" varchar,
    "label" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_select" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum__image_profiles_v_blocks_select_availability" DEFAULT 'enabled',
    "default_value" varchar,
    "placeholder" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_color" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum__image_profiles_v_blocks_color_availability" DEFAULT 'enabled',
    "default_value" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_range" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum__image_profiles_v_blocks_range_availability" DEFAULT 'enabled',
    "default_value" numeric DEFAULT 0,
    "min" numeric DEFAULT 0,
    "max" numeric DEFAULT 1,
    "step" numeric DEFAULT 0.01,
    "display_unit" varchar,
    "display_precision" numeric,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_pad" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label" varchar,
    "availability" "enum__image_profiles_v_blocks_pad_availability" DEFAULT 'enabled',
    "default_value_x" numeric DEFAULT 0,
    "default_value_y" numeric DEFAULT 0,
    "aspect_ratio" numeric,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_version_controller_groups" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "title" varchar,
    "collapsible" boolean DEFAULT false,
    "default_open" boolean,
    "_uuid" varchar
  );

  ALTER TABLE "image_profiles_blocks_text" ADD CONSTRAINT "image_profiles_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_toggle" ADD CONSTRAINT "image_profiles_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_select_options" ADD CONSTRAINT "image_profiles_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_select" ADD CONSTRAINT "image_profiles_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_color" ADD CONSTRAINT "image_profiles_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_range" ADD CONSTRAINT "image_profiles_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_pad" ADD CONSTRAINT "image_profiles_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_controller_groups" ADD CONSTRAINT "image_profiles_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_text" ADD CONSTRAINT "_image_profiles_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_toggle" ADD CONSTRAINT "_image_profiles_v_blocks_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_select_options" ADD CONSTRAINT "_image_profiles_v_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_select" ADD CONSTRAINT "_image_profiles_v_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_color" ADD CONSTRAINT "_image_profiles_v_blocks_color_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_range" ADD CONSTRAINT "_image_profiles_v_blocks_range_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_pad" ADD CONSTRAINT "_image_profiles_v_blocks_pad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_version_controller_groups" ADD CONSTRAINT "_image_profiles_v_version_controller_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "image_profiles_blocks_text_order_idx" ON "image_profiles_blocks_text" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_text_parent_id_idx" ON "image_profiles_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_text_path_idx" ON "image_profiles_blocks_text" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_toggle_order_idx" ON "image_profiles_blocks_toggle" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_toggle_parent_id_idx" ON "image_profiles_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_toggle_path_idx" ON "image_profiles_blocks_toggle" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_select_options_order_idx" ON "image_profiles_blocks_select_options" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_select_options_parent_id_idx" ON "image_profiles_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_select_order_idx" ON "image_profiles_blocks_select" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_select_parent_id_idx" ON "image_profiles_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_select_path_idx" ON "image_profiles_blocks_select" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_color_order_idx" ON "image_profiles_blocks_color" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_color_parent_id_idx" ON "image_profiles_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_color_path_idx" ON "image_profiles_blocks_color" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_range_order_idx" ON "image_profiles_blocks_range" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_range_parent_id_idx" ON "image_profiles_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_range_path_idx" ON "image_profiles_blocks_range" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_pad_order_idx" ON "image_profiles_blocks_pad" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_pad_parent_id_idx" ON "image_profiles_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_pad_path_idx" ON "image_profiles_blocks_pad" USING btree ("_path");
  CREATE INDEX "image_profiles_controller_groups_order_idx" ON "image_profiles_controller_groups" USING btree ("_order");
  CREATE INDEX "image_profiles_controller_groups_parent_id_idx" ON "image_profiles_controller_groups" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_text_order_idx" ON "_image_profiles_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_text_parent_id_idx" ON "_image_profiles_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_text_path_idx" ON "_image_profiles_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_toggle_order_idx" ON "_image_profiles_v_blocks_toggle" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_toggle_parent_id_idx" ON "_image_profiles_v_blocks_toggle" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_toggle_path_idx" ON "_image_profiles_v_blocks_toggle" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_select_options_order_idx" ON "_image_profiles_v_blocks_select_options" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_select_options_parent_id_idx" ON "_image_profiles_v_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_select_order_idx" ON "_image_profiles_v_blocks_select" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_select_parent_id_idx" ON "_image_profiles_v_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_select_path_idx" ON "_image_profiles_v_blocks_select" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_color_order_idx" ON "_image_profiles_v_blocks_color" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_color_parent_id_idx" ON "_image_profiles_v_blocks_color" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_color_path_idx" ON "_image_profiles_v_blocks_color" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_range_order_idx" ON "_image_profiles_v_blocks_range" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_range_parent_id_idx" ON "_image_profiles_v_blocks_range" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_range_path_idx" ON "_image_profiles_v_blocks_range" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_pad_order_idx" ON "_image_profiles_v_blocks_pad" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_pad_parent_id_idx" ON "_image_profiles_v_blocks_pad" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_pad_path_idx" ON "_image_profiles_v_blocks_pad" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_version_controller_groups_order_idx" ON "_image_profiles_v_version_controller_groups" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_version_controller_groups_parent_id_idx" ON "_image_profiles_v_version_controller_groups" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "image_profiles_blocks_text" CASCADE;
  DROP TABLE "image_profiles_blocks_toggle" CASCADE;
  DROP TABLE "image_profiles_blocks_select_options" CASCADE;
  DROP TABLE "image_profiles_blocks_select" CASCADE;
  DROP TABLE "image_profiles_blocks_color" CASCADE;
  DROP TABLE "image_profiles_blocks_range" CASCADE;
  DROP TABLE "image_profiles_blocks_pad" CASCADE;
  DROP TABLE "image_profiles_controller_groups" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_text" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_toggle" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_select_options" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_select" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_color" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_range" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_pad" CASCADE;
  DROP TABLE "_image_profiles_v_version_controller_groups" CASCADE;
  DROP TYPE "public"."enum_image_profiles_blocks_text_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_toggle_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_select_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_color_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_range_availability";
  DROP TYPE "public"."enum_image_profiles_blocks_pad_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_text_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_toggle_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_select_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_color_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_range_availability";
  DROP TYPE "public"."enum__image_profiles_v_blocks_pad_availability";`)
}
