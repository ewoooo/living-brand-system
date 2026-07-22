import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_sections_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_sections_v_version_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_pages_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_version_rules" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_sections_rules" CASCADE;
  DROP TABLE "_guideline_sections_v_version_rules" CASCADE;
  DROP TABLE "guideline_pages_rules" CASCADE;
  DROP TABLE "_guideline_pages_v_version_rules" CASCADE;
  ALTER TABLE "rules" ALTER COLUMN "spec_id" SET NOT NULL;
  ALTER TABLE "rules" DROP COLUMN "category";
  ALTER TABLE "rules" DROP COLUMN "executor";
  DROP TYPE "public"."enum_rules_category";
  DROP TYPE "public"."enum_rules_executor";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rules_category" AS ENUM('logo', 'color', 'typography', 'grid', 'spacing', 'layout', 'imagery', 'illustration', 'iconography', 'motion', 'voice', 'messaging', 'accessibility', 'application', 'misc');
  CREATE TYPE "public"."enum_rules_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TABLE "guideline_sections_rules" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "rule_id" integer
  );

  CREATE TABLE "_guideline_sections_v_version_rules" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "rule_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "guideline_pages_rules" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "rule_id" integer
  );

  CREATE TABLE "_guideline_pages_v_version_rules" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "rule_id" integer,
    "_uuid" varchar
  );

  ALTER TABLE "rules" ALTER COLUMN "spec_id" DROP NOT NULL;
  ALTER TABLE "rules" ADD COLUMN "category" "enum_rules_category";
  ALTER TABLE "rules" ADD COLUMN "executor" "enum_rules_executor";

  UPDATE "rules"
  SET "category" = CASE
    WHEN split_part("key", '.', 1) IN (
      'logo', 'color', 'typography', 'grid', 'spacing', 'layout', 'imagery',
      'illustration', 'iconography', 'motion', 'voice', 'messaging',
      'accessibility', 'application', 'misc'
    ) THEN split_part("key", '.', 1)::"enum_rules_category"
    ELSE 'misc'::"enum_rules_category"
  END;

  UPDATE "rules"
  SET "executor" = "rule_specs"."executor"::text::"enum_rules_executor"
  FROM "rule_specs"
  WHERE "rules"."spec_id" = "rule_specs"."id";

  ALTER TABLE "rules" ALTER COLUMN "category" SET NOT NULL;
  ALTER TABLE "guideline_sections_rules" ADD CONSTRAINT "guideline_sections_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_sections_rules" ADD CONSTRAINT "guideline_sections_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_version_rules" ADD CONSTRAINT "_guideline_sections_v_version_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_version_rules" ADD CONSTRAINT "_guideline_sections_v_version_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_rules" ADD CONSTRAINT "guideline_pages_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_rules" ADD CONSTRAINT "guideline_pages_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_version_rules" ADD CONSTRAINT "_guideline_pages_v_version_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_version_rules" ADD CONSTRAINT "_guideline_pages_v_version_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_sections_rules_order_idx" ON "guideline_sections_rules" USING btree ("_order");
  CREATE INDEX "guideline_sections_rules_parent_id_idx" ON "guideline_sections_rules" USING btree ("_parent_id");
  CREATE INDEX "guideline_sections_rules_rule_idx" ON "guideline_sections_rules" USING btree ("rule_id");
  CREATE INDEX "_guideline_sections_v_version_rules_order_idx" ON "_guideline_sections_v_version_rules" USING btree ("_order");
  CREATE INDEX "_guideline_sections_v_version_rules_parent_id_idx" ON "_guideline_sections_v_version_rules" USING btree ("_parent_id");
  CREATE INDEX "_guideline_sections_v_version_rules_rule_idx" ON "_guideline_sections_v_version_rules" USING btree ("rule_id");
  CREATE INDEX "guideline_pages_rules_order_idx" ON "guideline_pages_rules" USING btree ("_order");
  CREATE INDEX "guideline_pages_rules_parent_id_idx" ON "guideline_pages_rules" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_rules_rule_idx" ON "guideline_pages_rules" USING btree ("rule_id");
  CREATE INDEX "_guideline_pages_v_version_rules_order_idx" ON "_guideline_pages_v_version_rules" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_version_rules_parent_id_idx" ON "_guideline_pages_v_version_rules" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_version_rules_rule_idx" ON "_guideline_pages_v_version_rules" USING btree ("rule_id");

  INSERT INTO "guideline_pages_rules" ("_order", "_parent_id", "id", "rule_id")
  SELECT
    row_number() OVER (PARTITION BY "guideline_pages_id" ORDER BY "parent_id"),
    "guideline_pages_id",
    md5('page:' || "guideline_pages_id" || ':rule:' || "parent_id"),
    "parent_id"
  FROM "rules_rels"
  WHERE "path" = 'documents' AND "guideline_pages_id" IS NOT NULL;

  INSERT INTO "guideline_sections_rules" ("_order", "_parent_id", "id", "rule_id")
  SELECT
    row_number() OVER (PARTITION BY "guideline_sections_id" ORDER BY "parent_id"),
    "guideline_sections_id",
    md5('section:' || "guideline_sections_id" || ':rule:' || "parent_id"),
    "parent_id"
  FROM "rules_rels"
  WHERE "path" = 'documents' AND "guideline_sections_id" IS NOT NULL;`)
}
