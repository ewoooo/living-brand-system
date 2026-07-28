import type { GuidelineBlock } from '../types'
import { PAIRING_RECOMMENDATIONS } from './recommendations'

type ColorPairingRecommendation = Extract<
	GuidelineBlock,
	{ blockType: 'colorPairingRecommendation' }
>

// 추천 조합은 정적 큐레이션이라 CMS 참조 자산이 없다. 근거 텍스트는 제목 + 버전·조합 수.
export function projectColorPairingRecommendation(block: ColorPairingRecommendation) {
	const title = block.title?.trim() || undefined
	const count = PAIRING_RECOMMENDATIONS[block.variant]?.length ?? 0
	return {
		text: [title, `Tone in Tone 페어링 추천 (${block.variant}) · ${count}종`]
			.filter((v): v is string => Boolean(v))
			.join('\n'),
		evidence: {
			type: 'colorPairingRecommendation' as const,
			title,
			variant: block.variant,
		},
		referenceAssets: [],
	}
}

export default projectColorPairingRecommendation
