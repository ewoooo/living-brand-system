import config from '@payload-config'
import { getPayload } from 'payload'
import type { GuidelineDocument } from '@/payload-types'

/**
 * Tone in Tone 문서를 "설명 + live 추천 그리드" 구성으로 수렴시킨다(essenherb 가이드 p27/p28).
 *
 * 대상 = colorPairing(system='tone-in-tone') 블록을 가진 가이드라인 문서(id 하드코딩 없이 탐색).
 * 목표 블록 순서:
 *   [colorPairing 툴] [Light 설명(이미지 제거)] [추천 그리드 light] [Dark 설명(이미지 제거)] [추천 그리드 dark]
 *
 * - 기존 설명 contentColumns(제목에 Light/Dark 포함)는 헤딩·본문을 보존하고 이미지(placeholder PDF 캡처)만 제거한다.
 * - colorPairingRecommendation은 외부 참조 없음(색·로고는 렌더 시 brand-* 컬렉션에서 조립).
 * - 목표 상태면 건너뛴다(재실행 안전). 대상 문서가 없으면(빈 DB) 건너뛴다.
 *
 * 실행: pnpm payload run scripts/seed-color-pairing-recommendation.ts
 */

type Block = NonNullable<GuidelineDocument['blocks']>[number]
// biome-ignore lint/suspicious/noExplicitAny: 시드에서 블록 판별자 필드를 느슨하게 다룬다.
type AnyBlock = any

const headingMatches = (block: AnyBlock, re: RegExp): boolean =>
	block.blockType === 'contentColumns' &&
	(block.columns ?? []).some((c: AnyBlock) => re.test(String(c.heading ?? '')))

// contentColumns의 각 열에서 이미지 관련 필드만 비우고 나머지(헤딩·본문·id)는 보존한다.
const stripImages = (block: AnyBlock): AnyBlock => ({
	...block,
	columns: (block.columns ?? []).map((c: AnyBlock) => ({
		...c,
		image: null,
		imageBackgroundColor: null,
	})),
})

const grid = (variant: 'light' | 'dark'): Block =>
	({ blockType: 'colorPairingRecommendation', variant }) as Block

const payload = await getPayload({ config })

const { docs } = await payload.find({
	collection: 'guideline-documents',
	depth: 0,
	locale: 'ko',
	draft: false,
	overrideAccess: true,
	limit: 500,
})

const target = docs.find((doc) =>
	(doc.blocks ?? []).some(
		(b) =>
			b.blockType === 'colorPairing' && (b as { system?: string }).system === 'tone-in-tone',
	),
)

if (!target) {
	console.log('Tone in Tone 문서 없음 — 건너뜀(가이드라인 문서 시드 필요)')
} else {
	const existing = (target.blocks ?? []) as AnyBlock[]
	const tool = existing.find((b) => b.blockType === 'colorPairing')
	const lightCopy = existing.find((b) => headingMatches(b, /light/i))
	const darkCopy = existing.find((b) => headingMatches(b, /dark/i))

	// 목표 순서 조립: 툴 → Light설명(이미지제거) → light그리드 → Dark설명(이미지제거) → dark그리드.
	// 그 외 블록(있다면)은 뒤에 원래 순서로 붙여 보존한다.
	const used = new Set([tool, lightCopy, darkCopy].filter(Boolean))
	const rest = existing.filter(
		(b) => !used.has(b) && b.blockType !== 'colorPairingRecommendation',
	)
	const nextBlocks = [
		tool,
		lightCopy && stripImages(lightCopy),
		grid('light'),
		darkCopy && stripImages(darkCopy),
		grid('dark'),
		...rest,
	].filter(Boolean) as Block[]

	await payload.update({
		collection: 'guideline-documents',
		id: target.id,
		locale: 'ko',
		draft: false,
		overrideAccess: true,
		data: { _status: 'published', blocks: nextBlocks },
	})
	console.log(
		`doc ${target.id}: Tone in Tone 구성 수렴(설명+추천 그리드, placeholder 이미지 제거)`,
	)
}
