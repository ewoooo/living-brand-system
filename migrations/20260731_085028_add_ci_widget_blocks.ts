import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "cso" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_layer_id" integer,
  	"grid_layer_id" integer,
  	"scale_percent" numeric DEFAULT 100,
  	"block_name" varchar
  );
  
  CREATE TABLE "cvw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"horizontal_logo_id" integer,
  	"horizontal_grid_id" integer,
  	"horizontal_min_height_px" numeric,
  	"vertical_logo_id" integer,
  	"vertical_grid_id" integer,
  	"vertical_min_height_px" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "iug" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "lcv" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "ldp" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"width" numeric,
  	"height" numeric,
  	"padding" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cso_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_layer_id" integer,
  	"grid_layer_id" integer,
  	"scale_percent" numeric DEFAULT 100,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cvw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"horizontal_logo_id" integer,
  	"horizontal_grid_id" integer,
  	"horizontal_min_height_px" numeric,
  	"vertical_logo_id" integer,
  	"vertical_grid_id" integer,
  	"vertical_min_height_px" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_iug_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lcv_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_ldp_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"width" numeric,
  	"height" numeric,
  	"padding" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "blk" ADD COLUMN "background_id" integer;
  ALTER TABLE "blk" ADD COLUMN "inner_background_id" integer;
  ALTER TABLE "_blk_v" ADD COLUMN "background_id" integer;
  ALTER TABLE "_blk_v" ADD COLUMN "inner_background_id" integer;
  ALTER TABLE "cso" ADD CONSTRAINT "cso_logo_layer_id_brand_logos_id_fk" FOREIGN KEY ("logo_layer_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cso" ADD CONSTRAINT "cso_grid_layer_id_brand_logos_id_fk" FOREIGN KEY ("grid_layer_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cso" ADD CONSTRAINT "cso_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvw" ADD CONSTRAINT "cvw_horizontal_logo_id_brand_logos_id_fk" FOREIGN KEY ("horizontal_logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cvw" ADD CONSTRAINT "cvw_horizontal_grid_id_brand_logos_id_fk" FOREIGN KEY ("horizontal_grid_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cvw" ADD CONSTRAINT "cvw_vertical_logo_id_brand_logos_id_fk" FOREIGN KEY ("vertical_logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cvw" ADD CONSTRAINT "cvw_vertical_grid_id_brand_logos_id_fk" FOREIGN KEY ("vertical_grid_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cvw" ADD CONSTRAINT "cvw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "iug" ADD CONSTRAINT "iug_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lcv" ADD CONSTRAINT "lcv_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lcv" ADD CONSTRAINT "lcv_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ldp" ADD CONSTRAINT "ldp_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ldp" ADD CONSTRAINT "ldp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cso_v" ADD CONSTRAINT "_cso_v_logo_layer_id_brand_logos_id_fk" FOREIGN KEY ("logo_layer_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cso_v" ADD CONSTRAINT "_cso_v_grid_layer_id_brand_logos_id_fk" FOREIGN KEY ("grid_layer_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cso_v" ADD CONSTRAINT "_cso_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cvw_v" ADD CONSTRAINT "_cvw_v_horizontal_logo_id_brand_logos_id_fk" FOREIGN KEY ("horizontal_logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cvw_v" ADD CONSTRAINT "_cvw_v_horizontal_grid_id_brand_logos_id_fk" FOREIGN KEY ("horizontal_grid_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cvw_v" ADD CONSTRAINT "_cvw_v_vertical_logo_id_brand_logos_id_fk" FOREIGN KEY ("vertical_logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cvw_v" ADD CONSTRAINT "_cvw_v_vertical_grid_id_brand_logos_id_fk" FOREIGN KEY ("vertical_grid_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cvw_v" ADD CONSTRAINT "_cvw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_iug_v" ADD CONSTRAINT "_iug_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lcv_v" ADD CONSTRAINT "_lcv_v_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lcv_v" ADD CONSTRAINT "_lcv_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ldp_v" ADD CONSTRAINT "_ldp_v_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ldp_v" ADD CONSTRAINT "_ldp_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cso_order_idx" ON "cso" USING btree ("_order");
  CREATE INDEX "cso_parent_id_idx" ON "cso" USING btree ("_parent_id");
  CREATE INDEX "cso_path_idx" ON "cso" USING btree ("_path");
  CREATE INDEX "cso_logo_layer_idx" ON "cso" USING btree ("logo_layer_id");
  CREATE INDEX "cso_grid_layer_idx" ON "cso" USING btree ("grid_layer_id");
  CREATE INDEX "cvw_order_idx" ON "cvw" USING btree ("_order");
  CREATE INDEX "cvw_parent_id_idx" ON "cvw" USING btree ("_parent_id");
  CREATE INDEX "cvw_path_idx" ON "cvw" USING btree ("_path");
  CREATE INDEX "cvw_horizontal_logo_idx" ON "cvw" USING btree ("horizontal_logo_id");
  CREATE INDEX "cvw_horizontal_grid_idx" ON "cvw" USING btree ("horizontal_grid_id");
  CREATE INDEX "cvw_vertical_logo_idx" ON "cvw" USING btree ("vertical_logo_id");
  CREATE INDEX "cvw_vertical_grid_idx" ON "cvw" USING btree ("vertical_grid_id");
  CREATE INDEX "iug_order_idx" ON "iug" USING btree ("_order");
  CREATE INDEX "iug_parent_id_idx" ON "iug" USING btree ("_parent_id");
  CREATE INDEX "iug_path_idx" ON "iug" USING btree ("_path");
  CREATE INDEX "lcv_order_idx" ON "lcv" USING btree ("_order");
  CREATE INDEX "lcv_parent_id_idx" ON "lcv" USING btree ("_parent_id");
  CREATE INDEX "lcv_path_idx" ON "lcv" USING btree ("_path");
  CREATE INDEX "lcv_logo_idx" ON "lcv" USING btree ("logo_id");
  CREATE INDEX "ldp_order_idx" ON "ldp" USING btree ("_order");
  CREATE INDEX "ldp_parent_id_idx" ON "ldp" USING btree ("_parent_id");
  CREATE INDEX "ldp_path_idx" ON "ldp" USING btree ("_path");
  CREATE INDEX "ldp_logo_idx" ON "ldp" USING btree ("logo_id");
  CREATE INDEX "_cso_v_order_idx" ON "_cso_v" USING btree ("_order");
  CREATE INDEX "_cso_v_parent_id_idx" ON "_cso_v" USING btree ("_parent_id");
  CREATE INDEX "_cso_v_path_idx" ON "_cso_v" USING btree ("_path");
  CREATE INDEX "_cso_v_logo_layer_idx" ON "_cso_v" USING btree ("logo_layer_id");
  CREATE INDEX "_cso_v_grid_layer_idx" ON "_cso_v" USING btree ("grid_layer_id");
  CREATE INDEX "_cvw_v_order_idx" ON "_cvw_v" USING btree ("_order");
  CREATE INDEX "_cvw_v_parent_id_idx" ON "_cvw_v" USING btree ("_parent_id");
  CREATE INDEX "_cvw_v_path_idx" ON "_cvw_v" USING btree ("_path");
  CREATE INDEX "_cvw_v_horizontal_logo_idx" ON "_cvw_v" USING btree ("horizontal_logo_id");
  CREATE INDEX "_cvw_v_horizontal_grid_idx" ON "_cvw_v" USING btree ("horizontal_grid_id");
  CREATE INDEX "_cvw_v_vertical_logo_idx" ON "_cvw_v" USING btree ("vertical_logo_id");
  CREATE INDEX "_cvw_v_vertical_grid_idx" ON "_cvw_v" USING btree ("vertical_grid_id");
  CREATE INDEX "_iug_v_order_idx" ON "_iug_v" USING btree ("_order");
  CREATE INDEX "_iug_v_parent_id_idx" ON "_iug_v" USING btree ("_parent_id");
  CREATE INDEX "_iug_v_path_idx" ON "_iug_v" USING btree ("_path");
  CREATE INDEX "_lcv_v_order_idx" ON "_lcv_v" USING btree ("_order");
  CREATE INDEX "_lcv_v_parent_id_idx" ON "_lcv_v" USING btree ("_parent_id");
  CREATE INDEX "_lcv_v_path_idx" ON "_lcv_v" USING btree ("_path");
  CREATE INDEX "_lcv_v_logo_idx" ON "_lcv_v" USING btree ("logo_id");
  CREATE INDEX "_ldp_v_order_idx" ON "_ldp_v" USING btree ("_order");
  CREATE INDEX "_ldp_v_parent_id_idx" ON "_ldp_v" USING btree ("_parent_id");
  CREATE INDEX "_ldp_v_path_idx" ON "_ldp_v" USING btree ("_path");
  CREATE INDEX "_ldp_v_logo_idx" ON "_ldp_v" USING btree ("logo_id");
  ALTER TABLE "blk" ADD CONSTRAINT "blk_background_id_brand_colors_id_fk" FOREIGN KEY ("background_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blk" ADD CONSTRAINT "blk_inner_background_id_brand_colors_id_fk" FOREIGN KEY ("inner_background_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blk_v" ADD CONSTRAINT "_blk_v_background_id_brand_colors_id_fk" FOREIGN KEY ("background_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blk_v" ADD CONSTRAINT "_blk_v_inner_background_id_brand_colors_id_fk" FOREIGN KEY ("inner_background_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "blk_background_idx" ON "blk" USING btree ("background_id");
  CREATE INDEX "blk_inner_background_idx" ON "blk" USING btree ("inner_background_id");
  CREATE INDEX "_blk_v_background_idx" ON "_blk_v" USING btree ("background_id");
  CREATE INDEX "_blk_v_inner_background_idx" ON "_blk_v" USING btree ("inner_background_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cso" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cvw" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "iug" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lcv" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ldp" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cso_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cvw_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_iug_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lcv_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ldp_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cso" CASCADE;
  DROP TABLE "cvw" CASCADE;
  DROP TABLE "iug" CASCADE;
  DROP TABLE "lcv" CASCADE;
  DROP TABLE "ldp" CASCADE;
  DROP TABLE "_cso_v" CASCADE;
  DROP TABLE "_cvw_v" CASCADE;
  DROP TABLE "_iug_v" CASCADE;
  DROP TABLE "_lcv_v" CASCADE;
  DROP TABLE "_ldp_v" CASCADE;
  ALTER TABLE "blk" DROP CONSTRAINT "blk_background_id_brand_colors_id_fk";
  
  ALTER TABLE "blk" DROP CONSTRAINT "blk_inner_background_id_brand_colors_id_fk";
  
  ALTER TABLE "_blk_v" DROP CONSTRAINT "_blk_v_background_id_brand_colors_id_fk";
  
  ALTER TABLE "_blk_v" DROP CONSTRAINT "_blk_v_inner_background_id_brand_colors_id_fk";
  
  DROP INDEX "blk_background_idx";
  DROP INDEX "blk_inner_background_idx";
  DROP INDEX "_blk_v_background_idx";
  DROP INDEX "_blk_v_inner_background_idx";
  ALTER TABLE "blk" DROP COLUMN "background_id";
  ALTER TABLE "blk" DROP COLUMN "inner_background_id";
  ALTER TABLE "_blk_v" DROP COLUMN "background_id";
  ALTER TABLE "_blk_v" DROP COLUMN "inner_background_id";`)
}
