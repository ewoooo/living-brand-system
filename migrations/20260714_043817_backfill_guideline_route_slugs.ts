import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM "guideline_docs" "document"
				JOIN "guideline_docs_locales" "locale"
					ON "locale"."_parent_id" = "document"."id"
				WHERE coalesce("locale"."legacy_slug", "locale"."slug") IS NOT NULL
				GROUP BY
					"document"."parent_id",
					"locale"."_locale",
					coalesce("locale"."legacy_slug", "locale"."slug")
				HAVING count(*) > 1
			) THEN
				RAISE EXCEPTION 'guideline document sibling slug conflict';
			END IF;
		END $$;

		UPDATE "guideline_docs_locales"
		SET
			"slug" = "legacy_slug",
			"generate_slug" = false
		WHERE "legacy_slug" IS NOT NULL;

		UPDATE "_guideline_docs_v_locales"
		SET
			"version_slug" = "version_legacy_slug",
			"version_generate_slug" = false
		WHERE "version_legacy_slug" IS NOT NULL;
	`)
	await refreshBreadcrumbURLs(db)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		UPDATE "guideline_docs_locales" "locale"
		SET "slug" = concat(
			"locale"."legacy_slug",
			CASE "document"."legacy_collection"
				WHEN 'guideline-chapters' THEN '-chapter-'
				WHEN 'guideline-sections' THEN '-section-'
				ELSE '-page-'
			END,
			"document"."legacy_id"
		)
		FROM "guideline_docs" "document"
		WHERE
			"locale"."_parent_id" = "document"."id"
			AND "locale"."legacy_slug" IS NOT NULL
			AND "document"."legacy_collection" IS NOT NULL
			AND "document"."legacy_id" IS NOT NULL;

		UPDATE "_guideline_docs_v_locales" "locale"
		SET "version_slug" = concat(
			"locale"."version_legacy_slug",
			CASE "version"."version_legacy_collection"
				WHEN 'guideline-chapters' THEN '-chapter-'
				WHEN 'guideline-sections' THEN '-section-'
				ELSE '-page-'
			END,
			"version"."version_legacy_id"
		)
		FROM "_guideline_docs_v" "version"
		WHERE
			"locale"."_parent_id" = "version"."id"
			AND "locale"."version_legacy_slug" IS NOT NULL
			AND "version"."version_legacy_collection" IS NOT NULL
			AND "version"."version_legacy_id" IS NOT NULL;
	`)
	await refreshBreadcrumbURLs(db)
}

async function refreshBreadcrumbURLs(db: MigrateUpArgs['db']) {
	await db.execute(sql`
		WITH RECURSIVE "document_paths" AS (
			SELECT
				"document"."id",
				"document"."parent_id",
				"locale"."_locale",
				concat('/guideline/', "locale"."slug") AS "url"
			FROM "guideline_docs" "document"
			JOIN "guideline_docs_locales" "locale"
				ON "locale"."_parent_id" = "document"."id"
			WHERE "document"."parent_id" IS NULL

			UNION ALL

			SELECT
				"document"."id",
				"document"."parent_id",
				"locale"."_locale",
				concat("parent_path"."url", '/', "locale"."slug") AS "url"
			FROM "guideline_docs" "document"
			JOIN "guideline_docs_locales" "locale"
				ON "locale"."_parent_id" = "document"."id"
			JOIN "document_paths" "parent_path"
				ON "parent_path"."id" = "document"."parent_id"
				AND "parent_path"."_locale" = "locale"."_locale"
		), "updated_breadcrumbs" AS (
			UPDATE "guideline_docs_breadcrumbs" "breadcrumb"
			SET "url" = "document_path"."url"
			FROM "document_paths" "document_path"
			WHERE
				"breadcrumb"."doc_id" = "document_path"."id"
				AND "breadcrumb"."_locale" = "document_path"."_locale"
			RETURNING "breadcrumb"."id"
		)
		UPDATE "_guideline_docs_v_version_breadcrumbs" "breadcrumb"
		SET "url" = "document_path"."url"
		FROM "document_paths" "document_path"
		WHERE
			"breadcrumb"."doc_id" = "document_path"."id"
			AND "breadcrumb"."_locale" = "document_path"."_locale";
	`)
}
