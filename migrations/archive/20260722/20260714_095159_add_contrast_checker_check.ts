import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const CHECKER_KEY = 'checker.contrast'
const CHECK_KEY = 'color.contrast'
const DOCUMENT_SLUG = 'color-pairing'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
	const documentId = await findTargetDocumentId(db)
	// 신규 DB에는 backfill된 guideline 콘텐츠가 없어 대상 문서가 존재하지 않는다.
	// 이 시드는 기존 콘텐츠 DB에 Check를 붙이는 목적이므로, 대상이 없으면 건너뛴다.
	if (documentId === null) {
		payload.logger.info(`${DOCUMENT_SLUG} 문서가 없어 contrast checker 시드를 건너뜁니다.`)
		return
	}

	const { rows: checkers } = await db.execute(sql`
		INSERT INTO "rule_checkers" ("key", "executor", "checker_key", "_status", "created_at", "updated_at")
		VALUES (${CHECKER_KEY}, 'deterministic', 'contrast', 'published', NOW(), NOW())
		ON CONFLICT ("key") DO UPDATE SET
			"executor" = EXCLUDED."executor",
			"checker_key" = EXCLUDED."checker_key",
			"_status" = EXCLUDED."_status",
			"updated_at" = NOW()
		RETURNING "id"
	`)
	const checkerId = checkers[0]?.id
	if (typeof checkerId !== 'number') {
		throw new Error(`${CHECKER_KEY} Checker 생성에 실패했습니다.`)
	}

	const checkId = `${documentId}:${CHECK_KEY}`
	const options = JSON.stringify({
		criteria: [{ measurement: 'contrastRatio', operator: 'gte', expected: 4.5 }],
	})
	await db.execute(sql`
		INSERT INTO "guideline_docs_checks" (
			"_order", "_parent_id", "id", "title", "title_ko", "key", "tier", "executor",
			"checker_id", "options", "messages_pass", "messages_needs_review", "messages_fail"
		)
		SELECT
			COALESCE((SELECT MAX("_order") FROM "guideline_docs_checks" WHERE "_parent_id" = ${documentId}), -1) + 1,
			${documentId}, ${checkId}, 'Color Contrast', '색상 대비', ${CHECK_KEY}, 'required',
			'deterministic', ${checkerId}, ${options}::jsonb, '색상 대비 기준을 충족합니다.',
			'색상 대비를 자동으로 측정하지 못했습니다: {reasonCode}', '색상 대비가 기준보다 낮습니다.'
		WHERE NOT EXISTS (
			SELECT 1 FROM "guideline_docs_checks"
			WHERE "_parent_id" = ${documentId} AND "key" = ${CHECK_KEY}
		)
		ON CONFLICT ("id") DO NOTHING
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DELETE FROM "guideline_docs_checks" checks
		USING "guideline_docs" documents, "guideline_docs_locales" locales
		WHERE checks."_parent_id" = documents."id"
			AND locales."_parent_id" = documents."id"
			AND locales."_locale" = 'ko'
			AND locales."slug" = ${DOCUMENT_SLUG}
			AND checks."key" = ${CHECK_KEY}
	`)
	await db.execute(sql`DELETE FROM "rule_checkers" WHERE "key" = ${CHECKER_KEY}`)
}

// Payload Local API는 현재 config를 읽으므로, 중간 migration 스키마 조회는 snapshot SQL이 소유한다.
async function findTargetDocumentId(db: MigrateUpArgs['db']): Promise<number | null> {
	const { rows: documents } = await db.execute(sql`
		SELECT documents."id"
		FROM "guideline_docs" documents
		JOIN "guideline_docs_locales" locales ON locales."_parent_id" = documents."id"
		WHERE documents."_status" = 'published'
			AND locales."_locale" = 'ko'
			AND locales."slug" = ${DOCUMENT_SLUG}
		LIMIT 2
	`)
	if (documents.length === 0) return null
	if (documents.length > 1) {
		throw new Error(`${DOCUMENT_SLUG} published 문서를 1건 찾을 수 없습니다.`)
	}
	const documentId = documents[0]?.id
	if (typeof documentId !== 'number') {
		throw new Error(`${DOCUMENT_SLUG} 문서 ID를 읽을 수 없습니다.`)
	}
	return documentId
}
