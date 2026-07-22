import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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

  ALTER TABLE "guideline_sections_rules" ADD CONSTRAINT "guideline_sections_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_sections_rules" ADD CONSTRAINT "guideline_sections_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_version_rules" ADD CONSTRAINT "_guideline_sections_v_version_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_sections_v_version_rules" ADD CONSTRAINT "_guideline_sections_v_version_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_sections_rules_order_idx" ON "guideline_sections_rules" USING btree ("_order");
  CREATE INDEX "guideline_sections_rules_parent_id_idx" ON "guideline_sections_rules" USING btree ("_parent_id");
  CREATE INDEX "guideline_sections_rules_rule_idx" ON "guideline_sections_rules" USING btree ("rule_id");
  CREATE INDEX "_guideline_sections_v_version_rules_order_idx" ON "_guideline_sections_v_version_rules" USING btree ("_order");
  CREATE INDEX "_guideline_sections_v_version_rules_parent_id_idx" ON "_guideline_sections_v_version_rules" USING btree ("_parent_id");
  CREATE INDEX "_guideline_sections_v_version_rules_rule_idx" ON "_guideline_sections_v_version_rules" USING btree ("rule_id");

  WITH "page_block_rules" AS (
    SELECT "_parent_id", "rule_id" FROM "guideline_pages_blocks_column_unit" WHERE "rule_id" IS NOT NULL
    UNION
    SELECT "_parent_id", "rule_id" FROM "guideline_pages_blocks_media_showcase" WHERE "rule_id" IS NOT NULL
    UNION
    SELECT "_parent_id", "rule_id" FROM "guideline_pages_blocks_color_palette" WHERE "rule_id" IS NOT NULL
    UNION
    SELECT "block"."_parent_id", "group"."rule_id"
    FROM "guideline_pages_blocks_do_dont_groups" "group"
    JOIN "guideline_pages_blocks_do_dont" "block" ON "block"."id" = "group"."_parent_id"
    WHERE "group"."rule_id" IS NOT NULL
  )
  INSERT INTO "guideline_pages_rules" ("_order", "_parent_id", "id", "rule_id")
  SELECT "rule_id", "_parent_id", concat('block-rule-page-', "_parent_id", '-', "rule_id"), "rule_id"
  FROM "page_block_rules" "ref"
  WHERE NOT EXISTS (
    SELECT 1 FROM "guideline_pages_rules" "existing"
    WHERE "existing"."_parent_id" = "ref"."_parent_id"
      AND "existing"."rule_id" = "ref"."rule_id"
  );

  WITH "section_block_rules" AS (
    SELECT "_parent_id", "rule_id" FROM "section_cu" WHERE "rule_id" IS NOT NULL
    UNION
    SELECT "_parent_id", "rule_id" FROM "section_ms" WHERE "rule_id" IS NOT NULL
    UNION
    SELECT "_parent_id", "rule_id" FROM "section_cp" WHERE "rule_id" IS NOT NULL
    UNION
    SELECT "block"."_parent_id", "group"."rule_id"
    FROM "section_dd_groups" "group"
    JOIN "section_dd" "block" ON "block"."id" = "group"."_parent_id"
    WHERE "group"."rule_id" IS NOT NULL
  )
  INSERT INTO "guideline_sections_rules" ("_order", "_parent_id", "id", "rule_id")
  SELECT "rule_id", "_parent_id", concat('block-rule-section-', "_parent_id", '-', "rule_id"), "rule_id"
  FROM "section_block_rules";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
	  DELETE FROM "guideline_pages_rules" WHERE "id" LIKE 'block-rule-page-%';
  DROP TABLE "guideline_sections_rules" CASCADE;
  DROP TABLE "_guideline_sections_v_version_rules" CASCADE;`)
}
