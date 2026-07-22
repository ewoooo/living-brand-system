import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_blocks_image_grid_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16', 'manual', 'firstImage');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_image_grid_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16', 'manual', 'firstImage');
  CREATE TABLE "guideline_docs_blocks_image_grid_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "guideline_docs_blocks_image_grid_cells_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_image_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" numeric DEFAULT 3,
  	"rows" numeric DEFAULT 2,
  	"image_ratio" "enum_guideline_docs_blocks_image_grid_image_ratio" DEFAULT '1:1',
  	"ratio_width" numeric DEFAULT 4,
  	"ratio_height" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_image_grid_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_image_grid_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_image_grid_cells_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_image_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"columns" numeric DEFAULT 3,
  	"rows" numeric DEFAULT 2,
  	"image_ratio" "enum__guideline_docs_v_blocks_image_grid_image_ratio" DEFAULT '1:1',
  	"ratio_width" numeric DEFAULT 4,
  	"ratio_height" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_image_grid_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "guideline_docs_blocks_image_grid_cells" ADD CONSTRAINT "guideline_docs_blocks_image_grid_cells_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_image_grid_cells" ADD CONSTRAINT "guideline_docs_blocks_image_grid_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_image_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_image_grid_cells_locales" ADD CONSTRAINT "guideline_docs_blocks_image_grid_cells_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_image_grid_cells"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_image_grid" ADD CONSTRAINT "guideline_docs_blocks_image_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_image_grid_locales" ADD CONSTRAINT "guideline_docs_blocks_image_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_image_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_cells" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_cells_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_cells" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_image_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_cells_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_cells_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_image_grid_cells"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_image_grid"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_image_grid_cells_order_idx" ON "guideline_docs_blocks_image_grid_cells" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_image_grid_cells_parent_id_idx" ON "guideline_docs_blocks_image_grid_cells" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_image_grid_cells_image_idx" ON "guideline_docs_blocks_image_grid_cells" USING btree ("image_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_image_grid_cells_locales_locale_parent" ON "guideline_docs_blocks_image_grid_cells_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_image_grid_order_idx" ON "guideline_docs_blocks_image_grid" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_image_grid_parent_id_idx" ON "guideline_docs_blocks_image_grid" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_image_grid_path_idx" ON "guideline_docs_blocks_image_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_image_grid_locales_locale_parent_id_un" ON "guideline_docs_blocks_image_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_cells_order_idx" ON "_guideline_docs_v_blocks_image_grid_cells" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_cells_parent_id_idx" ON "_guideline_docs_v_blocks_image_grid_cells" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_cells_image_idx" ON "_guideline_docs_v_blocks_image_grid_cells" USING btree ("image_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_image_grid_cells_locales_locale_par" ON "_guideline_docs_v_blocks_image_grid_cells_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_order_idx" ON "_guideline_docs_v_blocks_image_grid" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_parent_id_idx" ON "_guideline_docs_v_blocks_image_grid" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_path_idx" ON "_guideline_docs_v_blocks_image_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_image_grid_locales_locale_parent_id" ON "_guideline_docs_v_blocks_image_grid_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guideline_docs_blocks_image_grid_cells" CASCADE;
  DROP TABLE "guideline_docs_blocks_image_grid_cells_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_image_grid" CASCADE;
  DROP TABLE "guideline_docs_blocks_image_grid_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_image_grid_cells" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_image_grid_cells_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_image_grid" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_image_grid_locales" CASCADE;
  DROP TYPE "public"."enum_guideline_docs_blocks_image_grid_image_ratio";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_image_grid_image_ratio";`)
}
