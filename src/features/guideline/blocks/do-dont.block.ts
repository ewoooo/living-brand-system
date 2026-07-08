import { compact } from '../utils/block-text'
import type { BlockBehavior } from './types'

const idOf = (value: unknown): number | null =>
	typeof value === 'number'
		? value
		: value && typeof value === 'object' && 'id' in value
			? ((value as { id: number }).id ?? null)
			: null

// Do/Don't 블록. 카테고리(그룹)마다 룰이 다르므로(1:N) 그룹 단위로 룰을 파생한다.
export const behavior: BlockBehavior = {
	formatForAgent: (block) => {
		if (block.blockType !== 'doDont') return ''
		return compact([
			block.title ?? 'Do/Don’t',
			...(block.groups ?? []).flatMap((group) =>
				compact([
					group.category,
					...(group.examples ?? []).map(
						(example) =>
							`${example.kind === 'do' ? '권장' : '금지'}: ${example.caption ?? ''}`,
					),
				]),
			),
		]).join('\n')
	},
	deriveRules: (block) => {
		if (block.blockType !== 'doDont') return []
		return (block.groups ?? []).flatMap((group) => {
			const rule = idOf(group.rule)
			if (rule == null) return []
			const examples = group.examples ?? []
			return [
				{
					rule,
					evidence: examples
						.map((example) =>
							`${example.kind === 'do' ? '✓' : '✗'} ${example.caption ?? ''}`.trim(),
						)
						.filter(Boolean)
						.join('\n'),
					referenceAssets: examples
						.map((example) => idOf(example.image))
						.filter((value): value is number => value != null),
				},
			]
		})
	},
}
