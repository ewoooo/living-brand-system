import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "ddw_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"kind" "enum_guideline_docs_blocks_do_dont_groups_kind" DEFAULT 'dont'
  );
  CREATE TABLE "ddw_examples_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  CREATE TABLE "ddw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_ratio" "enum_guideline_docs_blocks_do_dont_image_ratio" DEFAULT '4:3',
  	"columns" "enum_guideline_docs_blocks_do_dont_example_columns" DEFAULT '3',
  	"block_name" varchar
  );
  CREATE TABLE "_ddw_v_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"kind" "enum_guideline_docs_blocks_do_dont_groups_kind" DEFAULT 'dont',
  	"_uuid" varchar
  );
  CREATE TABLE "_ddw_v_examples_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  CREATE TABLE "_ddw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_ratio" "enum_guideline_docs_blocks_do_dont_image_ratio" DEFAULT '4:3',
  	"columns" "enum_guideline_docs_blocks_do_dont_example_columns" DEFAULT '3',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  ALTER TABLE "ddw_examples" ADD CONSTRAINT "ddw_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ddw_examples" ADD CONSTRAINT "ddw_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ddw"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ddw_examples_locales" ADD CONSTRAINT "ddw_examples_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ddw_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ddw" ADD CONSTRAINT "ddw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ddw_v_examples" ADD CONSTRAINT "_ddw_v_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ddw_v_examples" ADD CONSTRAINT "_ddw_v_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ddw_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ddw_v_examples_locales" ADD CONSTRAINT "_ddw_v_examples_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ddw_v_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ddw_v" ADD CONSTRAINT "_ddw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ddw_examples_order_idx" ON "ddw_examples" USING btree ("_order");
  CREATE INDEX "ddw_examples_parent_id_idx" ON "ddw_examples" USING btree ("_parent_id");
  CREATE INDEX "ddw_examples_image_idx" ON "ddw_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "ddw_examples_locales_locale_parent_id_unique" ON "ddw_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ddw_order_idx" ON "ddw" USING btree ("_order");
  CREATE INDEX "ddw_parent_id_idx" ON "ddw" USING btree ("_parent_id");
  CREATE INDEX "ddw_path_idx" ON "ddw" USING btree ("_path");
  CREATE INDEX "_ddw_v_examples_order_idx" ON "_ddw_v_examples" USING btree ("_order");
  CREATE INDEX "_ddw_v_examples_parent_id_idx" ON "_ddw_v_examples" USING btree ("_parent_id");
  CREATE INDEX "_ddw_v_examples_image_idx" ON "_ddw_v_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "_ddw_v_examples_locales_locale_parent_id_unique" ON "_ddw_v_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_ddw_v_order_idx" ON "_ddw_v" USING btree ("_order");
  CREATE INDEX "_ddw_v_parent_id_idx" ON "_ddw_v" USING btree ("_parent_id");
  CREATE INDEX "_ddw_v_path_idx" ON "_ddw_v" USING btree ("_path");
 `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "ddw_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ddw_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ddw" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ddw_v_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ddw_v_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ddw_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ddw_examples" CASCADE;
  DROP TABLE "ddw_examples_locales" CASCADE;
  DROP TABLE "ddw" CASCADE;
  DROP TABLE "_ddw_v_examples" CASCADE;
  DROP TABLE "_ddw_v_examples_locales" CASCADE;
  DROP TABLE "_ddw_v" CASCADE;
 `)
}
