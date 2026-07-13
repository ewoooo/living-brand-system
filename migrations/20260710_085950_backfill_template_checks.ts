import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		INSERT INTO "templates_template_checks" ("_order", "_parent_id", "id", "check_key")
		SELECT
			"placement"."_order",
			"placement"."_parent_id",
			substring(md5('template-check:' || "placement"."id"), 1, 24),
			"rule"."key"
		FROM "templates_template_rules" "placement"
		JOIN "rules" "rule" ON "rule"."id" = "placement"."rule_id";

		INSERT INTO "templates_template_checks_locales" ("body", "_locale", "_parent_id")
		SELECT
			"locale"."body",
			"locale"."_locale",
			substring(md5('template-check:' || "placement"."id"), 1, 24)
		FROM "templates_template_rules_locales" "locale"
		JOIN "templates_template_rules" "placement" ON "placement"."id" = "locale"."_parent_id";

		INSERT INTO "_templates_v_version_template_checks" (
			"_order", "_parent_id", "id", "check_key", "_uuid"
		)
		SELECT
			"placement"."_order",
			"placement"."_parent_id",
			"placement"."id",
			"rule"."key",
			"placement"."_uuid"
		FROM "_templates_v_version_template_rules" "placement"
		JOIN "rules" "rule" ON "rule"."id" = "placement"."rule_id";

		INSERT INTO "_templates_v_version_template_checks_locales" (
			"body", "_locale", "_parent_id"
		)
		SELECT "body", "_locale", "_parent_id"
		FROM "_templates_v_version_template_rules_locales";

		SELECT setval(
			pg_get_serial_sequence('_templates_v_version_template_checks', 'id'),
			GREATEST(COALESCE((SELECT max("id") FROM "_templates_v_version_template_checks"), 0) + 1, 1),
			false
		);

		DO $$
		BEGIN
			IF (SELECT count(*) FROM "templates_template_rules") <>
				(SELECT count(*) FROM "templates_template_checks") THEN
				RAISE EXCEPTION 'Template Check backfill count mismatch';
			END IF;

			IF (SELECT count(*) FROM "_templates_v_version_template_rules") <>
				(SELECT count(*) FROM "_templates_v_version_template_checks") THEN
				RAISE EXCEPTION 'Template Check version backfill count mismatch';
			END IF;
		END $$;
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DELETE FROM "templates_template_checks"
		WHERE "id" IN (
			SELECT substring(md5('template-check:' || "id"), 1, 24)
			FROM "templates_template_rules"
		);

		DELETE FROM "_templates_v_version_template_checks"
		WHERE "id" IN (SELECT "id" FROM "_templates_v_version_template_rules");
	`)
}
