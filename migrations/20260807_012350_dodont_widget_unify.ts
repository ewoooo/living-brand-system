import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ddw_examples_preset" AS ENUM('off-palette', 'gradient', 'low-contrast', 'unpaired-combo', 'overlay-stack', 'brightness-opacity');
  ALTER TABLE "ciu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ciu_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ciu" CASCADE;
  DROP TABLE "_ciu_v" CASCADE;
  ALTER TABLE "ddw" ALTER COLUMN "image_ratio" SET DEFAULT '16:9';
  ALTER TABLE "_ddw_v" ALTER COLUMN "image_ratio" SET DEFAULT '16:9';
  ALTER TABLE "ddw_examples" ADD COLUMN "preset" "enum_ddw_examples_preset";
  ALTER TABLE "ddw" ADD COLUMN "item_label" varchar DEFAULT 'INCORRECT USAGE';
  ALTER TABLE "ddw" ADD COLUMN "logo_id" integer;
  ALTER TABLE "_ddw_v_examples" ADD COLUMN "preset" "enum_ddw_examples_preset";
  ALTER TABLE "_ddw_v" ADD COLUMN "item_label" varchar DEFAULT 'INCORRECT USAGE';
  ALTER TABLE "_ddw_v" ADD COLUMN "logo_id" integer;
  ALTER TABLE "ddw" ADD CONSTRAINT "ddw_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ddw_v" ADD CONSTRAINT "_ddw_v_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ddw_logo_idx" ON "ddw" USING btree ("logo_id");
  CREATE INDEX "_ddw_v_logo_idx" ON "_ddw_v" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "ciu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "_ciu_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "ddw" DROP CONSTRAINT "ddw_logo_id_brand_logos_id_fk";
  
  ALTER TABLE "_ddw_v" DROP CONSTRAINT "_ddw_v_logo_id_brand_logos_id_fk";
  
  DROP INDEX "ddw_logo_idx";
  DROP INDEX "_ddw_v_logo_idx";
  ALTER TABLE "ddw" ALTER COLUMN "image_ratio" SET DEFAULT '4:3';
  ALTER TABLE "_ddw_v" ALTER COLUMN "image_ratio" SET DEFAULT '4:3';
  ALTER TABLE "ciu" ADD CONSTRAINT "ciu_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ciu" ADD CONSTRAINT "ciu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ciu_v" ADD CONSTRAINT "_ciu_v_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ciu_v" ADD CONSTRAINT "_ciu_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ciu_order_idx" ON "ciu" USING btree ("_order");
  CREATE INDEX "ciu_parent_id_idx" ON "ciu" USING btree ("_parent_id");
  CREATE INDEX "ciu_path_idx" ON "ciu" USING btree ("_path");
  CREATE INDEX "ciu_logo_idx" ON "ciu" USING btree ("logo_id");
  CREATE INDEX "_ciu_v_order_idx" ON "_ciu_v" USING btree ("_order");
  CREATE INDEX "_ciu_v_parent_id_idx" ON "_ciu_v" USING btree ("_parent_id");
  CREATE INDEX "_ciu_v_path_idx" ON "_ciu_v" USING btree ("_path");
  CREATE INDEX "_ciu_v_logo_idx" ON "_ciu_v" USING btree ("logo_id");
  ALTER TABLE "ddw_examples" DROP COLUMN "preset";
  ALTER TABLE "ddw" DROP COLUMN "item_label";
  ALTER TABLE "ddw" DROP COLUMN "logo_id";
  ALTER TABLE "_ddw_v_examples" DROP COLUMN "preset";
  ALTER TABLE "_ddw_v" DROP COLUMN "item_label";
  ALTER TABLE "_ddw_v" DROP COLUMN "logo_id";
  DROP TYPE "public"."enum_ddw_examples_preset";`)
}
