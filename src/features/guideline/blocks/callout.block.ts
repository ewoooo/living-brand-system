import { compact } from '../utils/block-text'
import type { GuidelineBlock } from './types'

type Callout = Extract<GuidelineBlock, { blockType: 'callout' }>

export const calloutKindLabel = { must: '반드시', recommended: '권장', dont: '금지' } as const

export function projectCallout(block: Callout) {
	const items = (block.items ?? []).map((item) => item.text)
	const title = block.title?.trim() || undefined

	return {
		text: compact([title ?? calloutKindLabel[block.kind], ...items]).join('\n'),
		evidence: {
			type: 'callout' as const,
			kind: block.kind,
			title,
			items,
		},
		referenceAssets: [],
	}
}
