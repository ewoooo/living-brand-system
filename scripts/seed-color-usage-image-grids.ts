import config from '@payload-config'
import { getPayload } from 'payload'
import type { GuidelineDocument } from '@/payload-types'

/**
 * Color Usage 문서를 "Level별 imageGrid" 구성으로 바꾼다(essenherb 가이드 p31).
 *
 * 기존: contentColumns 1개(Level 1/2/3를 3열 텍스트로).
 * 목표: Level마다 imageGrid 1개(제목=Level, 설명=기존 body, 3열×1행, 빈 이미지 셀 3개) → 세로 스택.
 *       결과적으로 3행×3열, "이미지 3장이 한 텍스트(Level)로 묶임"(원본 p31의 transpose).
 *
 * - 텍스트(heading/body)는 기존 contentColumns에서 그대로 옮긴다(유실 없음). 이미지는 admin에서 업로드.
 * - 이미 imageGrid로 변환돼 있으면 건너뛴다(재실행 안전). 문서가 없으면(빈 DB) 건너뛴다.
 *
 * 실행: pnpm payload run scripts/seed-color-usage-image-grids.ts
 */

type Block = NonNullable<GuidelineDocument['blocks']>[number]
// biome-ignore lint/suspicious/noExplicitAny: 시드에서 블록 필드를 느슨하게 다룬다.
type AnyBlock = any

const isLevelColumns = (b: AnyBlock): boolean =>
	b.blockType === 'contentColumns' &&
	(b.columns ?? []).some((c: AnyBlock) => /level/i.test(String(c.heading ?? '')))

const payload = await getPayload({ config })

const { docs } = await payload.find({
	collection: 'guideline-documents',
	where: { slug: { equals: 'color-usage' } },
	locale: 'ko',
	draft: false,
	overrideAccess: true,
	depth: 0,
	limit: 5,
})

const doc = docs[0]

if (!doc) {
	console.log('color-usage 문서 없음 — 건너뜀(가이드라인 문서 시드 필요)')
} else {
	const existing = (doc.blocks ?? []) as AnyBlock[]
	const source = existing.find(isLevelColumns)

	if (!source) {
		console.log(`doc ${doc.id}: Level contentColumns 없음(이미 변환됐거나 구성 다름) — 건너뜀`)
	} else {
		// 각 Level 열 → imageGrid(제목=heading, 설명=body, 3열×1행, 빈 셀 3개).
		const grids: Block[] = (source.columns ?? []).map(
			(col: AnyBlock) =>
				({
					blockType: 'imageGrid',
					title: col.heading ?? undefined,
					description: col.body ?? undefined,
					columns: 3,
					rows: 1,
					imageRatio: '1:1',
					cells: [{}, {}, {}],
				}) as Block,
		)

		// contentColumns 자리를 imageGrid들로 치환, 나머지 블록은 순서 보존.
		const nextBlocks = existing.flatMap((b) => (b === source ? grids : [b])) as Block[]

		await payload.update({
			collection: 'guideline-documents',
			id: doc.id,
			locale: 'ko',
			draft: false,
			overrideAccess: true,
			data: { _status: 'published', blocks: nextBlocks },
		})
		console.log(`doc ${doc.id}: Level ${grids.length}개를 imageGrid로 변환(이미지 셀 비움)`)
	}
}
