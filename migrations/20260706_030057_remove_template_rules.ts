import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "templates_template_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rule_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "templates_template_rules_locales" (
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_templates_v_version_template_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rule_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_templates_v_version_template_rules_locales" (
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE IF EXISTS "template_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "template_rules_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "templates_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_templates_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "template_rules" CASCADE;
  DROP TABLE IF EXISTS "template_rules_locales" CASCADE;
  DROP TABLE IF EXISTS "templates_rels" CASCADE;
  DROP TABLE IF EXISTS "_templates_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_template_rules_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_template_rules_id_idx";
  ALTER TABLE "templates_template_rules" ADD CONSTRAINT "templates_template_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "templates_template_rules" ADD CONSTRAINT "templates_template_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_template_rules_locales" ADD CONSTRAINT "templates_template_rules_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates_template_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_rules" ADD CONSTRAINT "_templates_v_version_template_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_rules" ADD CONSTRAINT "_templates_v_version_template_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_rules_locales" ADD CONSTRAINT "_templates_v_version_template_rules_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v_version_template_rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "templates_template_rules_order_idx" ON "templates_template_rules" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "templates_template_rules_parent_id_idx" ON "templates_template_rules" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "templates_template_rules_rule_idx" ON "templates_template_rules" USING btree ("rule_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "templates_template_rules_locales_locale_parent_id_unique" ON "templates_template_rules_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_templates_v_version_template_rules_order_idx" ON "_templates_v_version_template_rules" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_templates_v_version_template_rules_parent_id_idx" ON "_templates_v_version_template_rules" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_templates_v_version_template_rules_rule_idx" ON "_templates_v_version_template_rules" USING btree ("rule_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_templates_v_version_template_rules_locales_locale_parent_id" ON "_templates_v_version_template_rules_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "template_rules_id";
  DROP TYPE IF EXISTS "public"."enum_template_rules_status";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_template_rules_status" AS ENUM('draft', 'live', 'archived');
  CREATE TABLE "template_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_template_rules_status" DEFAULT 'live',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "template_rules_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"body" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "templates_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"template_rules_id" integer
  );
  
  CREATE TABLE "_templates_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"template_rules_id" integer
  );
  
  ALTER TABLE "templates_template_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_template_rules_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_version_template_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_version_template_rules_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "templates_template_rules" CASCADE;
  DROP TABLE "templates_template_rules_locales" CASCADE;
  DROP TABLE "_templates_v_version_template_rules" CASCADE;
  DROP TABLE "_templates_v_version_template_rules_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "template_rules_id" integer;
  ALTER TABLE "template_rules_locales" ADD CONSTRAINT "template_rules_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."template_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_rels" ADD CONSTRAINT "templates_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_rels" ADD CONSTRAINT "templates_rels_template_rules_fk" FOREIGN KEY ("template_rules_id") REFERENCES "public"."template_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_rels" ADD CONSTRAINT "_templates_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_rels" ADD CONSTRAINT "_templates_v_rels_template_rules_fk" FOREIGN KEY ("template_rules_id") REFERENCES "public"."template_rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "template_rules_updated_at_idx" ON "template_rules" USING btree ("updated_at");
  CREATE INDEX "template_rules_created_at_idx" ON "template_rules" USING btree ("created_at");
  CREATE UNIQUE INDEX "template_rules_locales_locale_parent_id_unique" ON "template_rules_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "templates_rels_order_idx" ON "templates_rels" USING btree ("order");
  CREATE INDEX "templates_rels_parent_idx" ON "templates_rels" USING btree ("parent_id");
  CREATE INDEX "templates_rels_path_idx" ON "templates_rels" USING btree ("path");
  CREATE INDEX "templates_rels_template_rules_id_idx" ON "templates_rels" USING btree ("template_rules_id");
  CREATE INDEX "_templates_v_rels_order_idx" ON "_templates_v_rels" USING btree ("order");
  CREATE INDEX "_templates_v_rels_parent_idx" ON "_templates_v_rels" USING btree ("parent_id");
  CREATE INDEX "_templates_v_rels_path_idx" ON "_templates_v_rels" USING btree ("path");
  CREATE INDEX "_templates_v_rels_template_rules_id_idx" ON "_templates_v_rels" USING btree ("template_rules_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_template_rules_fk" FOREIGN KEY ("template_rules_id") REFERENCES "public"."template_rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_template_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("template_rules_id");`)
}
