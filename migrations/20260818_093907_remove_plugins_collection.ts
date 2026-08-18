import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "plugins" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "plugins_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_plugins_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_plugins_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "plugins" CASCADE;
  DROP TABLE "plugins_locales" CASCADE;
  DROP TABLE "_plugins_v" CASCADE;
  DROP TABLE "_plugins_v_locales" CASCADE;
  ALTER TABLE "agent_skills_rels" DROP CONSTRAINT IF EXISTS "agent_skills_rels_plugins_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_plugins_fk";
  
  DROP INDEX IF EXISTS "agent_skills_rels_plugins_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_plugins_id_idx";
  ALTER TABLE "agent_skills_rels" DROP COLUMN "plugins_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "plugins_id";
  DROP TYPE "public"."enum_plugins_plugin_type";
  DROP TYPE "public"."enum_plugins_status";
  DROP TYPE "public"."enum__plugins_v_version_plugin_type";
  DROP TYPE "public"."enum__plugins_v_version_status";
  DROP TYPE "public"."enum__plugins_v_published_locale";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_plugins_plugin_type" AS ENUM('generator', 'checker');
  CREATE TYPE "public"."enum_plugins_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__plugins_v_version_plugin_type" AS ENUM('generator', 'checker');
  CREATE TYPE "public"."enum__plugins_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__plugins_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "plugins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"plugin_type" "enum_plugins_plugin_type",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_plugins_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "plugins_locales" (
  	"name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_plugins_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_plugin_type" "enum__plugins_v_version_plugin_type",
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__plugins_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__plugins_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_plugins_v_locales" (
  	"version_name" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "agent_skills_rels" ADD COLUMN "plugins_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "plugins_id" integer;
  ALTER TABLE "plugins_locales" ADD CONSTRAINT "plugins_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_plugins_v" ADD CONSTRAINT "_plugins_v_parent_id_plugins_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."plugins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_plugins_v_locales" ADD CONSTRAINT "_plugins_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_plugins_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "plugins_updated_at_idx" ON "plugins" USING btree ("updated_at");
  CREATE INDEX "plugins_created_at_idx" ON "plugins" USING btree ("created_at");
  CREATE INDEX "plugins__status_idx" ON "plugins" USING btree ("_status");
  CREATE UNIQUE INDEX "plugins_locales_locale_parent_id_unique" ON "plugins_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_plugins_v_parent_idx" ON "_plugins_v" USING btree ("parent_id");
  CREATE INDEX "_plugins_v_version_version_updated_at_idx" ON "_plugins_v" USING btree ("version_updated_at");
  CREATE INDEX "_plugins_v_version_version_created_at_idx" ON "_plugins_v" USING btree ("version_created_at");
  CREATE INDEX "_plugins_v_version_version__status_idx" ON "_plugins_v" USING btree ("version__status");
  CREATE INDEX "_plugins_v_created_at_idx" ON "_plugins_v" USING btree ("created_at");
  CREATE INDEX "_plugins_v_updated_at_idx" ON "_plugins_v" USING btree ("updated_at");
  CREATE INDEX "_plugins_v_snapshot_idx" ON "_plugins_v" USING btree ("snapshot");
  CREATE INDEX "_plugins_v_published_locale_idx" ON "_plugins_v" USING btree ("published_locale");
  CREATE INDEX "_plugins_v_latest_idx" ON "_plugins_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_plugins_v_locales_locale_parent_id_unique" ON "_plugins_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "agent_skills_rels" ADD CONSTRAINT "agent_skills_rels_plugins_fk" FOREIGN KEY ("plugins_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_plugins_fk" FOREIGN KEY ("plugins_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "agent_skills_rels_plugins_id_idx" ON "agent_skills_rels" USING btree ("plugins_id");
  CREATE INDEX "payload_locked_documents_rels_plugins_id_idx" ON "payload_locked_documents_rels" USING btree ("plugins_id");`)
}
