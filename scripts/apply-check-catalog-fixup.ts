/**
 * apply-check-catalog 후속 정리 3건:
 * 1) 신규 체커 7종 draft → published (create의 draft:false가 적용되지 않은 문제 보정)
 * 2) 구 manual.review의 개명본 checker.adivisor 삭제 (참조 0건 확인됨)
 * 3) brand-product의 테스트 잔여 체크 image-usage-product 제거 (구 체커 삭제로 checker가 NULL이 되어 런타임 예외 유발)
 * 실행: pnpm exec payload run scripts/apply-check-catalog-fixup.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

const NEW_CHECKER_KEYS = [
	'ai.logo',
	'ai.color',
	'ai.typography',
	'ai.imagery',
	'ai.layout',
	'advisory.copy',
	'advisory.design',
]

for (const key of NEW_CHECKER_KEYS) {
	const found = await payload.find({
		collection: 'rule-checkers',
		where: { key: { equals: key } },
		limit: 1,
		draft: true,
	})
	const doc = found.docs[0]
	if (!doc) throw new Error(`체커 없음: ${key}`)
	await payload.update({
		collection: 'rule-checkers',
		id: doc.id,
		data: { _status: 'published' },
		draft: false,
	})
	console.log(`published: ${key}`)
}

const stale = await payload.find({
	collection: 'rule-checkers',
	where: { key: { equals: 'checker.adivisor' } },
	limit: 1,
})
if (stale.docs[0]) {
	await payload.delete({ collection: 'rule-checkers', id: stale.docs[0].id })
	console.log('deleted: checker.adivisor (구 manual.review)')
}

const brandProduct = await payload.find({
	collection: 'guideline-documents',
	where: { slug: { equals: 'brand-product' } },
	depth: 0,
	limit: 1,
	draft: false,
	locale: 'ko',
})
const doc = brandProduct.docs[0]
if (doc && Array.isArray(doc.blocks)) {
	const blocks = doc.blocks.map((block) => {
		const checks = (block as { checks?: { key?: string | null }[] }).checks
		if (!Array.isArray(checks)) return block
		return { ...block, checks: checks.filter((check) => check.key !== 'image-usage-product') }
	})
	await payload.update({
		collection: 'guideline-documents',
		id: doc.id,
		data: { blocks: blocks as typeof doc.blocks },
		depth: 0,
		draft: false,
		locale: 'ko',
	})
	console.log('removed: image-usage-product (brand-product)')
}

console.log('fixup done')
process.exit(0)
