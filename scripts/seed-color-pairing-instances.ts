import config from '@payload-config'
import { getPayload } from 'payload'
import type { GuidelineDocument } from '@/payload-types'

/**
 * Color System 하위 문서(Tone in/on/Mono)에 colorPairing 블록을 배치한다.
 * - 각 문서를 목표 구성으로 조정: doc 45 = colorPairing(tone-in) + 기존 안내 컬럼 2개,
 *   doc 46/47 = colorPairing 단독(자리표시용 텍스트 컬럼 제거).
 * - colorPairing 블록은 외부 참조가 없다(색·로고·아이콘은 렌더 시 brand-* 컬렉션에서 조립).
 * - 이미 목표 구성이면 건너뛴다(재실행 안전). 유지 블록은 id로 매칭돼 다른 locale 값이 보존된다.
 * - 문서가 없으면(빈 DB) 건너뛴다 — 가이드라인 문서 시드 이후 실행하는 것을 전제한다.
 *
 * 실행: pnpm payload run scripts/seed-color-pairing-instances.ts
 */

type Block = NonNullable<GuidelineDocument['blocks']>[number]
type ColorPairingSystem = 'tone-in-tone' | 'tone-on-tone' | 'mono-tone'

const PLAN: { docId: number; system: ColorPairingSystem; keepIds: string[] }[] = [
	{
		docId: 45,
		system: 'tone-in-tone',
		keepIds: ['6a4f79604377e66a665d82c6', '6a4f79604377e66a665d82c8'],
	},
	{ docId: 46, system: 'tone-on-tone', keepIds: [] },
	{ docId: 47, system: 'mono-tone', keepIds: [] },
]

const payload = await getPayload({ config })

let applied = 0
let skipped = 0

for (const plan of PLAN) {
	let doc: GuidelineDocument
	try {
		doc = await payload.findByID({
			collection: 'guideline-documents',
			id: plan.docId,
			depth: 0,
			locale: 'ko',
			draft: false,
			overrideAccess: true,
		})
	} catch {
		console.log(`doc ${plan.docId}: 문서 없음 — 건너뜀(가이드라인 문서 시드 필요)`)
		skipped++
		continue
	}

	const existing = (doc.blocks ?? []) as Block[]
	const nonCp = existing.filter((b) => b.blockType !== 'colorPairing')
	const cp = existing.filter((b) => b.blockType === 'colorPairing')
	const keptOk =
		nonCp.length === plan.keepIds.length &&
		nonCp.every((b) => plan.keepIds.includes(String(b.id)))
	const cpOk = cp.length === 1 && (cp[0] as { system?: string }).system === plan.system
	if (keptOk && cpOk) {
		skipped++
		continue
	}

	const kept = existing.filter((b) => plan.keepIds.includes(String(b.id)))
	if (kept.length !== plan.keepIds.length) {
		console.log(
			`doc ${plan.docId}: 유지 대상 블록 누락(기대 ${plan.keepIds.length}, 발견 ${kept.length}) — 건너뜀`,
		)
		skipped++
		continue
	}

	const colorPairing = { blockType: 'colorPairing', system: plan.system } as Block
	await payload.update({
		collection: 'guideline-documents',
		id: plan.docId,
		locale: 'ko',
		draft: false,
		overrideAccess: true,
		data: { _status: 'published', blocks: [colorPairing, ...kept] },
	})
	applied++
	console.log(`doc ${plan.docId}: colorPairing(${plan.system}) 반영`)
}

console.log(`\n완료 — 반영 ${applied}개, 건너뜀 ${skipped}개`)
