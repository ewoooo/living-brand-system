import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		INSERT INTO "rule_specs" ("key", "executor", "checker_key", "model", "prompt_key", "_status")
		VALUES
			('checker.palette-compliance', 'deterministic', 'palette-compliance', NULL, NULL, 'published'),
			('checker.color-combination', 'deterministic', 'color-combination', NULL, NULL, 'published'),
			('checker.spot-color', 'deterministic', 'spot-color', NULL, NULL, 'published'),
			('checker.background-tone', 'deterministic', 'background-tone', NULL, NULL, 'published'),
			('checker.clear-space', 'deterministic', 'clear-space', NULL, NULL, 'published'),
			('checker.relative-size', 'deterministic', 'relative-size', NULL, NULL, 'published'),
			('checker.canvas-format', 'deterministic', 'canvas-format', NULL, NULL, 'published'),
			('model.anthropic.brand-guideline', 'heuristic', NULL, 'claude-haiku-4-5', 'asset-check.brand-guideline.v1', 'published'),
			('manual.review', 'manual', NULL, NULL, NULL, 'published');

		INSERT INTO "_rule_specs_v" (
			"parent_id",
			"version_key",
			"version_executor",
			"version_checker_key",
			"version_model",
			"version_prompt_key",
			"version_updated_at",
			"version_created_at",
			"version__status",
			"latest"
		)
		SELECT
			"id",
			"key",
			"executor"::text::"enum__rule_specs_v_version_executor",
			"checker_key",
			"model",
			"prompt_key",
			"updated_at",
			"created_at",
			"_status"::text::"enum__rule_specs_v_version_status",
			true
		FROM "rule_specs"
		WHERE "key" IN (
			'checker.palette-compliance',
			'checker.color-combination',
			'checker.spot-color',
			'checker.background-tone',
			'checker.clear-space',
			'checker.relative-size',
			'checker.canvas-format',
			'model.anthropic.brand-guideline',
			'manual.review'
		);

		UPDATE "rules"
		SET "spec_id" = CASE "key"
			WHEN 'color.palette' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.palette-compliance')
			WHEN 'color.combination' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.color-combination')
			WHEN 'color.mode' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.spot-color')
			WHEN 'application.print.spec' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.spot-color')
			WHEN 'imagery.background.tone' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.background-tone')
			WHEN 'logo.space.clear' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.clear-space')
			WHEN 'logo.size.minimum' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.relative-size')
			WHEN 'application.stationery.format' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.canvas-format')
			WHEN 'application.sns.format' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.canvas-format')
			WHEN 'application.sns.canvas.format' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.canvas-format')
			WHEN 'application.web' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.canvas-format')
			WHEN 'application.advertisement.format' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.canvas-format')
			WHEN 'layout.visual.template' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.canvas-format')
			WHEN 'layout.sns.template' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.canvas-format')
			WHEN 'layout.advertisement.template' THEN (SELECT "id" FROM "rule_specs" WHERE "key" = 'checker.canvas-format')
		END
		WHERE "key" IN (
			'color.palette',
			'color.combination',
			'color.mode',
			'application.print.spec',
			'imagery.background.tone',
			'logo.space.clear',
			'logo.size.minimum',
			'application.stationery.format',
			'application.sns.format',
			'application.sns.canvas.format',
			'application.web',
			'application.advertisement.format',
			'layout.visual.template',
			'layout.sns.template',
			'layout.advertisement.template'
		);

		UPDATE "rules"
		SET "spec_id" = (SELECT "id" FROM "rule_specs" WHERE "key" = 'model.anthropic.brand-guideline')
		WHERE "spec_id" IS NULL AND "executor" = 'heuristic';

		UPDATE "rules"
		SET "spec_id" = (SELECT "id" FROM "rule_specs" WHERE "key" = 'manual.review')
		WHERE "spec_id" IS NULL;
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DELETE FROM "_rule_specs_v"
		WHERE "version_key" IN (
			'checker.palette-compliance',
			'checker.color-combination',
			'checker.spot-color',
			'checker.background-tone',
			'checker.clear-space',
			'checker.relative-size',
			'checker.canvas-format',
			'model.anthropic.brand-guideline',
			'manual.review'
		);

		DELETE FROM "rule_specs"
		WHERE "key" IN (
			'checker.palette-compliance',
			'checker.color-combination',
			'checker.spot-color',
			'checker.background-tone',
			'checker.clear-space',
			'checker.relative-size',
			'checker.canvas-format',
			'model.anthropic.brand-guideline',
			'manual.review'
		);
	`)
}
