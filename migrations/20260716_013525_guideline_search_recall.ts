import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		ALTER TABLE "search_locales" ADD COLUMN "search_text" varchar;

		UPDATE "agent_skills"
		SET
			"body" = replace(
				replace(
					"body",
					'- Use listGuidelinePages when the user asks what guideline pages or sections exist.',
					'- Use listGuidelineDocuments when the user asks what guideline pages or sections exist.'
				),
				'- Use searchGuidelines when current page context is not enough.
- If searchGuidelines returns useful results, use readGuidelineDocument before answering.
- If no useful guideline context exists, say manager review is needed.',
				'- Use searchGuidelines when current page context is not enough.
- If searchGuidelines returns no useful result, retry with shorter core terms.
- If shorter searches still return no useful result, use listGuidelineDocuments to inspect the published hierarchy.
- If searchGuidelines or listGuidelineDocuments returns a useful document, use readGuidelineDocument before answering.
- Only say manager review is needed after search, shorter-term retry, and published document list inspection all fail.'
			),
			"updated_at" = now()
		WHERE "name" = 'Guideline Curator'
			AND (
				"body" LIKE '%listGuidelinePages%'
				OR "body" LIKE '%If no useful guideline context exists, say manager review is needed.%'
			);
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		UPDATE "agent_skills"
		SET
			"body" = replace(
				replace(
					"body",
					'- Use listGuidelineDocuments when the user asks what guideline pages or sections exist.',
					'- Use listGuidelinePages when the user asks what guideline pages or sections exist.'
				),
				'- Use searchGuidelines when current page context is not enough.
- If searchGuidelines returns no useful result, retry with shorter core terms.
- If shorter searches still return no useful result, use listGuidelineDocuments to inspect the published hierarchy.
- If searchGuidelines or listGuidelineDocuments returns a useful document, use readGuidelineDocument before answering.
- Only say manager review is needed after search, shorter-term retry, and published document list inspection all fail.',
				'- Use searchGuidelines when current page context is not enough.
- If searchGuidelines returns useful results, use readGuidelineDocument before answering.
- If no useful guideline context exists, say manager review is needed.'
			),
			"updated_at" = now()
		WHERE "name" = 'Guideline Curator'
			AND (
				"body" LIKE '%listGuidelineDocuments when the user asks what guideline pages or sections exist.%'
				OR "body" LIKE '%If searchGuidelines returns no useful result, retry with shorter core terms.%'
			);

		ALTER TABLE "search_locales" DROP COLUMN "search_text";
	`)
}
