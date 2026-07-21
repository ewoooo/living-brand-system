import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_image_profiles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__image_profiles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__image_profiles_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "img_profile_prompt" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" varchar
  );

  CREATE TABLE "img_prompt_choices" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"value" varchar
  );

  CREATE TABLE "img_prompt_norm" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"key" varchar
  );

  CREATE TABLE "image_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_image_profiles_status" DEFAULT 'draft'
  );

  CREATE TABLE "_img_profile_prompt_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_img_prompt_choices_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_img_prompt_norm_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_image_profiles_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_name" varchar,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__image_profiles_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__image_profiles_v_published_locale",
	"latest" boolean
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "image_profiles_id" integer;
  ALTER TABLE "img_profile_prompt" ADD CONSTRAINT "img_profile_prompt_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "img_prompt_choices" ADD CONSTRAINT "img_prompt_choices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."img_prompt_norm"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "img_prompt_norm" ADD CONSTRAINT "img_prompt_norm_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_img_profile_prompt_v" ADD CONSTRAINT "_img_profile_prompt_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_img_prompt_choices_v" ADD CONSTRAINT "_img_prompt_choices_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_img_prompt_norm_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_img_prompt_norm_v" ADD CONSTRAINT "_img_prompt_norm_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v" ADD CONSTRAINT "_image_profiles_v_parent_id_image_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "img_profile_prompt_order_idx" ON "img_profile_prompt" USING btree ("_order");
  CREATE INDEX "img_profile_prompt_parent_id_idx" ON "img_profile_prompt" USING btree ("_parent_id");
  CREATE INDEX "img_prompt_choices_order_idx" ON "img_prompt_choices" USING btree ("_order");
  CREATE INDEX "img_prompt_choices_parent_id_idx" ON "img_prompt_choices" USING btree ("_parent_id");
  CREATE INDEX "img_prompt_norm_order_idx" ON "img_prompt_norm" USING btree ("_order");
  CREATE INDEX "img_prompt_norm_parent_id_idx" ON "img_prompt_norm" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_updated_at_idx" ON "image_profiles" USING btree ("updated_at");
  CREATE INDEX "image_profiles_created_at_idx" ON "image_profiles" USING btree ("created_at");
  CREATE INDEX "image_profiles__status_idx" ON "image_profiles" USING btree ("_status");
  CREATE INDEX "_img_profile_prompt_v_order_idx" ON "_img_profile_prompt_v" USING btree ("_order");
  CREATE INDEX "_img_profile_prompt_v_parent_id_idx" ON "_img_profile_prompt_v" USING btree ("_parent_id");
  CREATE INDEX "_img_prompt_choices_v_order_idx" ON "_img_prompt_choices_v" USING btree ("_order");
  CREATE INDEX "_img_prompt_choices_v_parent_id_idx" ON "_img_prompt_choices_v" USING btree ("_parent_id");
  CREATE INDEX "_img_prompt_norm_v_order_idx" ON "_img_prompt_norm_v" USING btree ("_order");
  CREATE INDEX "_img_prompt_norm_v_parent_id_idx" ON "_img_prompt_norm_v" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_parent_idx" ON "_image_profiles_v" USING btree ("parent_id");
  CREATE INDEX "_image_profiles_v_version_version_updated_at_idx" ON "_image_profiles_v" USING btree ("version_updated_at");
  CREATE INDEX "_image_profiles_v_version_version_created_at_idx" ON "_image_profiles_v" USING btree ("version_created_at");
  CREATE INDEX "_image_profiles_v_version_version__status_idx" ON "_image_profiles_v" USING btree ("version__status");
  CREATE INDEX "_image_profiles_v_created_at_idx" ON "_image_profiles_v" USING btree ("created_at");
  CREATE INDEX "_image_profiles_v_updated_at_idx" ON "_image_profiles_v" USING btree ("updated_at");
  CREATE INDEX "_image_profiles_v_snapshot_idx" ON "_image_profiles_v" USING btree ("snapshot");
  CREATE INDEX "_image_profiles_v_published_locale_idx" ON "_image_profiles_v" USING btree ("published_locale");
  CREATE INDEX "_image_profiles_v_latest_idx" ON "_image_profiles_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_image_profiles_fk" FOREIGN KEY ("image_profiles_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_image_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("image_profiles_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "img_profile_prompt" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "img_prompt_choices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "img_prompt_norm" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "image_profiles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_img_profile_prompt_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_img_prompt_choices_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_img_prompt_norm_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_image_profiles_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "img_profile_prompt" CASCADE;
  DROP TABLE "img_prompt_choices" CASCADE;
  DROP TABLE "img_prompt_norm" CASCADE;
  DROP TABLE "image_profiles" CASCADE;
  DROP TABLE "_img_profile_prompt_v" CASCADE;
  DROP TABLE "_img_prompt_choices_v" CASCADE;
  DROP TABLE "_img_prompt_norm_v" CASCADE;
  DROP TABLE "_image_profiles_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_image_profiles_fk";

  DROP INDEX "payload_locked_documents_rels_image_profiles_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "image_profiles_id";
  DROP TYPE "public"."enum_image_profiles_status";
  DROP TYPE "public"."enum__image_profiles_v_version_status";
  DROP TYPE "public"."enum__image_profiles_v_published_locale";`)
}
