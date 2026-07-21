import { compact } from '../../utils/block-text'
import type { GuidelineBlock } from '../types'

type TypeScale = Extract<GuidelineBlock, { blockType: 'typeScale' }>

export function projectTypeScale(block: TypeScale) {
	const typeface =
		typeof block.typeface === 'object' && block.typeface !== null
			? { name: block.typeface.name, familyName: block.typeface.familyName }
			: undefined
	const items = (block.items ?? []).map((item) => ({
		name: item.name,
		sizePx: item.sizePx,
		lineHeightPx: item.lineHeightPx,
		weight: item.weight,
	}))

	return {
		text: compact([
			typeface?.name,
			...items.map(
				(item) => `${item.name}: ${item.sizePx}/${item.lineHeightPx} · ${item.weight}`,
			),
		]).join('\n'),
		evidence: { type: 'typeScale' as const, typeface, items },
		referenceAssets: [],
	}
}

export default projectTypeScale
