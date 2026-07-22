import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_pages_blocks_do_dont_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TYPE "public"."enum__guideline_pages_v_blocks_do_dont_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TABLE "guideline_pages_blocks_do_dont_groups_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_guideline_pages_blocks_do_dont_groups_examples_kind" DEFAULT 'dont',
  	"image_id" integer
  );
  
  CREATE TABLE "guideline_pages_blocks_do_dont_groups_examples_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_pages_blocks_do_dont_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rule_id" integer
  );
  
  CREATE TABLE "guideline_pages_blocks_do_dont_groups_locales" (
  	"category" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_pages_blocks_do_dont" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_pages_blocks_do_dont_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__guideline_pages_v_blocks_do_dont_groups_examples_kind" DEFAULT 'dont',
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_do_dont_groups_examples_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_do_dont_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rule_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_do_dont_groups_locales" (
  	"category" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_do_dont" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_do_dont_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "guideline_pages_rels" DROP CONSTRAINT "guideline_pages_rels_rules_fk";
  
  ALTER TABLE "_guideline_pages_v_rels" DROP CONSTRAINT "_guideline_pages_v_rels_rules_fk";
  
  DROP INDEX "guideline_pages_rels_rules_id_idx";
  DROP INDEX "_guideline_pages_v_rels_rules_id_idx";
  ALTER TABLE "guideline_pages_blocks_column_unit" ADD COLUMN "rule_id" integer;
  ALTER TABLE "guideline_pages_blocks_media_showcase" ADD COLUMN "rule_id" integer;
  ALTER TABLE "guideline_pages_blocks_color_palette" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" ADD COLUMN "rule_id" integer;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" ADD COLUMN "rule_id" integer;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples_locales" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_examples_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_locales" ADD CONSTRAINT "guideline_pages_blocks_do_dont_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont" ADD CONSTRAINT "guideline_pages_blocks_do_dont_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_do_dont_locales" ADD CONSTRAINT "guideline_pages_blocks_do_dont_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_examples_locales_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_groups_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_do_dont_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_examples_order_idx" ON "guideline_pages_blocks_do_dont_groups_examples" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_examples_parent_id_idx" ON "guideline_pages_blocks_do_dont_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_examples_image_idx" ON "guideline_pages_blocks_do_dont_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "guideline_pages_blocks_do_dont_groups_examples_locales_local" ON "guideline_pages_blocks_do_dont_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_order_idx" ON "guideline_pages_blocks_do_dont_groups" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_parent_id_idx" ON "guideline_pages_blocks_do_dont_groups" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_groups_rule_idx" ON "guideline_pages_blocks_do_dont_groups" USING btree ("rule_id");
  CREATE UNIQUE INDEX "guideline_pages_blocks_do_dont_groups_locales_locale_parent_" ON "guideline_pages_blocks_do_dont_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_order_idx" ON "guideline_pages_blocks_do_dont" USING btree ("_order");
  CREATE INDEX "guideline_pages_blocks_do_dont_parent_id_idx" ON "guideline_pages_blocks_do_dont" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_blocks_do_dont_path_idx" ON "guideline_pages_blocks_do_dont" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_pages_blocks_do_dont_locales_locale_parent_id_uniq" ON "guideline_pages_blocks_do_dont_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_examples_order_idx" ON "_guideline_pages_v_blocks_do_dont_groups_examples" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_examples_parent_id_idx" ON "_guideline_pages_v_blocks_do_dont_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_examples_image_idx" ON "_guideline_pages_v_blocks_do_dont_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_do_dont_groups_examples_locales_lo" ON "_guideline_pages_v_blocks_do_dont_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_order_idx" ON "_guideline_pages_v_blocks_do_dont_groups" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_parent_id_idx" ON "_guideline_pages_v_blocks_do_dont_groups" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_groups_rule_idx" ON "_guideline_pages_v_blocks_do_dont_groups" USING btree ("rule_id");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_do_dont_groups_locales_locale_pare" ON "_guideline_pages_v_blocks_do_dont_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_order_idx" ON "_guideline_pages_v_blocks_do_dont" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_parent_id_idx" ON "_guideline_pages_v_blocks_do_dont" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_blocks_do_dont_path_idx" ON "_guideline_pages_v_blocks_do_dont" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_do_dont_locales_locale_parent_id_u" ON "_guideline_pages_v_blocks_do_dont_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "guideline_pages_blocks_column_unit" ADD CONSTRAINT "guideline_pages_blocks_column_unit_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_media_showcase" ADD CONSTRAINT "guideline_pages_blocks_media_showcase_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_color_palette" ADD CONSTRAINT "guideline_pages_blocks_color_palette_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_pages_v_blocks_media_showcase_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" ADD CONSTRAINT "_guideline_pages_v_blocks_color_palette_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "guideline_pages_blocks_column_unit_rule_idx" ON "guideline_pages_blocks_column_unit" USING btree ("rule_id");
  CREATE INDEX "guideline_pages_blocks_media_showcase_rule_idx" ON "guideline_pages_blocks_media_showcase" USING btree ("rule_id");
  CREATE INDEX "guideline_pages_blocks_color_palette_rule_idx" ON "guideline_pages_blocks_color_palette" USING btree ("rule_id");
  CREATE INDEX "_guideline_pages_v_blocks_column_unit_rule_idx" ON "_guideline_pages_v_blocks_column_unit" USING btree ("rule_id");
  CREATE INDEX "_guideline_pages_v_blocks_media_showcase_rule_idx" ON "_guideline_pages_v_blocks_media_showcase" USING btree ("rule_id");
  CREATE INDEX "_guideline_pages_v_blocks_color_palette_rule_idx" ON "_guideline_pages_v_blocks_color_palette" USING btree ("rule_id");
  ALTER TABLE "guideline_pages_rels" DROP COLUMN "rules_id";
  ALTER TABLE "_guideline_pages_v_rels" DROP COLUMN "rules_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_blocks_do_dont_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_blocks_do_dont_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_pages_blocks_do_dont_groups_examples" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_groups_examples_locales" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_groups" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_groups_locales" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont" CASCADE;
  DROP TABLE "guideline_pages_blocks_do_dont_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_groups_examples" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_groups_examples_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_groups" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_groups_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_do_dont_locales" CASCADE;
  ALTER TABLE "guideline_pages_blocks_column_unit" DROP CONSTRAINT "guideline_pages_blocks_column_unit_rule_id_rules_id_fk";
  
  ALTER TABLE "guideline_pages_blocks_media_showcase" DROP CONSTRAINT "guideline_pages_blocks_media_showcase_rule_id_rules_id_fk";
  
  ALTER TABLE "guideline_pages_blocks_color_palette" DROP CONSTRAINT "guideline_pages_blocks_color_palette_rule_id_rules_id_fk";
  
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" DROP CONSTRAINT "_guideline_pages_v_blocks_column_unit_rule_id_rules_id_fk";
  
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" DROP CONSTRAINT "_guideline_pages_v_blocks_media_showcase_rule_id_rules_id_fk";
  
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" DROP CONSTRAINT "_guideline_pages_v_blocks_color_palette_rule_id_rules_id_fk";
  
  DROP INDEX "guideline_pages_blocks_column_unit_rule_idx";
  DROP INDEX "guideline_pages_blocks_media_showcase_rule_idx";
  DROP INDEX "guideline_pages_blocks_color_palette_rule_idx";
  DROP INDEX "_guideline_pages_v_blocks_column_unit_rule_idx";
  DROP INDEX "_guideline_pages_v_blocks_media_showcase_rule_idx";
  DROP INDEX "_guideline_pages_v_blocks_color_palette_rule_idx";
  ALTER TABLE "guideline_pages_rels" ADD COLUMN "rules_id" integer;
  ALTER TABLE "_guideline_pages_v_rels" ADD COLUMN "rules_id" integer;
  ALTER TABLE "guideline_pages_rels" ADD CONSTRAINT "guideline_pages_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_rels" ADD CONSTRAINT "_guideline_pages_v_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_pages_rels_rules_id_idx" ON "guideline_pages_rels" USING btree ("rules_id");
  CREATE INDEX "_guideline_pages_v_rels_rules_id_idx" ON "_guideline_pages_v_rels" USING btree ("rules_id");
  ALTER TABLE "guideline_pages_blocks_column_unit" DROP COLUMN "rule_id";
  ALTER TABLE "guideline_pages_blocks_media_showcase" DROP COLUMN "rule_id";
  ALTER TABLE "guideline_pages_blocks_color_palette" DROP COLUMN "rule_id";
  ALTER TABLE "_guideline_pages_v_blocks_column_unit" DROP COLUMN "rule_id";
  ALTER TABLE "_guideline_pages_v_blocks_media_showcase" DROP COLUMN "rule_id";
  ALTER TABLE "_guideline_pages_v_blocks_color_palette" DROP COLUMN "rule_id";
  DROP TYPE "public"."enum_guideline_pages_blocks_do_dont_groups_examples_kind";
  DROP TYPE "public"."enum__guideline_pages_v_blocks_do_dont_groups_examples_kind";`)
}
