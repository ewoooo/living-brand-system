import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		CREATE TEMP TABLE "_guideline_check_backfill" (
			"target" text,
			"parent_id" text,
			"row_order" integer,
			"check_id" varchar,
			"key" varchar,
			"title" varchar,
			"tier" text,
			"checker_id" integer,
			"options" jsonb,
			"messages_pass" varchar,
			"messages_ok" varchar,
			"messages_needs_review" varchar,
			"messages_fail" varchar
		) ON COMMIT DROP;

		INSERT INTO "_guideline_check_backfill" (
			"target", "parent_id", "row_order", "check_id", "key", "title", "tier",
			"checker_id", "options", "messages_pass", "messages_ok",
			"messages_needs_review", "messages_fail"
		)
		WITH "source_rules" AS (
			SELECT
				"rule"."id" AS "rule_id",
				"rule"."key",
				"rule"."title",
				"rule"."tier"::text AS "tier",
				"rule"."checker_id",
				"rule"."source_block_id" AS "block_id",
				"rule"."messages_pass",
				"rule"."messages_ok",
				"rule"."messages_needs_review",
				"rule"."messages_fail",
				"source"."guideline_sections_id" AS "section_id",
				"source"."guideline_pages_id" AS "page_id",
				"checker"."checker_key"
			FROM "rules" "rule"
			JOIN "rules_rels" "source"
				ON "source"."parent_id" = "rule"."id" AND "source"."path" = 'source.document'
			LEFT JOIN "rule_checkers" "checker" ON "checker"."id" = "rule"."checker_id"
		),
		"classified" AS (
			SELECT
				"source".*,
				CASE
					WHEN "source"."block_id" IS NULL AND "source"."section_id" IS NOT NULL
						THEN 'guideline_sections_checks'
					WHEN "source"."block_id" IS NULL AND "source"."page_id" IS NOT NULL
						THEN 'guideline_pages_checks'
					WHEN "section_cu"."id" IS NOT NULL THEN 'section_cu_checks'
					WHEN "section_ms"."id" IS NOT NULL THEN 'section_ms_checks'
					WHEN "section_cp"."id" IS NOT NULL THEN 'section_cp_checks'
					WHEN "section_dd"."id" IS NOT NULL THEN 'section_dd_checks'
					WHEN "page_cu"."id" IS NOT NULL
						THEN 'guideline_pages_blocks_column_unit_checks'
					WHEN "page_ms"."id" IS NOT NULL
						THEN 'guideline_pages_blocks_media_showcase_checks'
					WHEN "page_cp"."id" IS NOT NULL
						THEN 'guideline_pages_blocks_color_palette_checks'
					WHEN "page_dd"."id" IS NOT NULL
						THEN 'guideline_pages_blocks_do_dont_checks'
				END AS "target",
				CASE
					WHEN "source"."block_id" IS NULL
						THEN COALESCE("source"."section_id"::text, "source"."page_id"::text)
					ELSE "source"."block_id"
				END AS "parent_id"
			FROM "source_rules" "source"
			LEFT JOIN "section_cu"
				ON "section_cu"."id" = "source"."block_id"
				AND "section_cu"."_parent_id" = "source"."section_id"
			LEFT JOIN "section_ms"
				ON "section_ms"."id" = "source"."block_id"
				AND "section_ms"."_parent_id" = "source"."section_id"
			LEFT JOIN "section_cp"
				ON "section_cp"."id" = "source"."block_id"
				AND "section_cp"."_parent_id" = "source"."section_id"
			LEFT JOIN "section_dd"
				ON "section_dd"."id" = "source"."block_id"
				AND "section_dd"."_parent_id" = "source"."section_id"
			LEFT JOIN "guideline_pages_blocks_column_unit" "page_cu"
				ON "page_cu"."id" = "source"."block_id"
				AND "page_cu"."_parent_id" = "source"."page_id"
			LEFT JOIN "guideline_pages_blocks_media_showcase" "page_ms"
				ON "page_ms"."id" = "source"."block_id"
				AND "page_ms"."_parent_id" = "source"."page_id"
			LEFT JOIN "guideline_pages_blocks_color_palette" "page_cp"
				ON "page_cp"."id" = "source"."block_id"
				AND "page_cp"."_parent_id" = "source"."page_id"
			LEFT JOIN "guideline_pages_blocks_do_dont" "page_dd"
				ON "page_dd"."id" = "source"."block_id"
				AND "page_dd"."_parent_id" = "source"."page_id"
		),
		"ordered" AS (
			SELECT
				"classified".*,
				(row_number() OVER (
					PARTITION BY "target", "parent_id" ORDER BY "rule_id"
				))::integer AS "row_order"
			FROM "classified"
		)
		SELECT
			"target",
			"parent_id",
			"row_order",
			substring(md5('guideline-check:' || "rule_id"::text), 1, 24),
			"key",
			"title",
			"tier",
			"checker_id",
			CASE "checker_key"
				WHEN 'canvas-format' THEN CASE "key"
					WHEN 'application.stationery.format' THEN
						'{"formats":[{"label":"명함 90×50mm","width":90,"height":50},{"label":"리플렛 A4 210×297mm","width":210,"height":297},{"label":"제품 정보 카드 A5 148×210mm","width":148,"height":210}],"tolerance":0.05,"ignoreOrientation":true}'::jsonb
					WHEN 'application.sns.format' THEN
						'{"formats":[{"label":"Feed 1080×1440px","width":1080,"height":1440},{"label":"Reels 1080×1920px","width":1080,"height":1920}]}'::jsonb
					WHEN 'application.sns.canvas.format' THEN
						'{"formats":[{"label":"3:5(SNS) 1080×1440px","width":1080,"height":1440}]}'::jsonb
					WHEN 'application.web' THEN
						'{"formats":[{"label":"16:9 1920×1080px","width":16,"height":9},{"label":"3:1 1920×640px","width":3,"height":1}]}'::jsonb
					WHEN 'application.advertisement.format' THEN
						'{"formats":[{"label":"16:9","width":16,"height":9},{"label":"3:4","width":3,"height":4},{"label":"3:1","width":3,"height":1},{"label":"1:1","width":1,"height":1},{"label":"1:2","width":1,"height":2},{"label":"Offline 1440×2100mm","width":1440,"height":2100},{"label":"Offline 2400×1600mm","width":2400,"height":1600},{"label":"Offline 8600×2100mm","width":8600,"height":2100}]}'::jsonb
					WHEN 'layout.visual.template' THEN
						'{"formats":[{"label":"1:1 1080×1080px","width":1,"height":1},{"label":"3:5(SNS) 1080×1440px","width":1080,"height":1440},{"label":"A4 210×297mm","width":210,"height":297},{"label":"3:1 1920×640px","width":3,"height":1},{"label":"16:9 1920×1080px","width":16,"height":9}]}'::jsonb
					WHEN 'layout.sns.template' THEN
						'{"formats":[{"label":"Feed 1080×1440px","width":1080,"height":1440},{"label":"Reels 1080×1920px","width":1080,"height":1920}]}'::jsonb
					WHEN 'layout.advertisement.template' THEN
						'{"formats":[{"label":"Offline Vertical 1440×2100mm","width":1440,"height":2100},{"label":"Offline Horizontal 2400×1600mm","width":2400,"height":1600},{"label":"Offline Horizontal(long) 8600×2100mm","width":8600,"height":2100}]}'::jsonb
				END
			END,
			"messages_pass",
			"messages_ok",
			"messages_needs_review",
			"messages_fail"
		FROM "ordered";

		DO $$
		DECLARE
			"source_count" integer;
			"backfill_count" integer;
		BEGIN
			SELECT count(*) INTO "source_count"
			FROM "rules_rels" WHERE "path" = 'source.document';

			SELECT count(*) INTO "backfill_count" FROM "_guideline_check_backfill";

			IF "source_count" <> "backfill_count" THEN
				RAISE EXCEPTION 'Guideline Check backfill count mismatch: sources %, checks %',
					"source_count", "backfill_count";
			END IF;

			IF EXISTS (
				SELECT 1 FROM "_guideline_check_backfill"
				WHERE "target" IS NULL OR "parent_id" IS NULL
			) THEN
				RAISE EXCEPTION 'Guideline Check backfill found an invalid source document or block';
			END IF;

			IF EXISTS (
				SELECT 1 FROM "_guideline_check_backfill" WHERE "checker_id" IS NULL
			) THEN
				RAISE EXCEPTION 'Guideline Check backfill found a Rule without RuleChecker';
			END IF;
		END $$;

		INSERT INTO "guideline_sections_checks"
		SELECT "row_order", "parent_id"::integer, "check_id", "key", "title",
			"tier"::"enum_guideline_sections_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill" WHERE "target" = 'guideline_sections_checks';

		INSERT INTO "guideline_pages_checks"
		SELECT "row_order", "parent_id"::integer, "check_id", "key", "title",
			"tier"::"enum_guideline_pages_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill" WHERE "target" = 'guideline_pages_checks';

		INSERT INTO "section_cu_checks"
		SELECT "row_order", "parent_id", "check_id", "key", "title",
			"tier"::"enum_section_cu_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill" WHERE "target" = 'section_cu_checks';

		INSERT INTO "section_ms_checks"
		SELECT "row_order", "parent_id", "check_id", "key", "title",
			"tier"::"enum_section_ms_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill" WHERE "target" = 'section_ms_checks';

		INSERT INTO "section_cp_checks"
		SELECT "row_order", "parent_id", "check_id", "key", "title",
			"tier"::"enum_section_cp_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill" WHERE "target" = 'section_cp_checks';

		INSERT INTO "section_dd_checks"
		SELECT "row_order", "parent_id", "check_id", "key", "title",
			"tier"::"enum_section_dd_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill" WHERE "target" = 'section_dd_checks';

		INSERT INTO "guideline_pages_blocks_column_unit_checks"
		SELECT "row_order", "parent_id", "check_id", "key", "title",
			"tier"::"enum_guideline_pages_blocks_column_unit_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill"
		WHERE "target" = 'guideline_pages_blocks_column_unit_checks';

		INSERT INTO "guideline_pages_blocks_media_showcase_checks"
		SELECT "row_order", "parent_id", "check_id", "key", "title",
			"tier"::"enum_guideline_pages_blocks_media_showcase_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill"
		WHERE "target" = 'guideline_pages_blocks_media_showcase_checks';

		INSERT INTO "guideline_pages_blocks_color_palette_checks"
		SELECT "row_order", "parent_id", "check_id", "key", "title",
			"tier"::"enum_guideline_pages_blocks_color_palette_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill"
		WHERE "target" = 'guideline_pages_blocks_color_palette_checks';

		INSERT INTO "guideline_pages_blocks_do_dont_checks"
		SELECT "row_order", "parent_id", "check_id", "key", "title",
			"tier"::"enum_guideline_pages_blocks_do_dont_checks_tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		FROM "_guideline_check_backfill"
		WHERE "target" = 'guideline_pages_blocks_do_dont_checks';
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DELETE FROM "guideline_sections_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
		DELETE FROM "guideline_pages_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
		DELETE FROM "section_cu_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
		DELETE FROM "section_ms_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
		DELETE FROM "section_cp_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
		DELETE FROM "section_dd_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
		DELETE FROM "guideline_pages_blocks_column_unit_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
		DELETE FROM "guideline_pages_blocks_media_showcase_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
		DELETE FROM "guideline_pages_blocks_color_palette_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
		DELETE FROM "guideline_pages_blocks_do_dont_checks"
		WHERE "id" IN (SELECT substring(md5('guideline-check:' || "id"::text), 1, 24) FROM "rules");
	`)
}
