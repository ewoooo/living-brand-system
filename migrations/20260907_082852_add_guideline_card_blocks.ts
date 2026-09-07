import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_card_ratio" AS ENUM('1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16');
  CREATE TYPE "public"."enum_block_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum_block_row_height" AS ENUM('low', 'medium', 'high');
  CREATE TABLE "sdp" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "bse_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ratio" "enum_card_ratio" DEFAULT '16:9'
  );
  
  CREATE TABLE "bse_cards_locales" (
  	"caption_title" varchar,
  	"caption_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "bse" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_block_layout" DEFAULT 'grid',
  	"row_height" "enum_block_row_height" DEFAULT 'medium',
  	"asset_download" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "bse_locales" (
  	"title" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "ovw_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ratio" "enum_card_ratio" DEFAULT '16:9'
  );
  
  CREATE TABLE "ovw_cards_locales" (
  	"caption_title" varchar,
  	"caption_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "ovw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_block_layout" DEFAULT 'carousel',
  	"row_height" "enum_block_row_height" DEFAULT 'medium',
  	"asset_download" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "ovw_locales" (
  	"title" varchar DEFAULT '한 눈에 보기',
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "exm_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ratio" "enum_card_ratio" DEFAULT '16:9'
  );
  
  CREATE TABLE "exm_cards_locales" (
  	"caption_title" varchar,
  	"caption_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "exm" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_block_layout" DEFAULT 'carousel',
  	"row_height" "enum_block_row_height" DEFAULT 'medium',
  	"asset_download" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "exm_locales" (
  	"title" varchar DEFAULT '예제',
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_sdp_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_bse_v_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ratio" "enum_card_ratio" DEFAULT '16:9',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_bse_v_cards_locales" (
  	"caption_title" varchar,
  	"caption_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_bse_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum_block_layout" DEFAULT 'grid',
  	"row_height" "enum_block_row_height" DEFAULT 'medium',
  	"asset_download" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_bse_v_locales" (
  	"title" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_ovw_v_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ratio" "enum_card_ratio" DEFAULT '16:9',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ovw_v_cards_locales" (
  	"caption_title" varchar,
  	"caption_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_ovw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum_block_layout" DEFAULT 'carousel',
  	"row_height" "enum_block_row_height" DEFAULT 'medium',
  	"asset_download" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_ovw_v_locales" (
  	"title" varchar DEFAULT '한 눈에 보기',
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_exm_v_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ratio" "enum_card_ratio" DEFAULT '16:9',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_exm_v_cards_locales" (
  	"caption_title" varchar,
  	"caption_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_exm_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum_block_layout" DEFAULT 'carousel',
  	"row_height" "enum_block_row_height" DEFAULT 'medium',
  	"asset_download" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_exm_v_locales" (
  	"title" varchar DEFAULT '예제',
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "sdp" ADD CONSTRAINT "sdp_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sdp" ADD CONSTRAINT "sdp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bse_cards" ADD CONSTRAINT "bse_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bse"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bse_cards_locales" ADD CONSTRAINT "bse_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bse_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bse" ADD CONSTRAINT "bse_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bse_locales" ADD CONSTRAINT "bse_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bse"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ovw_cards" ADD CONSTRAINT "ovw_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ovw"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ovw_cards_locales" ADD CONSTRAINT "ovw_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ovw_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ovw" ADD CONSTRAINT "ovw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ovw_locales" ADD CONSTRAINT "ovw_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ovw"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exm_cards" ADD CONSTRAINT "exm_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exm"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exm_cards_locales" ADD CONSTRAINT "exm_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exm_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exm" ADD CONSTRAINT "exm_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exm_locales" ADD CONSTRAINT "exm_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exm"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sdp_v" ADD CONSTRAINT "_sdp_v_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sdp_v" ADD CONSTRAINT "_sdp_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_bse_v_cards" ADD CONSTRAINT "_bse_v_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bse_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_bse_v_cards_locales" ADD CONSTRAINT "_bse_v_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bse_v_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_bse_v" ADD CONSTRAINT "_bse_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_bse_v_locales" ADD CONSTRAINT "_bse_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bse_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ovw_v_cards" ADD CONSTRAINT "_ovw_v_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ovw_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ovw_v_cards_locales" ADD CONSTRAINT "_ovw_v_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ovw_v_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ovw_v" ADD CONSTRAINT "_ovw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ovw_v_locales" ADD CONSTRAINT "_ovw_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ovw_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_exm_v_cards" ADD CONSTRAINT "_exm_v_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_exm_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_exm_v_cards_locales" ADD CONSTRAINT "_exm_v_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_exm_v_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_exm_v" ADD CONSTRAINT "_exm_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_exm_v_locales" ADD CONSTRAINT "_exm_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_exm_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sdp_order_idx" ON "sdp" USING btree ("_order");
  CREATE INDEX "sdp_parent_id_idx" ON "sdp" USING btree ("_parent_id");
  CREATE INDEX "sdp_path_idx" ON "sdp" USING btree ("_path");
  CREATE INDEX "sdp_image_idx" ON "sdp" USING btree ("image_id");
  CREATE INDEX "bse_cards_order_idx" ON "bse_cards" USING btree ("_order");
  CREATE INDEX "bse_cards_parent_id_idx" ON "bse_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "bse_cards_locales_locale_parent_id_unique" ON "bse_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "bse_order_idx" ON "bse" USING btree ("_order");
  CREATE INDEX "bse_parent_id_idx" ON "bse" USING btree ("_parent_id");
  CREATE INDEX "bse_path_idx" ON "bse" USING btree ("_path");
  CREATE UNIQUE INDEX "bse_locales_locale_parent_id_unique" ON "bse_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ovw_cards_order_idx" ON "ovw_cards" USING btree ("_order");
  CREATE INDEX "ovw_cards_parent_id_idx" ON "ovw_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "ovw_cards_locales_locale_parent_id_unique" ON "ovw_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ovw_order_idx" ON "ovw" USING btree ("_order");
  CREATE INDEX "ovw_parent_id_idx" ON "ovw" USING btree ("_parent_id");
  CREATE INDEX "ovw_path_idx" ON "ovw" USING btree ("_path");
  CREATE UNIQUE INDEX "ovw_locales_locale_parent_id_unique" ON "ovw_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exm_cards_order_idx" ON "exm_cards" USING btree ("_order");
  CREATE INDEX "exm_cards_parent_id_idx" ON "exm_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "exm_cards_locales_locale_parent_id_unique" ON "exm_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exm_order_idx" ON "exm" USING btree ("_order");
  CREATE INDEX "exm_parent_id_idx" ON "exm" USING btree ("_parent_id");
  CREATE INDEX "exm_path_idx" ON "exm" USING btree ("_path");
  CREATE UNIQUE INDEX "exm_locales_locale_parent_id_unique" ON "exm_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sdp_v_order_idx" ON "_sdp_v" USING btree ("_order");
  CREATE INDEX "_sdp_v_parent_id_idx" ON "_sdp_v" USING btree ("_parent_id");
  CREATE INDEX "_sdp_v_path_idx" ON "_sdp_v" USING btree ("_path");
  CREATE INDEX "_sdp_v_image_idx" ON "_sdp_v" USING btree ("image_id");
  CREATE INDEX "_bse_v_cards_order_idx" ON "_bse_v_cards" USING btree ("_order");
  CREATE INDEX "_bse_v_cards_parent_id_idx" ON "_bse_v_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_bse_v_cards_locales_locale_parent_id_unique" ON "_bse_v_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_bse_v_order_idx" ON "_bse_v" USING btree ("_order");
  CREATE INDEX "_bse_v_parent_id_idx" ON "_bse_v" USING btree ("_parent_id");
  CREATE INDEX "_bse_v_path_idx" ON "_bse_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_bse_v_locales_locale_parent_id_unique" ON "_bse_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_ovw_v_cards_order_idx" ON "_ovw_v_cards" USING btree ("_order");
  CREATE INDEX "_ovw_v_cards_parent_id_idx" ON "_ovw_v_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_ovw_v_cards_locales_locale_parent_id_unique" ON "_ovw_v_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_ovw_v_order_idx" ON "_ovw_v" USING btree ("_order");
  CREATE INDEX "_ovw_v_parent_id_idx" ON "_ovw_v" USING btree ("_parent_id");
  CREATE INDEX "_ovw_v_path_idx" ON "_ovw_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_ovw_v_locales_locale_parent_id_unique" ON "_ovw_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_exm_v_cards_order_idx" ON "_exm_v_cards" USING btree ("_order");
  CREATE INDEX "_exm_v_cards_parent_id_idx" ON "_exm_v_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_exm_v_cards_locales_locale_parent_id_unique" ON "_exm_v_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_exm_v_order_idx" ON "_exm_v" USING btree ("_order");
  CREATE INDEX "_exm_v_parent_id_idx" ON "_exm_v" USING btree ("_parent_id");
  CREATE INDEX "_exm_v_path_idx" ON "_exm_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_exm_v_locales_locale_parent_id_unique" ON "_exm_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "sdp" CASCADE;
  DROP TABLE "bse_cards" CASCADE;
  DROP TABLE "bse_cards_locales" CASCADE;
  DROP TABLE "bse" CASCADE;
  DROP TABLE "bse_locales" CASCADE;
  DROP TABLE "ovw_cards" CASCADE;
  DROP TABLE "ovw_cards_locales" CASCADE;
  DROP TABLE "ovw" CASCADE;
  DROP TABLE "ovw_locales" CASCADE;
  DROP TABLE "exm_cards" CASCADE;
  DROP TABLE "exm_cards_locales" CASCADE;
  DROP TABLE "exm" CASCADE;
  DROP TABLE "exm_locales" CASCADE;
  DROP TABLE "_sdp_v" CASCADE;
  DROP TABLE "_bse_v_cards" CASCADE;
  DROP TABLE "_bse_v_cards_locales" CASCADE;
  DROP TABLE "_bse_v" CASCADE;
  DROP TABLE "_bse_v_locales" CASCADE;
  DROP TABLE "_ovw_v_cards" CASCADE;
  DROP TABLE "_ovw_v_cards_locales" CASCADE;
  DROP TABLE "_ovw_v" CASCADE;
  DROP TABLE "_ovw_v_locales" CASCADE;
  DROP TABLE "_exm_v_cards" CASCADE;
  DROP TABLE "_exm_v_cards_locales" CASCADE;
  DROP TABLE "_exm_v" CASCADE;
  DROP TABLE "_exm_v_locales" CASCADE;
  DROP TYPE "public"."enum_card_ratio";
  DROP TYPE "public"."enum_block_layout";
  DROP TYPE "public"."enum_block_row_height";`)
}
