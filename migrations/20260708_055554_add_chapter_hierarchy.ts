import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_chapters_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_chapters_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guideline_chapters_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "guideline_chapters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_guideline_chapters_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "guideline_chapters_locales" (
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_chapters_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_display_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__guideline_chapters_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__guideline_chapters_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_guideline_chapters_v_locales" (
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "guideline_sections" ADD COLUMN "chapter_id" integer;
  ALTER TABLE "_guideline_sections_v" ADD COLUMN "version_chapter_id" integer;
  ALTER TABLE "search_rels" ADD COLUMN "guideline_chapters_id" integer;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_find_chapters" boolean DEFAULT true;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guideline_chapters_id" integer;
  ALTER TABLE "guideline_chapters_locales" ADD CONSTRAINT "guideline_chapters_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_chapters_v" ADD CONSTRAINT "_guideline_chapters_v_parent_id_guideline_chapters_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_chapters_v_locales" ADD CONSTRAINT "_guideline_chapters_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_chapters_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_chapters_updated_at_idx" ON "guideline_chapters" USING btree ("updated_at");
  CREATE INDEX "guideline_chapters_created_at_idx" ON "guideline_chapters" USING btree ("created_at");
  CREATE INDEX "guideline_chapters__status_idx" ON "guideline_chapters" USING btree ("_status");
  CREATE UNIQUE INDEX "guideline_chapters_slug_idx" ON "guideline_chapters_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "guideline_chapters_locales_locale_parent_id_unique" ON "guideline_chapters_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_chapters_v_parent_idx" ON "_guideline_chapters_v" USING btree ("parent_id");
  CREATE INDEX "_guideline_chapters_v_version_version_updated_at_idx" ON "_guideline_chapters_v" USING btree ("version_updated_at");
  CREATE INDEX "_guideline_chapters_v_version_version_created_at_idx" ON "_guideline_chapters_v" USING btree ("version_created_at");
  CREATE INDEX "_guideline_chapters_v_version_version__status_idx" ON "_guideline_chapters_v" USING btree ("version__status");
  CREATE INDEX "_guideline_chapters_v_created_at_idx" ON "_guideline_chapters_v" USING btree ("created_at");
  CREATE INDEX "_guideline_chapters_v_updated_at_idx" ON "_guideline_chapters_v" USING btree ("updated_at");
  CREATE INDEX "_guideline_chapters_v_snapshot_idx" ON "_guideline_chapters_v" USING btree ("snapshot");
  CREATE INDEX "_guideline_chapters_v_published_locale_idx" ON "_guideline_chapters_v" USING btree ("published_locale");
  CREATE INDEX "_guideline_chapters_v_latest_idx" ON "_guideline_chapters_v" USING btree ("latest");
  CREATE INDEX "_guideline_chapters_v_version_version_slug_idx" ON "_guideline_chapters_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_guideline_chapters_v_locales_locale_parent_id_unique" ON "_guideline_chapters_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "guideline_sections" ADD CONSTRAINT "guideline_sections_chapter_id_guideline_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v" ADD CONSTRAINT "_guideline_sections_v_version_chapter_id_guideline_chapters_id_fk" FOREIGN KEY ("version_chapter_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_chapters_fk" FOREIGN KEY ("guideline_chapters_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chapters_fk" FOREIGN KEY ("guideline_chapters_id") REFERENCES "public"."guideline_chapters"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_sections_chapter_idx" ON "guideline_sections" USING btree ("chapter_id");
  CREATE INDEX "_guideline_sections_v_version_version_chapter_idx" ON "_guideline_sections_v" USING btree ("version_chapter_id");
  CREATE INDEX "search_rels_guideline_chapters_id_idx" ON "search_rels" USING btree ("guideline_chapters_id");
  CREATE INDEX "payload_locked_documents_rels_guideline_chapters_id_idx" ON "payload_locked_documents_rels" USING btree ("guideline_chapters_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_chapters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_chapters_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_chapters_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_chapters_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_chapters" CASCADE;
  DROP TABLE "guideline_chapters_locales" CASCADE;
  DROP TABLE "_guideline_chapters_v" CASCADE;
  DROP TABLE "_guideline_chapters_v_locales" CASCADE;
  ALTER TABLE "guideline_sections" DROP CONSTRAINT "guideline_sections_chapter_id_guideline_chapters_id_fk";
  
  ALTER TABLE "_guideline_sections_v" DROP CONSTRAINT "_guideline_sections_v_version_chapter_id_guideline_chapters_id_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_chapters_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_chapters_fk";
  
  DROP INDEX "guideline_sections_chapter_idx";
  DROP INDEX "_guideline_sections_v_version_version_chapter_idx";
  DROP INDEX "search_rels_guideline_chapters_id_idx";
  DROP INDEX "payload_locked_documents_rels_guideline_chapters_id_idx";
  ALTER TABLE "guideline_sections" DROP COLUMN "chapter_id";
  ALTER TABLE "_guideline_sections_v" DROP COLUMN "version_chapter_id";
  ALTER TABLE "search_rels" DROP COLUMN "guideline_chapters_id";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_find_chapters";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guideline_chapters_id";
  DROP TYPE "public"."enum_guideline_chapters_status";
  DROP TYPE "public"."enum__guideline_chapters_v_version_status";
  DROP TYPE "public"."enum__guideline_chapters_v_published_locale";`)
}
