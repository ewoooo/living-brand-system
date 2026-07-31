import config from '@payload-config'
import { getPayload } from 'payload'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { isLightColor } from '@/lib/color'
import type { BrandColor, GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { buildPairs, type PairingSwatch, type PairingSystemKey } from './pairings'
import { ColorPairingView } from './view'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type ColorPairing = Extract<GuidelineBlock, { blockType: 'colorPairing' }>

// 색 key: 유채색 = '계열-톤'(red-3), 무채색(white/black) = 명도로 main-white/main-black.
// 페어링 규칙(pairings.ts)과 뷰가 이 key로 색을 참조한다.
function colorKey(c: BrandColor): string {
	if (c.tone != null && c.colorGroup) return `${c.colorGroup}-${c.tone}`
	return isLightColor(c.hex) ? 'main-white' : 'main-black'
}

// 시스템별 초기 배경(있으면). 없으면 첫 배경 후보로 폴백.
const PREFERRED_BG: Record<PairingSystemKey, string> = {
	'tone-in-tone': 'blue-1',
	'tone-on-tone': 'blue-1',
	'mono-tone': 'blue-4',
}

/**
 * 컬러 페어링 블록(서버) — brand-colors로 팔레트 행 + 병용 테이블을 조립하고,
 * brand-logos(가로 로고)·brand-icons(6종)를 조회해 클라이언트 뷰에 넘긴다.
 * 매핑은 현재 rule-derived(pairings.ts). Phase 2에서 Payload color-pairings 컬렉션으로 이관.
 */
export async function ColorPairingBlock({ block }: { block: ColorPairing }) {
	const payload = await getPayload({ config })
	const [colorsRes, logosRes, iconsRes] = await Promise.all([
		payload.find({ collection: 'brand-colors', limit: 200, depth: 0, sort: 'createdAt' }),
		payload.find({ collection: 'brand-logos', limit: 10, depth: 0 }),
		payload.find({ collection: 'brand-icons', limit: 6, depth: 0, sort: 'createdAt' }),
	])
	const colors = colorsRes.docs

	// 페어링 규칙 입력(전체 색 유니버스).
	const pairingSwatches: PairingSwatch[] = colors.map((c) => ({
		key: colorKey(c),
		family: c.tone != null ? (c.colorGroup ?? 'unknown') : 'neutral',
		tone: c.tone ?? null,
		hex: c.hex,
	}))
	const system = block.system as PairingSystemKey
	const pairs = buildPairs(pairingSwatches, system)

	// 팔레트 행: 무채색(white/black) 한 행 + 계열별(등장 순서) 톤 오름차순 행.
	const toMini = (c: BrandColor) => ({ id: colorKey(c), hex: c.hex, name: c.name })
	const neutrals = colors.filter((c) => c.tone == null)
	const familyOrder: string[] = []
	const byFamily = new Map<string, BrandColor[]>()
	for (const c of colors) {
		if (c.tone == null || !c.colorGroup) continue
		if (!byFamily.has(c.colorGroup)) {
			byFamily.set(c.colorGroup, [])
			familyOrder.push(c.colorGroup)
		}
		byFamily.get(c.colorGroup)?.push(c)
	}
	const rows = [
		neutrals.map(toMini),
		...familyOrder.map((f) =>
			[...(byFamily.get(f) ?? [])].sort((a, b) => (a.tone ?? 0) - (b.tone ?? 0)).map(toMini),
		),
	].filter((row) => row.length > 0)

	// 초기 선택: 배경(선호값 있으면) + 그 배경의 첫 추천 전경.
	const bgId = pairs[PREFERRED_BG[system]] ? PREFERRED_BG[system] : (Object.keys(pairs)[0] ?? '')
	const entry = pairs[bgId]
	const fgId = entry?.recommended[0] ?? entry?.usable[0] ?? ''

	const logo = logosRes.docs.find((l) => l.filename?.includes('horizontal')) ?? logosRes.docs[0]
	const logoSrc = logo?.url ?? `/api/brand-logos/file/${logo?.filename ?? ''}`
	const iconSrcs = iconsRes.docs.map((i) => i.url ?? `/api/brand-icons/file/${i.filename}`)

	return (
		<GuidelineBlockFrame layout="padded" label={block.title ?? undefined}>
			{block.title ? <GuidelineHeader variant="block" title={block.title} /> : null}
			<ColorPairingView
				rows={rows}
				pairs={pairs}
				logoSrc={logoSrc}
				iconSrcs={iconSrcs}
				wordmark="Essenherb"
				defaultBgId={bgId}
				defaultFgId={fgId}
			/>
		</GuidelineBlockFrame>
	)
}

export default ColorPairingBlock
