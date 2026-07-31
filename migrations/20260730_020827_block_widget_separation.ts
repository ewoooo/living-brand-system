import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_block_width" AS ENUM('padded', 'full');
  CREATE TYPE "public"."enum_block_arrangement" AS ENUM('grid', 'carousel', 'featured', 'masonry');
  CREATE TYPE "public"."enum_block_aspect_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16');
  CREATE TABLE "img" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "cpw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "car" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "cpr" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "cprr" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "glw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "icw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "imw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "lgw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "lgo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "lgv" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "lvw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "msw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "scs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "tsc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "tsp" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "blk" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_block_width" DEFAULT 'padded',
  	"arrangement" "enum_block_arrangement" DEFAULT 'grid',
  	"columns" numeric DEFAULT 2,
  	"aspect_ratio" "enum_block_aspect_ratio" DEFAULT '1:1',
  	"block_name" varchar
  );
  
  CREATE TABLE "blk_locales" (
  	"title" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_img_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cpw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_car_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cpr_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cprr_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_glw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_icw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_imw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lgw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lgo_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lgv_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lvw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_msw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_scs_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_tsc_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_tsp_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_blk_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum_block_width" DEFAULT 'padded',
  	"arrangement" "enum_block_arrangement" DEFAULT 'grid',
  	"columns" numeric DEFAULT 2,
  	"aspect_ratio" "enum_block_aspect_ratio" DEFAULT '1:1',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_blk_v_locales" (
  	"title" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "img" ADD CONSTRAINT "img_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "img" ADD CONSTRAINT "img_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cpw" ADD CONSTRAINT "cpw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "car" ADD CONSTRAINT "car_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cpr" ADD CONSTRAINT "cpr_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cprr" ADD CONSTRAINT "cprr_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "glw" ADD CONSTRAINT "glw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "icw" ADD CONSTRAINT "icw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "imw" ADD CONSTRAINT "imw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lgw" ADD CONSTRAINT "lgw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lgo" ADD CONSTRAINT "lgo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lgv" ADD CONSTRAINT "lgv_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lvw" ADD CONSTRAINT "lvw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "msw" ADD CONSTRAINT "msw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scs" ADD CONSTRAINT "scs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tsc" ADD CONSTRAINT "tsc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tsp" ADD CONSTRAINT "tsp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blk" ADD CONSTRAINT "blk_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blk_locales" ADD CONSTRAINT "blk_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blk"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_img_v" ADD CONSTRAINT "_img_v_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_img_v" ADD CONSTRAINT "_img_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cpw_v" ADD CONSTRAINT "_cpw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_car_v" ADD CONSTRAINT "_car_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cpr_v" ADD CONSTRAINT "_cpr_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cprr_v" ADD CONSTRAINT "_cprr_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_glw_v" ADD CONSTRAINT "_glw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_icw_v" ADD CONSTRAINT "_icw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_imw_v" ADD CONSTRAINT "_imw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgw_v" ADD CONSTRAINT "_lgw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgo_v" ADD CONSTRAINT "_lgo_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgv_v" ADD CONSTRAINT "_lgv_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lvw_v" ADD CONSTRAINT "_lvw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_msw_v" ADD CONSTRAINT "_msw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scs_v" ADD CONSTRAINT "_scs_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tsc_v" ADD CONSTRAINT "_tsc_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tsp_v" ADD CONSTRAINT "_tsp_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blk_v" ADD CONSTRAINT "_blk_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blk_v_locales" ADD CONSTRAINT "_blk_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blk_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "img_order_idx" ON "img" USING btree ("_order");
  CREATE INDEX "img_parent_id_idx" ON "img" USING btree ("_parent_id");
  CREATE INDEX "img_path_idx" ON "img" USING btree ("_path");
  CREATE INDEX "img_image_idx" ON "img" USING btree ("image_id");
  CREATE INDEX "cpw_order_idx" ON "cpw" USING btree ("_order");
  CREATE INDEX "cpw_parent_id_idx" ON "cpw" USING btree ("_parent_id");
  CREATE INDEX "cpw_path_idx" ON "cpw" USING btree ("_path");
  CREATE INDEX "car_order_idx" ON "car" USING btree ("_order");
  CREATE INDEX "car_parent_id_idx" ON "car" USING btree ("_parent_id");
  CREATE INDEX "car_path_idx" ON "car" USING btree ("_path");
  CREATE INDEX "cpr_order_idx" ON "cpr" USING btree ("_order");
  CREATE INDEX "cpr_parent_id_idx" ON "cpr" USING btree ("_parent_id");
  CREATE INDEX "cpr_path_idx" ON "cpr" USING btree ("_path");
  CREATE INDEX "cprr_order_idx" ON "cprr" USING btree ("_order");
  CREATE INDEX "cprr_parent_id_idx" ON "cprr" USING btree ("_parent_id");
  CREATE INDEX "cprr_path_idx" ON "cprr" USING btree ("_path");
  CREATE INDEX "glw_order_idx" ON "glw" USING btree ("_order");
  CREATE INDEX "glw_parent_id_idx" ON "glw" USING btree ("_parent_id");
  CREATE INDEX "glw_path_idx" ON "glw" USING btree ("_path");
  CREATE INDEX "icw_order_idx" ON "icw" USING btree ("_order");
  CREATE INDEX "icw_parent_id_idx" ON "icw" USING btree ("_parent_id");
  CREATE INDEX "icw_path_idx" ON "icw" USING btree ("_path");
  CREATE INDEX "imw_order_idx" ON "imw" USING btree ("_order");
  CREATE INDEX "imw_parent_id_idx" ON "imw" USING btree ("_parent_id");
  CREATE INDEX "imw_path_idx" ON "imw" USING btree ("_path");
  CREATE INDEX "lgw_order_idx" ON "lgw" USING btree ("_order");
  CREATE INDEX "lgw_parent_id_idx" ON "lgw" USING btree ("_parent_id");
  CREATE INDEX "lgw_path_idx" ON "lgw" USING btree ("_path");
  CREATE INDEX "lgo_order_idx" ON "lgo" USING btree ("_order");
  CREATE INDEX "lgo_parent_id_idx" ON "lgo" USING btree ("_parent_id");
  CREATE INDEX "lgo_path_idx" ON "lgo" USING btree ("_path");
  CREATE INDEX "lgv_order_idx" ON "lgv" USING btree ("_order");
  CREATE INDEX "lgv_parent_id_idx" ON "lgv" USING btree ("_parent_id");
  CREATE INDEX "lgv_path_idx" ON "lgv" USING btree ("_path");
  CREATE INDEX "lvw_order_idx" ON "lvw" USING btree ("_order");
  CREATE INDEX "lvw_parent_id_idx" ON "lvw" USING btree ("_parent_id");
  CREATE INDEX "lvw_path_idx" ON "lvw" USING btree ("_path");
  CREATE INDEX "msw_order_idx" ON "msw" USING btree ("_order");
  CREATE INDEX "msw_parent_id_idx" ON "msw" USING btree ("_parent_id");
  CREATE INDEX "msw_path_idx" ON "msw" USING btree ("_path");
  CREATE INDEX "scs_order_idx" ON "scs" USING btree ("_order");
  CREATE INDEX "scs_parent_id_idx" ON "scs" USING btree ("_parent_id");
  CREATE INDEX "scs_path_idx" ON "scs" USING btree ("_path");
  CREATE INDEX "tsc_order_idx" ON "tsc" USING btree ("_order");
  CREATE INDEX "tsc_parent_id_idx" ON "tsc" USING btree ("_parent_id");
  CREATE INDEX "tsc_path_idx" ON "tsc" USING btree ("_path");
  CREATE INDEX "tsp_order_idx" ON "tsp" USING btree ("_order");
  CREATE INDEX "tsp_parent_id_idx" ON "tsp" USING btree ("_parent_id");
  CREATE INDEX "tsp_path_idx" ON "tsp" USING btree ("_path");
  CREATE INDEX "blk_order_idx" ON "blk" USING btree ("_order");
  CREATE INDEX "blk_parent_id_idx" ON "blk" USING btree ("_parent_id");
  CREATE INDEX "blk_path_idx" ON "blk" USING btree ("_path");
  CREATE UNIQUE INDEX "blk_locales_locale_parent_id_unique" ON "blk_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_img_v_order_idx" ON "_img_v" USING btree ("_order");
  CREATE INDEX "_img_v_parent_id_idx" ON "_img_v" USING btree ("_parent_id");
  CREATE INDEX "_img_v_path_idx" ON "_img_v" USING btree ("_path");
  CREATE INDEX "_img_v_image_idx" ON "_img_v" USING btree ("image_id");
  CREATE INDEX "_cpw_v_order_idx" ON "_cpw_v" USING btree ("_order");
  CREATE INDEX "_cpw_v_parent_id_idx" ON "_cpw_v" USING btree ("_parent_id");
  CREATE INDEX "_cpw_v_path_idx" ON "_cpw_v" USING btree ("_path");
  CREATE INDEX "_car_v_order_idx" ON "_car_v" USING btree ("_order");
  CREATE INDEX "_car_v_parent_id_idx" ON "_car_v" USING btree ("_parent_id");
  CREATE INDEX "_car_v_path_idx" ON "_car_v" USING btree ("_path");
  CREATE INDEX "_cpr_v_order_idx" ON "_cpr_v" USING btree ("_order");
  CREATE INDEX "_cpr_v_parent_id_idx" ON "_cpr_v" USING btree ("_parent_id");
  CREATE INDEX "_cpr_v_path_idx" ON "_cpr_v" USING btree ("_path");
  CREATE INDEX "_cprr_v_order_idx" ON "_cprr_v" USING btree ("_order");
  CREATE INDEX "_cprr_v_parent_id_idx" ON "_cprr_v" USING btree ("_parent_id");
  CREATE INDEX "_cprr_v_path_idx" ON "_cprr_v" USING btree ("_path");
  CREATE INDEX "_glw_v_order_idx" ON "_glw_v" USING btree ("_order");
  CREATE INDEX "_glw_v_parent_id_idx" ON "_glw_v" USING btree ("_parent_id");
  CREATE INDEX "_glw_v_path_idx" ON "_glw_v" USING btree ("_path");
  CREATE INDEX "_icw_v_order_idx" ON "_icw_v" USING btree ("_order");
  CREATE INDEX "_icw_v_parent_id_idx" ON "_icw_v" USING btree ("_parent_id");
  CREATE INDEX "_icw_v_path_idx" ON "_icw_v" USING btree ("_path");
  CREATE INDEX "_imw_v_order_idx" ON "_imw_v" USING btree ("_order");
  CREATE INDEX "_imw_v_parent_id_idx" ON "_imw_v" USING btree ("_parent_id");
  CREATE INDEX "_imw_v_path_idx" ON "_imw_v" USING btree ("_path");
  CREATE INDEX "_lgw_v_order_idx" ON "_lgw_v" USING btree ("_order");
  CREATE INDEX "_lgw_v_parent_id_idx" ON "_lgw_v" USING btree ("_parent_id");
  CREATE INDEX "_lgw_v_path_idx" ON "_lgw_v" USING btree ("_path");
  CREATE INDEX "_lgo_v_order_idx" ON "_lgo_v" USING btree ("_order");
  CREATE INDEX "_lgo_v_parent_id_idx" ON "_lgo_v" USING btree ("_parent_id");
  CREATE INDEX "_lgo_v_path_idx" ON "_lgo_v" USING btree ("_path");
  CREATE INDEX "_lgv_v_order_idx" ON "_lgv_v" USING btree ("_order");
  CREATE INDEX "_lgv_v_parent_id_idx" ON "_lgv_v" USING btree ("_parent_id");
  CREATE INDEX "_lgv_v_path_idx" ON "_lgv_v" USING btree ("_path");
  CREATE INDEX "_lvw_v_order_idx" ON "_lvw_v" USING btree ("_order");
  CREATE INDEX "_lvw_v_parent_id_idx" ON "_lvw_v" USING btree ("_parent_id");
  CREATE INDEX "_lvw_v_path_idx" ON "_lvw_v" USING btree ("_path");
  CREATE INDEX "_msw_v_order_idx" ON "_msw_v" USING btree ("_order");
  CREATE INDEX "_msw_v_parent_id_idx" ON "_msw_v" USING btree ("_parent_id");
  CREATE INDEX "_msw_v_path_idx" ON "_msw_v" USING btree ("_path");
  CREATE INDEX "_scs_v_order_idx" ON "_scs_v" USING btree ("_order");
  CREATE INDEX "_scs_v_parent_id_idx" ON "_scs_v" USING btree ("_parent_id");
  CREATE INDEX "_scs_v_path_idx" ON "_scs_v" USING btree ("_path");
  CREATE INDEX "_tsc_v_order_idx" ON "_tsc_v" USING btree ("_order");
  CREATE INDEX "_tsc_v_parent_id_idx" ON "_tsc_v" USING btree ("_parent_id");
  CREATE INDEX "_tsc_v_path_idx" ON "_tsc_v" USING btree ("_path");
  CREATE INDEX "_tsp_v_order_idx" ON "_tsp_v" USING btree ("_order");
  CREATE INDEX "_tsp_v_parent_id_idx" ON "_tsp_v" USING btree ("_parent_id");
  CREATE INDEX "_tsp_v_path_idx" ON "_tsp_v" USING btree ("_path");
  CREATE INDEX "_blk_v_order_idx" ON "_blk_v" USING btree ("_order");
  CREATE INDEX "_blk_v_parent_id_idx" ON "_blk_v" USING btree ("_parent_id");
  CREATE INDEX "_blk_v_path_idx" ON "_blk_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_blk_v_locales_locale_parent_id_unique" ON "_blk_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "img" CASCADE;
  DROP TABLE "cpw" CASCADE;
  DROP TABLE "car" CASCADE;
  DROP TABLE "cpr" CASCADE;
  DROP TABLE "cprr" CASCADE;
  DROP TABLE "glw" CASCADE;
  DROP TABLE "icw" CASCADE;
  DROP TABLE "imw" CASCADE;
  DROP TABLE "lgw" CASCADE;
  DROP TABLE "lgo" CASCADE;
  DROP TABLE "lgv" CASCADE;
  DROP TABLE "lvw" CASCADE;
  DROP TABLE "msw" CASCADE;
  DROP TABLE "scs" CASCADE;
  DROP TABLE "tsc" CASCADE;
  DROP TABLE "tsp" CASCADE;
  DROP TABLE "blk" CASCADE;
  DROP TABLE "blk_locales" CASCADE;
  DROP TABLE "_img_v" CASCADE;
  DROP TABLE "_cpw_v" CASCADE;
  DROP TABLE "_car_v" CASCADE;
  DROP TABLE "_cpr_v" CASCADE;
  DROP TABLE "_cprr_v" CASCADE;
  DROP TABLE "_glw_v" CASCADE;
  DROP TABLE "_icw_v" CASCADE;
  DROP TABLE "_imw_v" CASCADE;
  DROP TABLE "_lgw_v" CASCADE;
  DROP TABLE "_lgo_v" CASCADE;
  DROP TABLE "_lgv_v" CASCADE;
  DROP TABLE "_lvw_v" CASCADE;
  DROP TABLE "_msw_v" CASCADE;
  DROP TABLE "_scs_v" CASCADE;
  DROP TABLE "_tsc_v" CASCADE;
  DROP TABLE "_tsp_v" CASCADE;
  DROP TABLE "_blk_v" CASCADE;
  DROP TABLE "_blk_v_locales" CASCADE;
  DROP TYPE "public"."enum_block_width";
  DROP TYPE "public"."enum_block_arrangement";
  DROP TYPE "public"."enum_block_aspect_ratio";`)
}
