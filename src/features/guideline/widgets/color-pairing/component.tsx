import config from '@payload-config'
import { getPayload } from 'payload'
import {
	buildPairs,
	type PairingSwatch,
	type PairingSystemKey,
} from '@/features/guideline/blocks/color-pairing/pairings'
import { ColorPairingView } from '@/features/guideline/blocks/color-pairing/view'
import { isLegacyEssenherbColor, isLightColor } from '@/lib/color'
import type { BrandColor } from '@/payload-types'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/color-pairing) 통째 삭제.
//
// 위젯(서버): brand-colors/brand-logos/brand-icons를 조회해 페어링 테이블을 조립하고
// ColorPairingView(클라 인터랙션)에 순수 props 주입. author 인스턴스(block.title/block.system) 없이
// 자족 렌더 — 프레임/텍스트는 컨테이너 Block이 소유하므로 위젯은 시각/인터랙션만.
// 조립 로직·default는 blocks/color-pairing/component.tsx와 동일(system은 블록 폴백값 'tone-in-tone').

// 색 key: 유채색 = '계열-톤'(red-3), 무채색(white/black) = 명도로 main-white/main-black.
function colorKey(c: BrandColor): string {
	if (c.tone != null && c.colorGroup) return `${c.colorGroup}-${c.tone}`
	return isLightColor(c.hex) ? 'main-white' : 'main-black'
}

const DEFAULT_SYSTEM: PairingSystemKey = 'tone-in-tone'

// 시스템별 초기 배경(있으면). 없으면 첫 배경 후보로 폴백.
const PREFERRED_BG: Record<PairingSystemKey, string> = {
	'tone-in-tone': 'blue-1',
	'tone-on-tone': 'blue-1',
	'mono-tone': 'blue-4',
}

export async function ColorPairingWidget() {
	const payload = await getPayload({ config })
	const [colorsRes, logosRes, iconsRes] = await Promise.all([
		payload.find({ collection: 'brand-colors', limit: 200, depth: 0, sort: 'createdAt' }),
		payload.find({ collection: 'brand-logos', limit: 10, depth: 0 }),
		payload.find({ collection: 'brand-icons', limit: 6, depth: 0, sort: 'createdAt' }),
	])
	// 🔴 essenherb 팔레트로 스코프를 좁힌다(blocks/color-pairing과 동일 이유 — HD 색은 tone이
	//    없어 무채색으로 뭉쳐 표를 오염시킨다).
	const colors = colorsRes.docs.filter(isLegacyEssenherbColor)

	// 페어링 규칙 입력(전체 색 유니버스).
	const pairingSwatches: PairingSwatch[] = colors.map((c) => ({
		key: colorKey(c),
		family: c.tone != null ? (c.colorGroup ?? 'unknown') : 'neutral',
		tone: c.tone ?? null,
		hex: c.hex,
	}))
	const system = DEFAULT_SYSTEM
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
		<ColorPairingView
			rows={rows}
			pairs={pairs}
			logoSrc={logoSrc}
			iconSrcs={iconSrcs}
			wordmark="Essenherb"
			defaultBgId={bgId}
			defaultFgId={fgId}
		/>
	)
}

export default ColorPairingWidget
