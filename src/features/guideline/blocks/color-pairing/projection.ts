import type { GuidelineBlock } from '../types'
import { PAIRING_SYSTEMS } from './pairings'

type ColorPairing = Extract<GuidelineBlock, { blockType: 'colorPairing' }>

// 색·매핑은 brand-colors + 규칙에서 파생하는 인터랙티브 도구라 CMS 참조 자산이 없다. 근거는 방식 설명뿐.
export function projectColorPairing(block: ColorPairing) {
	const meta = PAIRING_SYSTEMS.find((s) => s.key === block.system)
	const title = block.title?.trim() || undefined
	return {
		text: compact([title, meta && `${meta.label} — ${meta.description}`]).join('\n'),
		evidence: {
			type: 'colorPairing' as const,
			title,
			system: block.system,
		},
		referenceAssets: [],
	}
}

function compact(values: (string | undefined)[]): string[] {
	return values.filter((v): v is string => Boolean(v))
}

export default projectColorPairing
