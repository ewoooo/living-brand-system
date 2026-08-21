import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sample_images_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sample_images_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sample_images_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "sample_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_sample_images_status" DEFAULT 'draft',
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  
  CREATE TABLE "sample_images_locales" (
  	"name" varchar,
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sample_images_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__sample_images_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"version_sizes_thumbnail_url" varchar,
  	"version_sizes_thumbnail_width" numeric,
  	"version_sizes_thumbnail_height" numeric,
  	"version_sizes_thumbnail_mime_type" varchar,
  	"version_sizes_thumbnail_filesize" numeric,
  	"version_sizes_thumbnail_filename" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__sample_images_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_sample_images_v_locales" (
  	"version_name" varchar,
  	"version_alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sample_images_id" integer;
  ALTER TABLE "sample_images_locales" ADD CONSTRAINT "sample_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sample_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sample_images_v" ADD CONSTRAINT "_sample_images_v_parent_id_sample_images_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sample_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sample_images_v_locales" ADD CONSTRAINT "_sample_images_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sample_images_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sample_images_updated_at_idx" ON "sample_images" USING btree ("updated_at");
  CREATE INDEX "sample_images_created_at_idx" ON "sample_images" USING btree ("created_at");
  CREATE INDEX "sample_images__status_idx" ON "sample_images" USING btree ("_status");
  CREATE UNIQUE INDEX "sample_images_filename_idx" ON "sample_images" USING btree ("filename");
  CREATE INDEX "sample_images_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "sample_images" USING btree ("sizes_thumbnail_filename");
  CREATE UNIQUE INDEX "sample_images_locales_locale_parent_id_unique" ON "sample_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sample_images_v_parent_idx" ON "_sample_images_v" USING btree ("parent_id");
  CREATE INDEX "_sample_images_v_version_version_updated_at_idx" ON "_sample_images_v" USING btree ("version_updated_at");
  CREATE INDEX "_sample_images_v_version_version_created_at_idx" ON "_sample_images_v" USING btree ("version_created_at");
  CREATE INDEX "_sample_images_v_version_version__status_idx" ON "_sample_images_v" USING btree ("version__status");
  CREATE INDEX "_sample_images_v_version_version_filename_idx" ON "_sample_images_v" USING btree ("version_filename");
  CREATE INDEX "_sample_images_v_version_sizes_thumbnail_version_sizes_t_idx" ON "_sample_images_v" USING btree ("version_sizes_thumbnail_filename");
  CREATE INDEX "_sample_images_v_created_at_idx" ON "_sample_images_v" USING btree ("created_at");
  CREATE INDEX "_sample_images_v_updated_at_idx" ON "_sample_images_v" USING btree ("updated_at");
  CREATE INDEX "_sample_images_v_snapshot_idx" ON "_sample_images_v" USING btree ("snapshot");
  CREATE INDEX "_sample_images_v_published_locale_idx" ON "_sample_images_v" USING btree ("published_locale");
  CREATE INDEX "_sample_images_v_latest_idx" ON "_sample_images_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_sample_images_v_locales_locale_parent_id_unique" ON "_sample_images_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sample_images_fk" FOREIGN KEY ("sample_images_id") REFERENCES "public"."sample_images"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_sample_images_id_idx" ON "payload_locked_documents_rels" USING btree ("sample_images_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sample_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sample_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sample_images_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sample_images_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sample_images" CASCADE;
  DROP TABLE "sample_images_locales" CASCADE;
  DROP TABLE "_sample_images_v" CASCADE;
  DROP TABLE "_sample_images_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sample_images_fk";
  
  DROP INDEX "payload_locked_documents_rels_sample_images_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sample_images_id";
  DROP TYPE "public"."enum_sample_images_status";
  DROP TYPE "public"."enum__sample_images_v_version_status";
  DROP TYPE "public"."enum__sample_images_v_published_locale";`)
}
