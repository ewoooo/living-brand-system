import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_thr_language" AS ENUM('ko', 'en', 'enCaps');
  CREATE TYPE "public"."enum_tlg_language" AS ENUM('ko', 'en', 'enCaps');
  CREATE TYPE "public"."enum_tlg_layout" AS ENUM('single', 'compare');
  CREATE TYPE "public"."enum_tsw_weight" AS ENUM('light', 'medium', 'bold');
  CREATE TYPE "public"."enum_twt_language" AS ENUM('ko', 'en', 'enCaps');
  CREATE TYPE "public"."enum_twt_weight" AS ENUM('light', 'medium', 'bold');
  ALTER TYPE "public"."enum_ddw_examples_preset" ADD VALUE 'tight-tracking';
  ALTER TYPE "public"."enum_ddw_examples_preset" ADD VALUE 'loose-tracking';
  ALTER TYPE "public"."enum_ddw_examples_preset" ADD VALUE 'wrong-typeface';
  ALTER TYPE "public"."enum_ddw_examples_preset" ADD VALUE 'mixed-size';
  ALTER TYPE "public"."enum_ddw_examples_preset" ADD VALUE 'distorted';
  ALTER TYPE "public"."enum_ddw_examples_preset" ADD VALUE 'slanted';
  CREATE TABLE "thr" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_thr_language" DEFAULT 'ko',
  	"block_name" varchar
  );
  
  CREATE TABLE "tlg" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"initial_language" "enum_tlg_language" DEFAULT 'ko',
  	"layout" "enum_tlg_layout" DEFAULT 'single',
  	"block_name" varchar
  );
  
  CREATE TABLE "tsw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"weight" "enum_tsw_weight" DEFAULT 'bold',
  	"block_name" varchar
  );
  
  CREATE TABLE "twt" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_twt_language" DEFAULT 'ko',
  	"initial_weight" "enum_twt_weight" DEFAULT 'medium',
  	"block_name" varchar
  );
  
  CREATE TABLE "_thr_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"language" "enum_thr_language" DEFAULT 'ko',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_tlg_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"initial_language" "enum_tlg_language" DEFAULT 'ko',
  	"layout" "enum_tlg_layout" DEFAULT 'single',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_tsw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"weight" "enum_tsw_weight" DEFAULT 'bold',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_twt_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"language" "enum_twt_language" DEFAULT 'ko',
  	"initial_weight" "enum_twt_weight" DEFAULT 'medium',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "thr" ADD CONSTRAINT "thr_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tlg" ADD CONSTRAINT "tlg_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tsw" ADD CONSTRAINT "tsw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "twt" ADD CONSTRAINT "twt_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_thr_v" ADD CONSTRAINT "_thr_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tlg_v" ADD CONSTRAINT "_tlg_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tsw_v" ADD CONSTRAINT "_tsw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_twt_v" ADD CONSTRAINT "_twt_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "thr_order_idx" ON "thr" USING btree ("_order");
  CREATE INDEX "thr_parent_id_idx" ON "thr" USING btree ("_parent_id");
  CREATE INDEX "thr_path_idx" ON "thr" USING btree ("_path");
  CREATE INDEX "tlg_order_idx" ON "tlg" USING btree ("_order");
  CREATE INDEX "tlg_parent_id_idx" ON "tlg" USING btree ("_parent_id");
  CREATE INDEX "tlg_path_idx" ON "tlg" USING btree ("_path");
  CREATE INDEX "tsw_order_idx" ON "tsw" USING btree ("_order");
  CREATE INDEX "tsw_parent_id_idx" ON "tsw" USING btree ("_parent_id");
  CREATE INDEX "tsw_path_idx" ON "tsw" USING btree ("_path");
  CREATE INDEX "twt_order_idx" ON "twt" USING btree ("_order");
  CREATE INDEX "twt_parent_id_idx" ON "twt" USING btree ("_parent_id");
  CREATE INDEX "twt_path_idx" ON "twt" USING btree ("_path");
  CREATE INDEX "_thr_v_order_idx" ON "_thr_v" USING btree ("_order");
  CREATE INDEX "_thr_v_parent_id_idx" ON "_thr_v" USING btree ("_parent_id");
  CREATE INDEX "_thr_v_path_idx" ON "_thr_v" USING btree ("_path");
  CREATE INDEX "_tlg_v_order_idx" ON "_tlg_v" USING btree ("_order");
  CREATE INDEX "_tlg_v_parent_id_idx" ON "_tlg_v" USING btree ("_parent_id");
  CREATE INDEX "_tlg_v_path_idx" ON "_tlg_v" USING btree ("_path");
  CREATE INDEX "_tsw_v_order_idx" ON "_tsw_v" USING btree ("_order");
  CREATE INDEX "_tsw_v_parent_id_idx" ON "_tsw_v" USING btree ("_parent_id");
  CREATE INDEX "_tsw_v_path_idx" ON "_tsw_v" USING btree ("_path");
  CREATE INDEX "_twt_v_order_idx" ON "_twt_v" USING btree ("_order");
  CREATE INDEX "_twt_v_parent_id_idx" ON "_twt_v" USING btree ("_parent_id");
  CREATE INDEX "_twt_v_path_idx" ON "_twt_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "thr" CASCADE;
  DROP TABLE "tlg" CASCADE;
  DROP TABLE "tsw" CASCADE;
  DROP TABLE "twt" CASCADE;
  DROP TABLE "_thr_v" CASCADE;
  DROP TABLE "_tlg_v" CASCADE;
  DROP TABLE "_tsw_v" CASCADE;
  DROP TABLE "_twt_v" CASCADE;
  ALTER TABLE "ddw_examples" ALTER COLUMN "preset" SET DATA TYPE text;
  ALTER TABLE "_ddw_v_examples" ALTER COLUMN "preset" SET DATA TYPE text;
  DROP TYPE "public"."enum_ddw_examples_preset";
  CREATE TYPE "public"."enum_ddw_examples_preset" AS ENUM('off-palette', 'gradient', 'low-contrast', 'unpaired-combo', 'overlay-stack', 'brightness-opacity');
  ALTER TABLE "ddw_examples" ALTER COLUMN "preset" SET DATA TYPE "public"."enum_ddw_examples_preset" USING "preset"::"public"."enum_ddw_examples_preset";
  ALTER TABLE "_ddw_v_examples" ALTER COLUMN "preset" SET DATA TYPE "public"."enum_ddw_examples_preset" USING "preset"::"public"."enum_ddw_examples_preset";
  DROP TYPE "public"."enum_thr_language";
  DROP TYPE "public"."enum_tlg_language";
  DROP TYPE "public"."enum_tlg_layout";
  DROP TYPE "public"."enum_tsw_weight";
  DROP TYPE "public"."enum_twt_language";
  DROP TYPE "public"."enum_twt_weight";`)
}
