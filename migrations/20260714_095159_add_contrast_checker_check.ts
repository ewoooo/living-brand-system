import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import type { GuidelineDocument } from '../src/payload-types'

const CHECKER_KEY = 'checker.contrast'
const CHECK_KEY = 'color.contrast'
const DOCUMENT_SLUG = 'color-pairing'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	const document = await findTargetDocument({ payload, req })
	if (document.checks?.some((check) => check.key === CHECK_KEY)) {
		throw new Error(`${CHECK_KEY} Check가 이미 존재합니다.`)
	}

	const { rows: existingCheckers } = await db.execute(
		sql`SELECT "id" FROM "rule_checkers" WHERE "key" = ${CHECKER_KEY} LIMIT 1`,
	)
	if (existingCheckers.length > 0) {
		throw new Error(`${CHECKER_KEY} Checker가 이미 존재합니다.`)
	}

	const { rows: checkers } = await db.execute(sql`
		INSERT INTO "rule_checkers" ("key", "executor", "checker_key", "_status", "created_at", "updated_at")
		VALUES (${CHECKER_KEY}, 'deterministic', 'contrast', 'published', NOW(), NOW())
		RETURNING "id"
	`)
	const checkerId = checkers[0]?.id
	if (typeof checkerId !== 'number') {
		throw new Error(`${CHECKER_KEY} Checker 생성에 실패했습니다.`)
	}

	await payload.update({
		collection: 'guideline-documents',
		id: document.id,
		data: {
			checks: [
				...(document.checks ?? []),
				{
					title: 'Color Contrast',
					titleKo: '색상 대비',
					key: CHECK_KEY,
					tier: 'required',
					executor: 'deterministic',
					checker: checkerId,
					options: {
						criteria: [
							{ measurement: 'contrastRatio', operator: 'gte', expected: 4.5 },
						],
					},
					messages: {
						pass: '색상 대비 기준을 충족합니다.',
						fail: '색상 대비가 기준보다 낮습니다.',
						needsReview: '색상 대비를 자동으로 측정하지 못했습니다: {reasonCode}',
					},
				},
			],
		},
		depth: 0,
		draft: false,
		fallbackLocale: false,
		locale: 'ko',
		overrideAccess: true,
		req,
	})
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
	const documents = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: false,
		fallbackLocale: false,
		limit: 1,
		locale: 'ko',
		overrideAccess: true,
		req,
		where: { slug: { equals: DOCUMENT_SLUG } },
	})
	const document = documents.docs[0]
	if (document?.checks?.some((check) => check.key === CHECK_KEY)) {
		await payload.update({
			collection: 'guideline-documents',
			id: document.id,
			data: { checks: document.checks.filter((check) => check.key !== CHECK_KEY) },
			depth: 0,
			draft: false,
			fallbackLocale: false,
			locale: 'ko',
			overrideAccess: true,
			req,
		})
	}

	await db.execute(sql`DELETE FROM "rule_checkers" WHERE "key" = ${CHECKER_KEY}`)
}

async function findTargetDocument({
	payload,
	req,
}: Pick<MigrateUpArgs, 'payload' | 'req'>): Promise<GuidelineDocument> {
	const documents = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: false,
		fallbackLocale: false,
		limit: 2,
		locale: 'ko',
		overrideAccess: true,
		req,
		where: { slug: { equals: DOCUMENT_SLUG } },
	})
	if (documents.docs.length !== 1) {
		throw new Error(`${DOCUMENT_SLUG} published 문서를 1건 찾을 수 없습니다.`)
	}
	return documents.docs[0]
}
