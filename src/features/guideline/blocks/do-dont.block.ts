import { compact, relationshipId } from '../utils/block-text'
import type { CheckReferenceAssetRole, GuidelineBlock } from './types'

export const kindLabel = { do: '권장', ok: '허용', dont: '금지' } as const

// ok는 통과 가능한 예시라 검수 참조자산에서도 positive로 취급한다.
const kindRole: Record<keyof typeof kindLabel, CheckReferenceAssetRole> = {
	do: 'positive',
	ok: 'positive',
	dont: 'negative',
}

type DoDont = Extract<GuidelineBlock, { blockType: 'doDont' }>

export function projectDoDont(block: DoDont) {
	const text = compact([
		block.title ?? 'Do/Don’t',
		...(block.groups ?? []).flatMap((group) =>
			compact([
				group.category,
				group.description,
				...(group.examples ?? []).map(
					(example) => `${kindLabel[group.kind]}: ${example.caption ?? ''}`,
				),
			]),
		),
	]).join('\n')

	return {
		text,
		evidence: {
			type: 'doDont' as const,
			title: block.title?.trim() || undefined,
			groups: (block.groups ?? []).map((group) => ({
				category: group.category?.trim() || undefined,
				description: group.description?.trim() || undefined,
				kind: group.kind,
				examples: (group.examples ?? []).map((example) => ({
					caption: example.caption?.trim() || undefined,
				})),
			})),
		},
		referenceAssets: (block.groups ?? []).flatMap((group) =>
			(group.examples ?? []).flatMap((example) => {
				const id = relationshipId(example.image)
				return id == null ? [] : [{ id, role: kindRole[group.kind] }]
			}),
		),
	}
}
