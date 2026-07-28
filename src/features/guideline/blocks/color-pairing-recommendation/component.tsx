import config from '@payload-config'
import { getPayload } from 'payload'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import type { BrandColor, GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { PAIRING_RECOMMENDATIONS } from './recommendations'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type ColorPairingRecommendation = Extract<
	GuidelineBlock,
	{ blockType: 'colorPairingRecommendation' }
>

// brand-colors → `colorGroup-tone` 키(color-pairing과 동일 규약). 추천 데이터가 이 키로 색을 참조한다.
function colorKey(c: BrandColor): string | null {
	return c.colorGroup && c.tone != null ? `${c.colorGroup}-${c.tone}` : null
}

const COLS = 8

/**
 * 컬러 페어링 추천 블록(서버) — Tone in Tone 큐레이션 40종을 8×5 타일 그리드로 전시한다.
 * 각 타일 = 배경색 + 그 위 단색 워드마크(CSS mask로 재색). 인터랙션 없는 정적 차트(원본 p27/p28).
 * 브랜드 무관: 색은 brand-colors에서 키로 해석, 워드마크는 brand-logos에서 stacked 우선 폴백 조회.
 */
export async function ColorPairingRecommendationBlock({
	block,
}: {
	block: ColorPairingRecommendation
}) {
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

	const tiles = PAIRING_RECOMMENDATIONS[block.variant] ?? []

	return (
		<GuidelineBlockFrame layout="padded" label={block.title ?? undefined}>
			{block.title ? <GuidelineHeader variant="block" title={block.title} /> : null}
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
		</GuidelineBlockFrame>
	)
}

export default ColorPairingRecommendationBlock
