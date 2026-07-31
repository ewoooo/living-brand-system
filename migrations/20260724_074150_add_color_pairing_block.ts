import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_color_pairing_system" AS ENUM('tone-in-tone', 'tone-on-tone', 'mono-tone');
  CREATE TABLE "guideline_docs_blocks_color_pairing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"system" "enum_color_pairing_system" DEFAULT 'tone-in-tone',
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_color_pairing_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_pairing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"system" "enum_color_pairing_system" DEFAULT 'tone-in-tone',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_pairing_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "guideline_docs_blocks_color_pairing" ADD CONSTRAINT "guideline_docs_blocks_color_pairing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_pairing_locales" ADD CONSTRAINT "guideline_docs_blocks_color_pairing_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_color_pairing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing" ADD CONSTRAINT "_guideline_docs_v_blocks_color_pairing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_color_pairing_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_color_pairing"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_color_pairing_order_idx" ON "guideline_docs_blocks_color_pairing" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_color_pairing_parent_id_idx" ON "guideline_docs_blocks_color_pairing" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_color_pairing_path_idx" ON "guideline_docs_blocks_color_pairing" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_color_pairing_locales_locale_parent_id" ON "guideline_docs_blocks_color_pairing_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_pairing_order_idx" ON "_guideline_docs_v_blocks_color_pairing" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_color_pairing_parent_id_idx" ON "_guideline_docs_v_blocks_color_pairing" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_pairing_path_idx" ON "_guideline_docs_v_blocks_color_pairing" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_color_pairing_locales_locale_parent" ON "_guideline_docs_v_blocks_color_pairing_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guideline_docs_blocks_color_pairing" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_pairing_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_pairing" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_pairing_locales" CASCADE;
  DROP TYPE "public"."enum_color_pairing_system";`)
}
