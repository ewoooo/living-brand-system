import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		CREATE TEMP TABLE "_rule_document_blocks" (
			"parent_collection" varchar NOT NULL,
			"parent_id" integer NOT NULL,
			"source_block_id" varchar NOT NULL,
			"block_type" varchar NOT NULL,
			"display_order" integer NOT NULL,
			"rule_id" integer
		) ON COMMIT DROP;

		INSERT INTO "_rule_document_blocks"
		SELECT 'guideline-pages', "_parent_id", "id", 'columnUnit', "_order", "rule_id" FROM "guideline_pages_blocks_column_unit"
		UNION ALL
		SELECT 'guideline-pages', "_parent_id", "id", 'mediaShowcase', "_order", "rule_id" FROM "guideline_pages_blocks_media_showcase"
		UNION ALL
		SELECT 'guideline-pages', "_parent_id", "id", 'colorPalette', "_order", "rule_id" FROM "guideline_pages_blocks_color_palette"
		UNION ALL
		SELECT 'guideline-pages', "_parent_id", "id", 'doDont', "_order", NULL FROM "guideline_pages_blocks_do_dont"
		UNION ALL
		SELECT 'guideline-sections', "_parent_id", "id", 'columnUnit', "_order", "rule_id" FROM "section_cu"
		UNION ALL
		SELECT 'guideline-sections', "_parent_id", "id", 'mediaShowcase', "_order", "rule_id" FROM "section_ms"
		UNION ALL
		SELECT 'guideline-sections', "_parent_id", "id", 'colorPalette', "_order", "rule_id" FROM "section_cp"
		UNION ALL
		SELECT 'guideline-sections', "_parent_id", "id", 'doDont', "_order", NULL FROM "section_dd";

		INSERT INTO "guideline_blocks" (
			"key",
			"source_block_id",
			"block_type",
			"display_order"
		)
		SELECT
			"parent_collection" || ':' || "parent_id" || ':' || "source_block_id",
			"source_block_id",
			"block_type"::"enum_guideline_blocks_block_type",
			"display_order"
		FROM "_rule_document_blocks"
		ON CONFLICT ("key") DO UPDATE SET
			"source_block_id" = EXCLUDED."source_block_id",
			"block_type" = EXCLUDED."block_type",
			"display_order" = EXCLUDED."display_order",
			"updated_at" = now();

		DELETE FROM "guideline_blocks_rels"
		WHERE "path" = 'parent'
			AND "parent_id" IN (
				SELECT "guideline_blocks"."id"
				FROM "_rule_document_blocks" "blocks"
				JOIN "guideline_blocks"
					ON "guideline_blocks"."key" = "blocks"."parent_collection" || ':' || "blocks"."parent_id" || ':' || "blocks"."source_block_id"
			);

		INSERT INTO "guideline_blocks_rels" (
			"order",
			"parent_id",
			"path",
			"guideline_sections_id",
			"guideline_pages_id"
		)
		SELECT
			1,
			"guideline_blocks"."id",
			'parent',
			CASE WHEN "blocks"."parent_collection" = 'guideline-sections' THEN "blocks"."parent_id" END,
			CASE WHEN "blocks"."parent_collection" = 'guideline-pages' THEN "blocks"."parent_id" END
		FROM "_rule_document_blocks" "blocks"
		JOIN "guideline_blocks"
			ON "guideline_blocks"."key" = "blocks"."parent_collection" || ':' || "blocks"."parent_id" || ':' || "blocks"."source_block_id";

		DELETE FROM "rules_rels" WHERE "path" = 'documents';

		WITH "block_rule_links" AS (
			SELECT
				"blocks"."rule_id",
				"blocks"."parent_collection",
				"blocks"."parent_id",
				"guideline_blocks"."id" AS "block_id"
			FROM "_rule_document_blocks" "blocks"
			JOIN "guideline_blocks"
				ON "guideline_blocks"."key" = "blocks"."parent_collection" || ':' || "blocks"."parent_id" || ':' || "blocks"."source_block_id"
			WHERE "blocks"."rule_id" IS NOT NULL
			UNION ALL
			SELECT "groups"."rule_id", 'guideline-pages', "blocks"."_parent_id", "guideline_blocks"."id"
			FROM "guideline_pages_blocks_do_dont_groups" "groups"
			JOIN "guideline_pages_blocks_do_dont" "blocks" ON "blocks"."id" = "groups"."_parent_id"
			JOIN "guideline_blocks" ON "guideline_blocks"."key" = 'guideline-pages:' || "blocks"."_parent_id" || ':' || "blocks"."id"
			WHERE "groups"."rule_id" IS NOT NULL
			UNION ALL
			SELECT "groups"."rule_id", 'guideline-sections', "blocks"."_parent_id", "guideline_blocks"."id"
			FROM "section_dd_groups" "groups"
			JOIN "section_dd" "blocks" ON "blocks"."id" = "groups"."_parent_id"
			JOIN "guideline_blocks" ON "guideline_blocks"."key" = 'guideline-sections:' || "blocks"."_parent_id" || ':' || "blocks"."id"
			WHERE "groups"."rule_id" IS NOT NULL
		),
		"document_links" AS (
			SELECT DISTINCT
				"rule_id",
				CASE WHEN "parent_collection" = 'guideline-pages' THEN "parent_id" END AS "page_id",
				CASE WHEN "parent_collection" = 'guideline-sections' THEN "parent_id" END AS "section_id",
				NULL::integer AS "block_id"
			FROM "block_rule_links"
			UNION ALL
			SELECT "rule_id", NULL, NULL, "block_id" FROM "block_rule_links"
		)
		INSERT INTO "rules_rels" (
			"order",
			"parent_id",
			"path",
			"guideline_sections_id",
			"guideline_pages_id",
			"guideline_blocks_id"
		)
		SELECT
			row_number() OVER (PARTITION BY "rule_id" ORDER BY "section_id", "page_id", "block_id"),
			"rule_id",
			'documents',
			"section_id",
			"page_id",
			"block_id"
		FROM "document_links";
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DELETE FROM "rules_rels" WHERE "path" = 'documents';
		DELETE FROM "guideline_blocks_rels" WHERE "path" = 'parent';
		DELETE FROM "guideline_blocks";
	`)
}
