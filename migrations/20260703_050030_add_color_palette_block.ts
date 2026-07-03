import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "guideline_pages_blocks_color_palette" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_pages_blocks_color_palette_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_color_palette" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_color_palette_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "guideline_pages_rels" ADD COLUMN "brand_colors_id" integer;
  ALTER TABLE "_guideline_pages_v_rels" ADD COLUMN "brand_colors_id" integer;
  ALTER TABLE "guideline_pages_blocks_color_palette" ADD CONSTRAINT "guideline_pages_blocks_color_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_color_palette_locales" ADD CONSTRAINT "guideline_pages_blocks_color_palette_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_pages_blocks_color_palette_order_idx" ON "guideline_pages_blocks_color_palette" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_color_palette_parent_id_idx" ON "guideline_pages_blocks_color_palette" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_color_palette_path_idx" ON "guideline_pages_blocks_color_palette" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_pages_blocks_color_palette_locales_locale_parent_i" ON "guideline_pages_blocks_color_palette_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_order_idx" ON "_guideline_pages_v_blocks_color_palette" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_parent_id_idx" ON "_guideline_pages_v_blocks_color_palette" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_path_idx" ON "_guideline_pages_v_blocks_color_palette" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_color_palette_locales_locale_paren" ON "_guideline_pages_v_blocks_color_palette_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "guideline_pages_rels" ADD CONSTRAINT "guideline_pages_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_rels" ADD CONSTRAINT "_guideline_pages_v_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_pages_rels_brand_colors_id_idx" ON "guideline_pages_rels" USING btree ("brand_colors_id");
  CREATE INDEX "_guideline_pages_v_rels_brand_colors_id_idx" ON "_guideline_pages_v_rels" USING btree ("brand_colors_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_pages_blocks_color_palette" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_color_palette_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_pages_blocks_color_palette" CASCADE;
  DROP TABLE "guideline_pages_blocks_color_palette_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_color_palette" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_color_palette_locales" CASCADE;
  ALTER TABLE "guideline_pages_rels" DROP CONSTRAINT "guideline_pages_rels_brand_colors_fk";
  
  ALTER TABLE "_guideline_pages_v_rels" DROP CONSTRAINT "_guideline_pages_v_rels_brand_colors_fk";
  
  DROP INDEX "guideline_pages_rels_brand_colors_id_idx";
  DROP INDEX "_guideline_pages_v_rels_brand_colors_id_idx";
  ALTER TABLE "guideline_pages_rels" DROP COLUMN "brand_colors_id";
  ALTER TABLE "_guideline_pages_v_rels" DROP COLUMN "brand_colors_id";`)
}
