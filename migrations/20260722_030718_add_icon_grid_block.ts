import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "guideline_docs_blocks_icon_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"colored" boolean DEFAULT false,
  	"cell_height_pct" numeric DEFAULT 100,
  	"svg_size_pct" numeric DEFAULT 70,
  	"svg_offset_pct" numeric DEFAULT 0,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_icon_grid_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_icon_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"colored" boolean DEFAULT false,
  	"cell_height_pct" numeric DEFAULT 100,
  	"svg_size_pct" numeric DEFAULT 70,
  	"svg_offset_pct" numeric DEFAULT 0,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_icon_grid_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "guideline_docs_blocks_icon_grid" ADD CONSTRAINT "guideline_docs_blocks_icon_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_icon_grid_locales" ADD CONSTRAINT "guideline_docs_blocks_icon_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_icon_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_icon_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_icon_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_icon_grid_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_icon_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_icon_grid"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_icon_grid_order_idx" ON "guideline_docs_blocks_icon_grid" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_icon_grid_parent_id_idx" ON "guideline_docs_blocks_icon_grid" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_icon_grid_path_idx" ON "guideline_docs_blocks_icon_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_icon_grid_locales_locale_parent_id_uni" ON "guideline_docs_blocks_icon_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_icon_grid_order_idx" ON "_guideline_docs_v_blocks_icon_grid" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_icon_grid_parent_id_idx" ON "_guideline_docs_v_blocks_icon_grid" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_icon_grid_path_idx" ON "_guideline_docs_v_blocks_icon_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_icon_grid_locales_locale_parent_id_" ON "_guideline_docs_v_blocks_icon_grid_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guideline_docs_blocks_icon_grid" CASCADE;
  DROP TABLE "guideline_docs_blocks_icon_grid_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_icon_grid" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_icon_grid_locales" CASCADE;`)
}
