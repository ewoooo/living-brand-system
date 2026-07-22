import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_brand_icons_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__brand_icons_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__brand_icons_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "brand_icons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_brand_icons_status" DEFAULT 'draft',
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "brand_icons_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_brand_icons_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_group" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__brand_icons_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__brand_icons_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_brand_icons_v_locales" (
  	"version_name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brand_icons_id" integer;
  ALTER TABLE "brand_icons_locales" ADD CONSTRAINT "brand_icons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_icons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_brand_icons_v" ADD CONSTRAINT "_brand_icons_v_parent_id_brand_icons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brand_icons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_brand_icons_v_locales" ADD CONSTRAINT "_brand_icons_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_brand_icons_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "brand_icons_updated_at_idx" ON "brand_icons" USING btree ("updated_at");
  CREATE INDEX "brand_icons_created_at_idx" ON "brand_icons" USING btree ("created_at");
  CREATE INDEX "brand_icons__status_idx" ON "brand_icons" USING btree ("_status");
  CREATE UNIQUE INDEX "brand_icons_filename_idx" ON "brand_icons" USING btree ("filename");
  CREATE UNIQUE INDEX "brand_icons_locales_locale_parent_id_unique" ON "brand_icons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_brand_icons_v_parent_idx" ON "_brand_icons_v" USING btree ("parent_id");
  CREATE INDEX "_brand_icons_v_version_version_updated_at_idx" ON "_brand_icons_v" USING btree ("version_updated_at");
  CREATE INDEX "_brand_icons_v_version_version_created_at_idx" ON "_brand_icons_v" USING btree ("version_created_at");
  CREATE INDEX "_brand_icons_v_version_version__status_idx" ON "_brand_icons_v" USING btree ("version__status");
  CREATE INDEX "_brand_icons_v_version_version_filename_idx" ON "_brand_icons_v" USING btree ("version_filename");
  CREATE INDEX "_brand_icons_v_created_at_idx" ON "_brand_icons_v" USING btree ("created_at");
  CREATE INDEX "_brand_icons_v_updated_at_idx" ON "_brand_icons_v" USING btree ("updated_at");
  CREATE INDEX "_brand_icons_v_snapshot_idx" ON "_brand_icons_v" USING btree ("snapshot");
  CREATE INDEX "_brand_icons_v_published_locale_idx" ON "_brand_icons_v" USING btree ("published_locale");
  CREATE INDEX "_brand_icons_v_latest_idx" ON "_brand_icons_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_brand_icons_v_locales_locale_parent_id_unique" ON "_brand_icons_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_icons_fk" FOREIGN KEY ("brand_icons_id") REFERENCES "public"."brand_icons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_brand_icons_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_icons_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brand_icons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "brand_icons_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_brand_icons_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_brand_icons_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "brand_icons" CASCADE;
  DROP TABLE "brand_icons_locales" CASCADE;
  DROP TABLE "_brand_icons_v" CASCADE;
  DROP TABLE "_brand_icons_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brand_icons_fk";
  
  DROP INDEX "payload_locked_documents_rels_brand_icons_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brand_icons_id";
  DROP TYPE "public"."enum_brand_icons_status";
  DROP TYPE "public"."enum__brand_icons_v_version_status";
  DROP TYPE "public"."enum__brand_icons_v_published_locale";`)
}
