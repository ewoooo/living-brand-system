import config from '@payload-config'
import { getPayload } from 'payload'
import { PAIRING_RECOMMENDATIONS } from '@/features/guideline/blocks/color-pairing-recommendation/recommendations'
import type { BrandColor } from '@/payload-types'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/color-pairing-recommendation) 통째 삭제.
//
// 위젯(서버): brand-colors(색 키) + brand-logos(워드마크)를 조립해 Tone in Tone 추천 그리드를 렌더한다.
// author 인스턴스(title/variant) 없이 자족 — variant는 블록 defaultValue인 'light' 대표값 고정, 프레임/헤더는 컨테이너 Block 소유.
// 조립·그리드 마크업은 blocks/color-pairing-recommendation/component.tsx와 동일(별도 view 파일 없음).

// brand-colors → `colorGroup-tone` 키(color-pairing과 동일 규약). 추천 데이터가 이 키로 색을 참조한다.
function colorKey(c: BrandColor): string | null {
	return c.colorGroup && c.tone != null ? `${c.colorGroup}-${c.tone}` : null
}

const COLS = 8
const VARIANT = 'light' as const

export async function ColorPairingRecommendationWidget() {
	const payload = await getPayload({ config })
	const [colorsRes, logosRes] = await Promise.all([
		payload.find({ collection: 'brand-colors', limit: 200, depth: 0 }),
		payload.find({ collection: 'brand-logos', limit: 10, depth: 0 }),
	])

	const hexByKey = new Map<string, string>()
	for (const c of colorsRes.docs) {
		const key = colorKey(c)
		if (key) hexByKey.set(key, c.hex)
	}

	// 원본은 stacked(세로) 워드마크. 있으면 그걸, 없으면 아무 로고로 폴백(color-pairing과 동일 graceful).
	const logo =
		logosRes.docs.find((l) => /vertical|stack/i.test(l.filename ?? '')) ?? logosRes.docs[0]
	const logoSrc = logo?.url ?? `/api/brand-logos/file/${logo?.filename ?? ''}`

	const tiles = PAIRING_RECOMMENDATIONS[VARIANT] ?? []

	return (
		<div
			className="grid gap-2"
			style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
		>
			{tiles.map((tile, i) => {
				const bg = hexByKey.get(tile.bg) ?? 'transparent'
				const fg = hexByKey.get(tile.logo) ?? 'currentColor'
				return (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: 정적 큐레이션 순서가 곧 그리드 위치라 안정적.
						key={`${tile.bg}-${tile.logo}-${i}`}
						className="grid aspect-square place-items-center p-[18%]"
						style={{ backgroundColor: bg }}
					>
						<div
							role="img"
							aria-label={`${tile.bg} 배경 · ${tile.logo} 로고`}
							className="h-full w-full"
							style={{
								backgroundColor: fg,
								maskImage: `url(${logoSrc})`,
								maskRepeat: 'no-repeat',
								maskPosition: 'center',
								maskSize: 'contain',
								WebkitMaskImage: `url(${logoSrc})`,
								WebkitMaskRepeat: 'no-repeat',
								WebkitMaskPosition: 'center',
								WebkitMaskSize: 'contain',
							}}
						/>
					</div>
				)
			})}
		</div>
	)
}

export default ColorPairingRecommendationWidget
