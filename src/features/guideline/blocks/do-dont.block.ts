import { compact, relationshipId } from '../utils/block-text'
import type { BlockBehavior, GuidelineBlock } from './types'

function format(block: GuidelineBlock): string {
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
}

export const behavior: BlockBehavior = {
	formatForAgent: format,
	toCheckSourceSnapshot: (block) => {
		if (block.blockType !== 'doDont') return { evidence: '', referenceAssets: [] }
		return {
			evidence: format(block),
			referenceAssets: (block.groups ?? [])
				.flatMap((group) => group.examples ?? [])
				.flatMap((example) => {
					const id = relationshipId(example.image)
					return id == null
						? []
						: [
								{
									id,
									role:
										example.kind === 'do'
											? ('positive' as const)
											: ('negative' as const),
								},
							]
				}),
		}
	},
}
