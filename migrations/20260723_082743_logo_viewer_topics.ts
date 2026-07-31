import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_blocks_logo_viewer_topics_kind" AS ENUM('minSize', 'clearSpace', 'registeredMark');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_logo_viewer_topics_kind" AS ENUM('minSize', 'clearSpace', 'registeredMark');
  CREATE TABLE "guideline_docs_blocks_logo_viewer_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_guideline_docs_blocks_logo_viewer_topics_kind"
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_viewer_topics_locales" (
  	"label" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_viewer_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__guideline_docs_v_blocks_logo_viewer_topics_kind",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_viewer_topics_locales" (
  	"label" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD COLUMN "min_size_px" numeric DEFAULT 20;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD COLUMN "registered_min_px" numeric DEFAULT 45;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD COLUMN "min_size_px" numeric DEFAULT 20;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD COLUMN "registered_min_px" numeric DEFAULT 45;
  ALTER TABLE "guideline_docs_blocks_logo_viewer_topics" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer_topics_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_topics_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_viewer_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer_topics" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer_topics_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_topics_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_viewer_topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_logo_viewer_topics_order_idx" ON "guideline_docs_blocks_logo_viewer_topics" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_topics_parent_id_idx" ON "guideline_docs_blocks_logo_viewer_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_viewer_topics_locales_locale_pare" ON "guideline_docs_blocks_logo_viewer_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_topics_order_idx" ON "_guideline_docs_v_blocks_logo_viewer_topics" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_topics_parent_id_idx" ON "_guideline_docs_v_blocks_logo_viewer_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_viewer_topics_locales_locale_p" ON "_guideline_docs_v_blocks_logo_viewer_topics_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guideline_docs_blocks_logo_viewer_topics" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_viewer_topics_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_viewer_topics" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_viewer_topics_locales" CASCADE;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" DROP COLUMN "min_size_px";
  ALTER TABLE "guideline_docs_blocks_logo_viewer" DROP COLUMN "registered_min_px";
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" DROP COLUMN "min_size_px";
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" DROP COLUMN "registered_min_px";
  DROP TYPE "public"."enum_guideline_docs_blocks_logo_viewer_topics_kind";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_logo_viewer_topics_kind";`)
}
