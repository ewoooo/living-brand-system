import { compact } from '../utils/block-text'
import type { GuidelineBlock } from './types'

type SpecList = Extract<GuidelineBlock, { blockType: 'specList' }>

export function projectSpecList(block: SpecList) {
	const groups = (block.groups ?? []).map((group) => ({
		label: group.label?.trim() || undefined,
		specs: (group.specs ?? []).map((spec) => ({ key: spec.key, value: spec.value })),
	}))

	return {
		text: compact(
			groups.map((group) =>
				compact([
					group.label,
					...group.specs.map((spec) => `${spec.key}: ${spec.value}`),
				]).join('\n'),
			),
		).join('\n\n'),
		evidence: { type: 'specList' as const, groups },
		referenceAssets: [],
	}
}
