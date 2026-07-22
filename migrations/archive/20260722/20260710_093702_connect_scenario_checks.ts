import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		CREATE TEMP TABLE "_scenario_check_sources" (
			"key" text PRIMARY KEY,
			"page_slug" text NOT NULL,
			"fallback_page_slug" text NOT NULL,
			"block_title" text
		) ON COMMIT DROP;

		INSERT INTO "_scenario_check_sources" (
			"key", "page_slug", "fallback_page_slug", "block_title"
		) VALUES
			('imagery.misuse', 'brand-model', 'photography', 'Brand Model'),
			('application.web', 'type-a-message', 'visual-system', 'Grids & Size Variation'),
			('imagery.sns.classification', 'brand-contents', 'sns-contents', 'Usage Example'),
			('layout.sns.zones', 'communication-contents', 'sns-contents', 'Influencer Gifting & Interview'),
			('application.sns.caption.legibility', 'communication-contents', 'sns-contents', 'Influencer Gifting & Interview'),
			('logo.sns.placement', 'communication-contents', 'sns-contents', 'Events & Etc.'),
			('application.sns.format', 'sns-contents', 'sns-contents', NULL),
			('messaging.advertisement.copy', 'online-ad', 'ad', 'Layout System'),
			('messaging.advertisement.tagline', 'offline-ad-vertical', 'ad', 'Layout System'),
			('imagery.advertisement.classification', 'offline-ad-vertical', 'ad', 'Layout System'),
			('messaging.advertisement.boilerplate', 'offline-ad-horizontal', 'ad', 'Layout System'),
			('spacing.advertisement.scale', 'offline-ad-horizontal', 'ad', 'Usage Example 2'),
			('application.print.spec', 'business-card', 'stationery', 'Design / Specification');

		CREATE TEMP TABLE "_scenario_check_targets" ON COMMIT DROP AS
		SELECT
			"source"."key",
			"page"."id" AS "page_id",
			"block"."id" AS "block_id"
		FROM "_scenario_check_sources" "source"
		JOIN LATERAL (
			SELECT "candidate"."id"
			FROM "guideline_pages" "candidate"
			JOIN "guideline_pages_locales" "locale"
				ON "locale"."_parent_id" = "candidate"."id"
			WHERE "locale"."slug" IN ("source"."page_slug", "source"."fallback_page_slug")
			ORDER BY
				CASE WHEN "locale"."slug" = "source"."page_slug" THEN 0 ELSE 1 END,
				"candidate"."id"
			LIMIT 1
		) "page" ON true
		LEFT JOIN LATERAL (
			SELECT "candidate"."id"
			FROM "guideline_pages_blocks_column_unit" "candidate"
			JOIN "guideline_pages_blocks_column_unit_locales" "locale"
				ON "locale"."_parent_id" = "candidate"."id"
			WHERE "candidate"."_parent_id" = "page"."id"
				AND "source"."block_title" IS NOT NULL
				AND "locale"."title" = "source"."block_title"
			ORDER BY "candidate"."_order", "candidate"."id"
			LIMIT 1
		) "block" ON true;

		DO $$
		BEGIN
			IF (SELECT count(*) FROM "rules" JOIN "_scenario_check_targets" USING ("key")
				WHERE "rules"."checker_id" IS NOT NULL) <> 13 THEN
				RAISE EXCEPTION 'Scenario Check source migration requires 13 Rules with RuleCheckers';
			END IF;

			IF (SELECT count(*) FROM "_scenario_check_targets") <> 13 THEN
				RAISE EXCEPTION 'Scenario Check source migration found a missing Page';
			END IF;
		END $$;

		DELETE FROM "guideline_pages_blocks_column_unit_checks"
		WHERE "key" = 'application.sns.canvas.format';
		DELETE FROM "guideline_pages_checks"
		WHERE "key" = 'application.sns.canvas.format';

		INSERT INTO "guideline_pages_blocks_column_unit_checks" (
			"_order", "_parent_id", "id", "key", "title", "tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		)
		SELECT
			(COALESCE((
				SELECT max("existing"."_order")
				FROM "guideline_pages_blocks_column_unit_checks" "existing"
				WHERE "existing"."_parent_id" = "source"."block_id"
			), 0) + row_number() OVER (
				PARTITION BY "source"."block_id" ORDER BY "rule"."id"
			))::integer,
			"source"."block_id",
			substring(md5('guideline-check:' || "rule"."id"::text), 1, 24),
			"rule"."key",
			"rule"."title",
			"rule"."tier"::text::"enum_guideline_pages_blocks_column_unit_checks_tier",
			"rule"."checker_id",
			CASE "rule"."key"
				WHEN 'application.web' THEN
					'{"formats":[{"label":"16:9 1920x1080px","width":16,"height":9},{"label":"3:1 1920x640px","width":3,"height":1}]}'::jsonb
			END,
			"rule"."messages_pass",
			"rule"."messages_ok",
			"rule"."messages_needs_review",
			"rule"."messages_fail"
		FROM "_scenario_check_targets" "source"
		JOIN "rules" "rule" ON "rule"."key" = "source"."key"
		WHERE "source"."block_id" IS NOT NULL;

		INSERT INTO "guideline_pages_checks" (
			"_order", "_parent_id", "id", "key", "title", "tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		)
		SELECT
			(COALESCE((SELECT max("_order") FROM "guideline_pages_checks"
				WHERE "_parent_id" = "source"."page_id"), 0) + row_number() OVER (
					PARTITION BY "source"."page_id" ORDER BY "rule"."id"
			))::integer,
			"source"."page_id",
			substring(md5('guideline-check:' || "rule"."id"::text), 1, 24),
			"rule"."key",
			"rule"."title",
			"rule"."tier"::text::"enum_guideline_pages_checks_tier",
			"rule"."checker_id",
			'{"formats":[{"label":"Feed 1080x1440px","width":1080,"height":1440},{"label":"Reels 1080x1920px","width":1080,"height":1920}]}'::jsonb,
			"rule"."messages_pass",
			"rule"."messages_ok",
			"rule"."messages_needs_review",
			"rule"."messages_fail"
		FROM "_scenario_check_targets" "source"
		JOIN "rules" "rule" ON "rule"."key" = "source"."key"
		WHERE "source"."block_id" IS NULL;
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DELETE FROM "guideline_pages_checks"
		WHERE "id" IN (
			SELECT substring(md5('guideline-check:' || "id"::text), 1, 24)
			FROM "rules" WHERE "key" = 'application.sns.format'
		);

		DELETE FROM "guideline_pages_blocks_column_unit_checks"
		WHERE "id" IN (
			SELECT substring(md5('guideline-check:' || "id"::text), 1, 24)
			FROM "rules" WHERE "key" IN (
				'imagery.misuse',
				'application.web',
				'imagery.sns.classification',
				'layout.sns.zones',
				'application.sns.caption.legibility',
				'logo.sns.placement',
				'messaging.advertisement.copy',
				'messaging.advertisement.tagline',
				'imagery.advertisement.classification',
				'messaging.advertisement.boilerplate',
				'spacing.advertisement.scale',
				'application.print.spec'
			)
		);

		CREATE TEMP TABLE "_legacy_sns_check_source" ON COMMIT DROP AS
		SELECT
			"rule".*,
			"source"."guideline_pages_id" AS "page_id",
			"block"."id" AS "block_id"
		FROM "rules" "rule"
		JOIN "rules_rels" "source"
			ON "source"."parent_id" = "rule"."id"
			AND "source"."path" = 'source.document'
		LEFT JOIN "guideline_pages_blocks_column_unit" "block"
			ON "block"."id" = "rule"."source_block_id"
			AND "block"."_parent_id" = "source"."guideline_pages_id"
		WHERE "rule"."key" = 'application.sns.canvas.format'
			AND "source"."guideline_pages_id" IS NOT NULL;

		INSERT INTO "guideline_pages_blocks_column_unit_checks" (
			"_order", "_parent_id", "id", "key", "title", "tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		)
		SELECT
			COALESCE((SELECT max("_order") FROM "guideline_pages_blocks_column_unit_checks"
				WHERE "_parent_id" = "rule"."block_id"), 0) + 1,
			"rule"."block_id",
			substring(md5('guideline-check:' || "rule"."id"::text), 1, 24),
			"rule"."key",
			"rule"."title",
			"rule"."tier"::text::"enum_guideline_pages_blocks_column_unit_checks_tier",
			"rule"."checker_id",
			'{"formats":[{"label":"3:5(SNS) 1080x1440px","width":1080,"height":1440}]}'::jsonb,
			"rule"."messages_pass",
			"rule"."messages_ok",
			"rule"."messages_needs_review",
			"rule"."messages_fail"
		FROM "_legacy_sns_check_source" "rule"
		WHERE "rule"."block_id" IS NOT NULL
		ON CONFLICT ("id") DO NOTHING;

		INSERT INTO "guideline_pages_checks" (
			"_order", "_parent_id", "id", "key", "title", "tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		)
		SELECT
			COALESCE((SELECT max("_order") FROM "guideline_pages_checks"
				WHERE "_parent_id" = "rule"."page_id"), 0) + 1,
			"rule"."page_id",
			substring(md5('guideline-check:' || "rule"."id"::text), 1, 24),
			"rule"."key",
			"rule"."title",
			"rule"."tier"::text::"enum_guideline_pages_checks_tier",
			"rule"."checker_id",
			'{"formats":[{"label":"3:5(SNS) 1080x1440px","width":1080,"height":1440}]}'::jsonb,
			"rule"."messages_pass",
			"rule"."messages_ok",
			"rule"."messages_needs_review",
			"rule"."messages_fail"
		FROM "_legacy_sns_check_source" "rule"
		WHERE "rule"."block_id" IS NULL
		ON CONFLICT ("id") DO NOTHING;
	`)
}
