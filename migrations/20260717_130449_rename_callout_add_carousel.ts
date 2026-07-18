import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Fresh replay에서는 20260714_031500 프렐류드가 현재 스키마를 선반영한다.
  // 기존 DB에서만 policyCallout 테이블을 rename해 데이터를 보존하고 carousel을 추가한다.
  const { rows: shaped } = await db.execute(
    sql`SELECT
      to_regclass('public.guideline_docs_blocks_callout') AS callout,
      to_regclass('public.guideline_docs_blocks_carousel') AS carousel`,
  )
  const alreadyShaped = shaped?.[0]?.callout != null && shaped?.[0]?.carousel != null

  if (alreadyShaped) return

  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_blocks_carousel_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_carousel_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
  ALTER TYPE "public"."enum_guideline_docs_blocks_policy_callout_kind" RENAME TO "enum_guideline_docs_blocks_callout_kind";
  ALTER TYPE "public"."enum__guideline_docs_v_blocks_policy_callout_kind" RENAME TO "enum__guideline_docs_v_blocks_callout_kind";
  CREATE TABLE "guideline_docs_blocks_carousel_slides" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer
  );

  CREATE TABLE "guideline_docs_blocks_carousel_slides_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "guideline_docs_blocks_carousel" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_ratio" "enum_guideline_docs_blocks_carousel_image_ratio" DEFAULT '16:9',
	"block_name" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_carousel_slides" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"_uuid" varchar
  );

  CREATE TABLE "_guideline_docs_v_blocks_carousel_slides_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_guideline_docs_v_blocks_carousel" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_ratio" "enum__guideline_docs_v_blocks_carousel_image_ratio" DEFAULT '16:9',
	"_uuid" varchar,
	"block_name" varchar
  );

  ALTER TABLE "guideline_docs_blocks_policy_callout_items" RENAME TO "guideline_docs_blocks_callout_items";
  ALTER TABLE "guideline_docs_blocks_policy_callout_items_locales" RENAME TO "guideline_docs_blocks_callout_items_locales";
  ALTER TABLE "guideline_docs_blocks_policy_callout" RENAME TO "guideline_docs_blocks_callout";
  ALTER TABLE "guideline_docs_blocks_policy_callout_locales" RENAME TO "guideline_docs_blocks_callout_locales";
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items" RENAME TO "_guideline_docs_v_blocks_callout_items";
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items_locales" RENAME TO "_guideline_docs_v_blocks_callout_items_locales";
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout" RENAME TO "_guideline_docs_v_blocks_callout";
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_locales" RENAME TO "_guideline_docs_v_blocks_callout_locales";
  ALTER TABLE "guideline_docs_blocks_callout_items" DROP CONSTRAINT "guideline_docs_blocks_policy_callout_items_parent_id_fk";

  ALTER TABLE "guideline_docs_blocks_callout_items_locales" DROP CONSTRAINT "guideline_docs_blocks_policy_callout_items_locales_parent_fk";

  ALTER TABLE "guideline_docs_blocks_callout" DROP CONSTRAINT "guideline_docs_blocks_policy_callout_parent_id_fk";

  ALTER TABLE "guideline_docs_blocks_callout_locales" DROP CONSTRAINT "guideline_docs_blocks_policy_callout_locales_parent_id_fk";

  ALTER TABLE "_guideline_docs_v_blocks_callout_items" DROP CONSTRAINT "_guideline_docs_v_blocks_policy_callout_items_parent_id_fk";

  ALTER TABLE "_guideline_docs_v_blocks_callout_items_locales" DROP CONSTRAINT "_guideline_docs_v_blocks_policy_callout_items_locales_par_fk";

  ALTER TABLE "_guideline_docs_v_blocks_callout" DROP CONSTRAINT "_guideline_docs_v_blocks_policy_callout_parent_id_fk";

  ALTER TABLE "_guideline_docs_v_blocks_callout_locales" DROP CONSTRAINT "_guideline_docs_v_blocks_policy_callout_locales_parent_id_fk";

  DROP INDEX "guideline_docs_blocks_policy_callout_items_order_idx";
  DROP INDEX "guideline_docs_blocks_policy_callout_items_parent_id_idx";
  DROP INDEX "guideline_docs_blocks_policy_callout_items_locales_locale_pa";
  DROP INDEX "guideline_docs_blocks_policy_callout_order_idx";
  DROP INDEX "guideline_docs_blocks_policy_callout_parent_id_idx";
  DROP INDEX "guideline_docs_blocks_policy_callout_path_idx";
  DROP INDEX "guideline_docs_blocks_policy_callout_locales_locale_parent_i";
  DROP INDEX "_guideline_docs_v_blocks_policy_callout_items_order_idx";
  DROP INDEX "_guideline_docs_v_blocks_policy_callout_items_parent_id_idx";
  DROP INDEX "_guideline_docs_v_blocks_policy_callout_items_locales_locale";
  DROP INDEX "_guideline_docs_v_blocks_policy_callout_order_idx";
  DROP INDEX "_guideline_docs_v_blocks_policy_callout_parent_id_idx";
  DROP INDEX "_guideline_docs_v_blocks_policy_callout_path_idx";
  DROP INDEX "_guideline_docs_v_blocks_policy_callout_locales_locale_paren";
  ALTER TABLE "guideline_docs_blocks_carousel_slides" ADD CONSTRAINT "guideline_docs_blocks_carousel_slides_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_carousel_slides" ADD CONSTRAINT "guideline_docs_blocks_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_carousel_slides_locales" ADD CONSTRAINT "guideline_docs_blocks_carousel_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_carousel_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_carousel" ADD CONSTRAINT "guideline_docs_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_slides_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_slides_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_carousel_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_carousel" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_carousel_slides_order_idx" ON "guideline_docs_blocks_carousel_slides" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_carousel_slides_parent_id_idx" ON "guideline_docs_blocks_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_carousel_slides_image_idx" ON "guideline_docs_blocks_carousel_slides" USING btree ("image_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_carousel_slides_locales_locale_parent_" ON "guideline_docs_blocks_carousel_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_carousel_order_idx" ON "guideline_docs_blocks_carousel" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_carousel_parent_id_idx" ON "guideline_docs_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_carousel_path_idx" ON "guideline_docs_blocks_carousel" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_slides_order_idx" ON "_guideline_docs_v_blocks_carousel_slides" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_slides_parent_id_idx" ON "_guideline_docs_v_blocks_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_slides_image_idx" ON "_guideline_docs_v_blocks_carousel_slides" USING btree ("image_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_carousel_slides_locales_locale_pare" ON "_guideline_docs_v_blocks_carousel_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_order_idx" ON "_guideline_docs_v_blocks_carousel" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_parent_id_idx" ON "_guideline_docs_v_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_path_idx" ON "_guideline_docs_v_blocks_carousel" USING btree ("_path");
  ALTER TABLE "guideline_docs_blocks_callout_items" ADD CONSTRAINT "guideline_docs_blocks_callout_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_callout_items_locales" ADD CONSTRAINT "guideline_docs_blocks_callout_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_callout_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_callout" ADD CONSTRAINT "guideline_docs_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_callout_locales" ADD CONSTRAINT "guideline_docs_blocks_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_callout_items" ADD CONSTRAINT "_guideline_docs_v_blocks_callout_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_callout_items_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_callout_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_callout_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_callout" ADD CONSTRAINT "_guideline_docs_v_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_callout_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_callout_items_order_idx" ON "guideline_docs_blocks_callout_items" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_callout_items_parent_id_idx" ON "guideline_docs_blocks_callout_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_callout_items_locales_locale_parent_id" ON "guideline_docs_blocks_callout_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_callout_order_idx" ON "guideline_docs_blocks_callout" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_callout_parent_id_idx" ON "guideline_docs_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_callout_path_idx" ON "guideline_docs_blocks_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_callout_locales_locale_parent_id_uniqu" ON "guideline_docs_blocks_callout_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_callout_items_order_idx" ON "_guideline_docs_v_blocks_callout_items" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_callout_items_parent_id_idx" ON "_guideline_docs_v_blocks_callout_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_callout_items_locales_locale_parent" ON "_guideline_docs_v_blocks_callout_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_callout_order_idx" ON "_guideline_docs_v_blocks_callout" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_callout_parent_id_idx" ON "_guideline_docs_v_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_callout_path_idx" ON "_guideline_docs_v_blocks_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_callout_locales_locale_parent_id_un" ON "_guideline_docs_v_blocks_callout_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_guideline_docs_blocks_callout_kind" RENAME TO "enum_guideline_docs_blocks_policy_callout_kind";
  ALTER TYPE "public"."enum__guideline_docs_v_blocks_callout_kind" RENAME TO "enum__guideline_docs_v_blocks_policy_callout_kind";
  ALTER TABLE "guideline_docs_blocks_carousel_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_carousel_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_carousel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_carousel" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_docs_blocks_carousel_slides" CASCADE;
  DROP TABLE "guideline_docs_blocks_carousel_slides_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_carousel" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_carousel_slides" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_carousel_slides_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_carousel" CASCADE;
  ALTER TABLE "guideline_docs_blocks_callout_items" RENAME TO "guideline_docs_blocks_policy_callout_items";
  ALTER TABLE "guideline_docs_blocks_callout_items_locales" RENAME TO "guideline_docs_blocks_policy_callout_items_locales";
  ALTER TABLE "guideline_docs_blocks_callout" RENAME TO "guideline_docs_blocks_policy_callout";
  ALTER TABLE "guideline_docs_blocks_callout_locales" RENAME TO "guideline_docs_blocks_policy_callout_locales";
  ALTER TABLE "_guideline_docs_v_blocks_callout_items" RENAME TO "_guideline_docs_v_blocks_policy_callout_items";
  ALTER TABLE "_guideline_docs_v_blocks_callout_items_locales" RENAME TO "_guideline_docs_v_blocks_policy_callout_items_locales";
  ALTER TABLE "_guideline_docs_v_blocks_callout" RENAME TO "_guideline_docs_v_blocks_policy_callout";
  ALTER TABLE "_guideline_docs_v_blocks_callout_locales" RENAME TO "_guideline_docs_v_blocks_policy_callout_locales";
  ALTER TABLE "guideline_docs_blocks_policy_callout_items" DROP CONSTRAINT "guideline_docs_blocks_callout_items_parent_id_fk";

  ALTER TABLE "guideline_docs_blocks_policy_callout_items_locales" DROP CONSTRAINT "guideline_docs_blocks_callout_items_locales_parent_id_fk";

  ALTER TABLE "guideline_docs_blocks_policy_callout" DROP CONSTRAINT "guideline_docs_blocks_callout_parent_id_fk";

  ALTER TABLE "guideline_docs_blocks_policy_callout_locales" DROP CONSTRAINT "guideline_docs_blocks_callout_locales_parent_id_fk";

  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items" DROP CONSTRAINT "_guideline_docs_v_blocks_callout_items_parent_id_fk";

  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items_locales" DROP CONSTRAINT "_guideline_docs_v_blocks_callout_items_locales_parent_id_fk";

  ALTER TABLE "_guideline_docs_v_blocks_policy_callout" DROP CONSTRAINT "_guideline_docs_v_blocks_callout_parent_id_fk";

  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_locales" DROP CONSTRAINT "_guideline_docs_v_blocks_callout_locales_parent_id_fk";

  DROP INDEX "guideline_docs_blocks_callout_items_order_idx";
  DROP INDEX "guideline_docs_blocks_callout_items_parent_id_idx";
  DROP INDEX "guideline_docs_blocks_callout_items_locales_locale_parent_id";
  DROP INDEX "guideline_docs_blocks_callout_order_idx";
  DROP INDEX "guideline_docs_blocks_callout_parent_id_idx";
  DROP INDEX "guideline_docs_blocks_callout_path_idx";
  DROP INDEX "guideline_docs_blocks_callout_locales_locale_parent_id_uniqu";
  DROP INDEX "_guideline_docs_v_blocks_callout_items_order_idx";
  DROP INDEX "_guideline_docs_v_blocks_callout_items_parent_id_idx";
  DROP INDEX "_guideline_docs_v_blocks_callout_items_locales_locale_parent";
  DROP INDEX "_guideline_docs_v_blocks_callout_order_idx";
  DROP INDEX "_guideline_docs_v_blocks_callout_parent_id_idx";
  DROP INDEX "_guideline_docs_v_blocks_callout_path_idx";
  DROP INDEX "_guideline_docs_v_blocks_callout_locales_locale_parent_id_un";
  ALTER TABLE "guideline_docs_blocks_policy_callout_items" ADD CONSTRAINT "guideline_docs_blocks_policy_callout_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_policy_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_policy_callout_items_locales" ADD CONSTRAINT "guideline_docs_blocks_policy_callout_items_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_policy_callout_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_policy_callout" ADD CONSTRAINT "guideline_docs_blocks_policy_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_policy_callout_locales" ADD CONSTRAINT "guideline_docs_blocks_policy_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_policy_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items" ADD CONSTRAINT "_guideline_docs_v_blocks_policy_callout_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_policy_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_items_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_policy_callout_items_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_policy_callout_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout" ADD CONSTRAINT "_guideline_docs_v_blocks_policy_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_policy_callout_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_policy_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_policy_callout"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_policy_callout_items_order_idx" ON "guideline_docs_blocks_policy_callout_items" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_policy_callout_items_parent_id_idx" ON "guideline_docs_blocks_policy_callout_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_policy_callout_items_locales_locale_pa" ON "guideline_docs_blocks_policy_callout_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_policy_callout_order_idx" ON "guideline_docs_blocks_policy_callout" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_policy_callout_parent_id_idx" ON "guideline_docs_blocks_policy_callout" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_policy_callout_path_idx" ON "guideline_docs_blocks_policy_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_policy_callout_locales_locale_parent_i" ON "guideline_docs_blocks_policy_callout_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_items_order_idx" ON "_guideline_docs_v_blocks_policy_callout_items" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_items_parent_id_idx" ON "_guideline_docs_v_blocks_policy_callout_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_policy_callout_items_locales_locale" ON "_guideline_docs_v_blocks_policy_callout_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_order_idx" ON "_guideline_docs_v_blocks_policy_callout" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_parent_id_idx" ON "_guideline_docs_v_blocks_policy_callout" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_policy_callout_path_idx" ON "_guideline_docs_v_blocks_policy_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_policy_callout_locales_locale_paren" ON "_guideline_docs_v_blocks_policy_callout_locales" USING btree ("_locale","_parent_id");
  DROP TYPE "public"."enum_guideline_docs_blocks_carousel_image_ratio";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_carousel_image_ratio";`)
}
