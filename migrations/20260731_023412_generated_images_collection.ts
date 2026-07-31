import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_generated_images_aspect_ratio" AS ENUM('1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9');
  CREATE TYPE "public"."enum_generated_images_image_size" AS ENUM('1K', '2K', '4K');
  CREATE TYPE "public"."enum_generated_images_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__generated_images_v_version_aspect_ratio" AS ENUM('1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9');
  CREATE TYPE "public"."enum__generated_images_v_version_image_size" AS ENUM('1K', '2K', '4K');
  CREATE TYPE "public"."enum__generated_images_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__generated_images_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "generated_images" (
    "id" serial PRIMARY KEY NOT NULL,
    "scenario_id" integer,
    "scenario_name" varchar,
    "input_prompt" varchar,
    "effective_prompt" varchar,
    "model" varchar,
    "aspect_ratio" "enum_generated_images_aspect_ratio",
    "image_size" "enum_generated_images_image_size",
    "created_by_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_generated_images_status" DEFAULT 'draft',
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

  CREATE TABLE "_generated_images_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_scenario_id" integer,
    "version_scenario_name" varchar,
    "version_input_prompt" varchar,
    "version_effective_prompt" varchar,
    "version_model" varchar,
    "version_aspect_ratio" "enum__generated_images_v_version_aspect_ratio",
    "version_image_size" "enum__generated_images_v_version_image_size",
    "version_created_by_id" integer,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__generated_images_v_version_status" DEFAULT 'draft',
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
    "published_locale" "enum__generated_images_v_published_locale",
    "latest" boolean
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "generated_images_id" integer;
  ALTER TABLE "generated_images" ADD CONSTRAINT "generated_images_scenario_id_image_profiles_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."image_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "generated_images" ADD CONSTRAINT "generated_images_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_generated_images_v" ADD CONSTRAINT "_generated_images_v_parent_id_generated_images_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."generated_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_generated_images_v" ADD CONSTRAINT "_generated_images_v_version_scenario_id_image_profiles_id_fk" FOREIGN KEY ("version_scenario_id") REFERENCES "public"."image_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_generated_images_v" ADD CONSTRAINT "_generated_images_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "generated_images_scenario_idx" ON "generated_images" USING btree ("scenario_id");
  CREATE INDEX "generated_images_created_by_idx" ON "generated_images" USING btree ("created_by_id");
  CREATE INDEX "generated_images_updated_at_idx" ON "generated_images" USING btree ("updated_at");
  CREATE INDEX "generated_images_created_at_idx" ON "generated_images" USING btree ("created_at");
  CREATE INDEX "generated_images__status_idx" ON "generated_images" USING btree ("_status");
  CREATE UNIQUE INDEX "generated_images_filename_idx" ON "generated_images" USING btree ("filename");
  CREATE INDEX "_generated_images_v_parent_idx" ON "_generated_images_v" USING btree ("parent_id");
  CREATE INDEX "_generated_images_v_version_version_scenario_idx" ON "_generated_images_v" USING btree ("version_scenario_id");
  CREATE INDEX "_generated_images_v_version_version_created_by_idx" ON "_generated_images_v" USING btree ("version_created_by_id");
  CREATE INDEX "_generated_images_v_version_version_updated_at_idx" ON "_generated_images_v" USING btree ("version_updated_at");
  CREATE INDEX "_generated_images_v_version_version_created_at_idx" ON "_generated_images_v" USING btree ("version_created_at");
  CREATE INDEX "_generated_images_v_version_version__status_idx" ON "_generated_images_v" USING btree ("version__status");
  CREATE INDEX "_generated_images_v_version_version_filename_idx" ON "_generated_images_v" USING btree ("version_filename");
  CREATE INDEX "_generated_images_v_created_at_idx" ON "_generated_images_v" USING btree ("created_at");
  CREATE INDEX "_generated_images_v_updated_at_idx" ON "_generated_images_v" USING btree ("updated_at");
  CREATE INDEX "_generated_images_v_snapshot_idx" ON "_generated_images_v" USING btree ("snapshot");
  CREATE INDEX "_generated_images_v_published_locale_idx" ON "_generated_images_v" USING btree ("published_locale");
  CREATE INDEX "_generated_images_v_latest_idx" ON "_generated_images_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_generated_images_fk" FOREIGN KEY ("generated_images_id") REFERENCES "public"."generated_images"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_generated_images_id_idx" ON "payload_locked_documents_rels" USING btree ("generated_images_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_generated_images_fk";
  DROP INDEX "payload_locked_documents_rels_generated_images_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "generated_images_id";
  DROP TABLE "_generated_images_v";
  DROP TABLE "generated_images";
  DROP TYPE "public"."enum_generated_images_aspect_ratio";
  DROP TYPE "public"."enum_generated_images_image_size";
  DROP TYPE "public"."enum_generated_images_status";
  DROP TYPE "public"."enum__generated_images_v_version_aspect_ratio";
  DROP TYPE "public"."enum__generated_images_v_version_image_size";
  DROP TYPE "public"."enum__generated_images_v_version_status";
  DROP TYPE "public"."enum__generated_images_v_published_locale";`)
}
