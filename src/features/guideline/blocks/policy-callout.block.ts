import { compact } from '../utils/block-text'
import type { GuidelineBlock } from './types'

type PolicyCallout = Extract<GuidelineBlock, { blockType: 'policyCallout' }>

export const policyKindLabel = { must: '반드시', recommended: '권장', dont: '금지' } as const

export function projectPolicyCallout(block: PolicyCallout) {
	const items = (block.items ?? []).map((item) => item.text)
	const title = block.title?.trim() || undefined

	return {
		text: compact([title ?? policyKindLabel[block.kind], ...items]).join('\n'),
		evidence: {
			type: 'policyCallout' as const,
			kind: block.kind,
			title,
			items,
		},
		referenceAssets: [],
	}
}
