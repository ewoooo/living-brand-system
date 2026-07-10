import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		CREATE TEMP TABLE "_scenario_check_sources" (
			"key" text PRIMARY KEY,
			"page_id" integer NOT NULL,
			"block_id" varchar
		) ON COMMIT DROP;

		INSERT INTO "_scenario_check_sources" ("key", "page_id", "block_id") VALUES
			('imagery.misuse', 135, '6a4f79604377e66a665d82f8'),
			('application.web', 138, '6a4f79614377e66a665d8302'),
			('imagery.sns.classification', 140, '6a4f79614377e66a665d8312'),
			('layout.sns.zones', 142, '6a4f79614377e66a665d8318'),
			('application.sns.caption.legibility', 142, '6a4f79614377e66a665d8318'),
			('logo.sns.placement', 142, '6a4f79614377e66a665d831a'),
			('application.sns.format', 96, NULL),
			('messaging.advertisement.copy', 104, '6a4f79614377e66a665d831c'),
			('messaging.advertisement.tagline', 105, '6a4f79614377e66a665d8320'),
			('imagery.advertisement.classification', 105, '6a4f79614377e66a665d8320'),
			('messaging.advertisement.boilerplate', 106, '6a4f79614377e66a665d8324'),
			('spacing.advertisement.scale', 106, '6a4f79614377e66a665d8328'),
			('application.print.spec', 109, '6a4f79614377e66a665d832c');

		DO $$
		BEGIN
			IF (SELECT count(*) FROM "rules" JOIN "_scenario_check_sources" USING ("key")
				WHERE "rules"."checker_id" IS NOT NULL) <> 13 THEN
				RAISE EXCEPTION 'Scenario Check source migration requires 13 Rules with RuleCheckers';
			END IF;

			IF EXISTS (
				SELECT 1
				FROM "_scenario_check_sources" "source"
				LEFT JOIN "guideline_pages" "page" ON "page"."id" = "source"."page_id"
				LEFT JOIN "guideline_pages_blocks_column_unit" "block"
					ON "block"."id" = "source"."block_id"
					AND "block"."_parent_id" = "source"."page_id"
				WHERE "page"."id" IS NULL
					OR ("source"."block_id" IS NOT NULL AND "block"."id" IS NULL)
			) THEN
				RAISE EXCEPTION 'Scenario Check source migration found a missing Page or Block';
			END IF;
		END $$;

		DELETE FROM "guideline_pages_blocks_column_unit_checks"
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
		FROM "_scenario_check_sources" "source"
		JOIN "rules" "rule" ON "rule"."key" = "source"."key"
		WHERE "source"."block_id" IS NOT NULL;

		INSERT INTO "guideline_pages_checks" (
			"_order", "_parent_id", "id", "key", "title", "tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		)
		SELECT
			COALESCE((SELECT max("_order") FROM "guideline_pages_checks"
				WHERE "_parent_id" = "source"."page_id"), 0) + 1,
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
		FROM "_scenario_check_sources" "source"
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

		INSERT INTO "guideline_pages_blocks_column_unit_checks" (
			"_order", "_parent_id", "id", "key", "title", "tier", "checker_id", "options",
			"messages_pass", "messages_ok", "messages_needs_review", "messages_fail"
		)
		SELECT
			1,
			'6a4f79614377e66a665d830a',
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
		FROM "rules" "rule"
		WHERE "rule"."key" = 'application.sns.canvas.format'
		ON CONFLICT ("id") DO NOTHING;
	`)
}
