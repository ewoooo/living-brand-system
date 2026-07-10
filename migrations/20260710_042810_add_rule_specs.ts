import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rule_specs_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_rule_specs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__rule_specs_v_version_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__rule_specs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__rule_specs_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "rule_specs" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "executor" "enum_rule_specs_executor",
    "checker_key" varchar,
    "model" varchar,
    "prompt_key" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_rule_specs_status" DEFAULT 'draft'
  );

  CREATE TABLE "_rule_specs_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_executor" "enum__rule_specs_v_version_executor",
    "version_checker_key" varchar,
    "version_model" varchar,
    "version_prompt_key" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__rule_specs_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__rule_specs_v_published_locale",
    "latest" boolean
  );

  ALTER TABLE "rules" ADD COLUMN "spec_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rule_specs_id" integer;
  ALTER TABLE "_rule_specs_v" ADD CONSTRAINT "_rule_specs_v_parent_id_rule_specs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rule_specs"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "rule_specs_key_idx" ON "rule_specs" USING btree ("key");
  CREATE INDEX "rule_specs_updated_at_idx" ON "rule_specs" USING btree ("updated_at");
  CREATE INDEX "rule_specs_created_at_idx" ON "rule_specs" USING btree ("created_at");
  CREATE INDEX "rule_specs__status_idx" ON "rule_specs" USING btree ("_status");
  CREATE INDEX "_rule_specs_v_parent_idx" ON "_rule_specs_v" USING btree ("parent_id");
  CREATE INDEX "_rule_specs_v_version_version_key_idx" ON "_rule_specs_v" USING btree ("version_key");
  CREATE INDEX "_rule_specs_v_version_version_updated_at_idx" ON "_rule_specs_v" USING btree ("version_updated_at");
  CREATE INDEX "_rule_specs_v_version_version_created_at_idx" ON "_rule_specs_v" USING btree ("version_created_at");
  CREATE INDEX "_rule_specs_v_version_version__status_idx" ON "_rule_specs_v" USING btree ("version__status");
  CREATE INDEX "_rule_specs_v_created_at_idx" ON "_rule_specs_v" USING btree ("created_at");
  CREATE INDEX "_rule_specs_v_updated_at_idx" ON "_rule_specs_v" USING btree ("updated_at");
  CREATE INDEX "_rule_specs_v_snapshot_idx" ON "_rule_specs_v" USING btree ("snapshot");
  CREATE INDEX "_rule_specs_v_published_locale_idx" ON "_rule_specs_v" USING btree ("published_locale");
  CREATE INDEX "_rule_specs_v_latest_idx" ON "_rule_specs_v" USING btree ("latest");
  ALTER TABLE "rules" ADD CONSTRAINT "rules_spec_id_rule_specs_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."rule_specs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rule_specs_fk" FOREIGN KEY ("rule_specs_id") REFERENCES "public"."rule_specs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "rules_spec_idx" ON "rules" USING btree ("spec_id");
  CREATE INDEX "payload_locked_documents_rels_rule_specs_id_idx" ON "payload_locked_documents_rels" USING btree ("rule_specs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rules" DROP CONSTRAINT "rules_spec_id_rule_specs_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rule_specs_fk";

  DROP INDEX "rules_spec_idx";
  DROP INDEX "payload_locked_documents_rels_rule_specs_id_idx";
  ALTER TABLE "rules" DROP COLUMN "spec_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rule_specs_id";
  ALTER TABLE "rule_specs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rule_specs_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_rule_specs_v" CASCADE;
  DROP TABLE "rule_specs" CASCADE;
  DROP TYPE "public"."enum_rule_specs_executor";
  DROP TYPE "public"."enum_rule_specs_status";
  DROP TYPE "public"."enum__rule_specs_v_version_executor";
  DROP TYPE "public"."enum__rule_specs_v_version_status";
  DROP TYPE "public"."enum__rule_specs_v_published_locale";`)
}
