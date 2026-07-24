import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "guideline_docs_blocks_logo_viewer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"registered_mark_id" integer,
  	"clear_space_guide_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_viewer_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_stem_clear_space" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"stem_ratio" numeric DEFAULT 0.025,
  	"stem_x" numeric DEFAULT 0.29,
  	"multiplier" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_stem_clear_space_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_viewer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"registered_mark_id" integer,
  	"clear_space_guide_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_viewer_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_stem_clear_space" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"stem_ratio" numeric DEFAULT 0.025,
  	"stem_x" numeric DEFAULT 0.29,
  	"multiplier" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_stem_clear_space_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_logo_id_application_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_registered_mark_id_application_images_id_fk" FOREIGN KEY ("registered_mark_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_clear_space_guide_id_application_images_id_fk" FOREIGN KEY ("clear_space_guide_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_stem_clear_space" ADD CONSTRAINT "guideline_docs_blocks_stem_clear_space_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_stem_clear_space" ADD CONSTRAINT "guideline_docs_blocks_stem_clear_space_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_stem_clear_space_locales" ADD CONSTRAINT "guideline_docs_blocks_stem_clear_space_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_stem_clear_space"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_logo_id_application_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_registered_mark_id_application_images_id_fk" FOREIGN KEY ("registered_mark_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_clear_space_guide_id_application_images_id_fk" FOREIGN KEY ("clear_space_guide_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_stem_clear_space" ADD CONSTRAINT "_guideline_docs_v_blocks_stem_clear_space_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_stem_clear_space" ADD CONSTRAINT "_guideline_docs_v_blocks_stem_clear_space_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_stem_clear_space_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_stem_clear_space_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_stem_clear_space"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_logo_viewer_order_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_parent_id_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_path_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_logo_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("logo_id");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_registered_mark_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("registered_mark_id");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_clear_space_guide_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("clear_space_guide_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_viewer_locales_locale_parent_id_u" ON "guideline_docs_blocks_logo_viewer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_stem_clear_space_order_idx" ON "guideline_docs_blocks_stem_clear_space" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_stem_clear_space_parent_id_idx" ON "guideline_docs_blocks_stem_clear_space" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_stem_clear_space_path_idx" ON "guideline_docs_blocks_stem_clear_space" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_stem_clear_space_logo_idx" ON "guideline_docs_blocks_stem_clear_space" USING btree ("logo_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_stem_clear_space_locales_locale_parent" ON "guideline_docs_blocks_stem_clear_space_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_order_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_parent_id_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_path_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_logo_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("logo_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_registered_mark_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("registered_mark_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_clear_space_guide_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("clear_space_guide_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_viewer_locales_locale_parent_i" ON "_guideline_docs_v_blocks_logo_viewer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_stem_clear_space_order_idx" ON "_guideline_docs_v_blocks_stem_clear_space" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_stem_clear_space_parent_id_idx" ON "_guideline_docs_v_blocks_stem_clear_space" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_stem_clear_space_path_idx" ON "_guideline_docs_v_blocks_stem_clear_space" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_stem_clear_space_logo_idx" ON "_guideline_docs_v_blocks_stem_clear_space" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_stem_clear_space_locales_locale_par" ON "_guideline_docs_v_blocks_stem_clear_space_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guideline_docs_blocks_logo_viewer" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_viewer_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_stem_clear_space" CASCADE;
  DROP TABLE "guideline_docs_blocks_stem_clear_space_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_viewer" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_viewer_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_stem_clear_space" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_stem_clear_space_locales" CASCADE;`)
}
