import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_blocks_logo_group_viewer_topics_kind" AS ENUM('minSize', 'clearSpace', 'registeredMark');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_logo_group_viewer_topics_kind" AS ENUM('minSize', 'clearSpace', 'registeredMark');
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"logo_real_height_px" numeric,
  	"registered_mark_id" integer,
  	"clear_space_guide_id" integer,
  	"min_size_px" numeric DEFAULT 20,
  	"registered_min_px" numeric DEFAULT 45
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_logos_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_guideline_docs_blocks_logo_group_viewer_topics_kind"
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_topics_locales" (
  	"label" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"logo_real_height_px" numeric,
  	"registered_mark_id" integer,
  	"clear_space_guide_id" integer,
  	"min_size_px" numeric DEFAULT 20,
  	"registered_min_px" numeric DEFAULT 45,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__guideline_docs_v_blocks_logo_group_viewer_topics_kind",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics_locales" (
  	"label" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_logo_id_application_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_registered_mark_id_application_images_id_fk" FOREIGN KEY ("registered_mark_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_clear_space_guide_id_application_images_id_fk" FOREIGN KEY ("clear_space_guide_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_topics" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_topics_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_topics_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_logo_id_application_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_registered_mark_id_application_images_id_fk" FOREIGN KEY ("registered_mark_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_clear_space_guide_id_application_images_id_fk" FOREIGN KEY ("clear_space_guide_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_topics_locales_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_order_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_parent_id_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_logo_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("logo_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_registered_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("registered_mark_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_clear_spac_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("clear_space_guide_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_group_viewer_logos_locales_locale" ON "guideline_docs_blocks_logo_group_viewer_logos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_topics_order_idx" ON "guideline_docs_blocks_logo_group_viewer_topics" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_topics_parent_id_idx" ON "guideline_docs_blocks_logo_group_viewer_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_group_viewer_topics_locales_local" ON "guideline_docs_blocks_logo_group_viewer_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_order_idx" ON "guideline_docs_blocks_logo_group_viewer" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_parent_id_idx" ON "guideline_docs_blocks_logo_group_viewer" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_path_idx" ON "guideline_docs_blocks_logo_group_viewer" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_group_viewer_locales_locale_paren" ON "guideline_docs_blocks_logo_group_viewer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_order_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_parent_id_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_logo_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("logo_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_registe_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("registered_mark_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_clear_s_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("clear_space_guide_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_locales_loc" ON "_guideline_docs_v_blocks_logo_group_viewer_logos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_topics_order_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_topics" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_topics_parent_id_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_group_viewer_topics_locales_lo" ON "_guideline_docs_v_blocks_logo_group_viewer_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_order_idx" ON "_guideline_docs_v_blocks_logo_group_viewer" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_parent_id_idx" ON "_guideline_docs_v_blocks_logo_group_viewer" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_path_idx" ON "_guideline_docs_v_blocks_logo_group_viewer" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_group_viewer_locales_locale_pa" ON "_guideline_docs_v_blocks_logo_group_viewer_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guideline_docs_blocks_logo_group_viewer_logos" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer_logos_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer_topics" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer_topics_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_locales" CASCADE;
  DROP TYPE "public"."enum_guideline_docs_blocks_logo_group_viewer_topics_kind";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_logo_group_viewer_topics_kind";`)
}
