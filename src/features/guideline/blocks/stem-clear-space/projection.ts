import { compact, relationshipId } from '../../utils/block-text'
import type { GuidelineBlock } from '../types'

type StemClearSpace = Extract<GuidelineBlock, { blockType: 'stemClearSpace' }>

export function projectStemClearSpace(block: StemClearSpace) {
	const title = block.title?.trim() || undefined
	const n = block.multiplier ?? 3
	const logoId = relationshipId(block.logo)

	return {
		text: compact([
			title ?? 'Logo clear space',
			`최소 여백 ${n}A (A = 로고 수직 줄기 두께)`,
		]).join('\n'),
		evidence: { type: 'stemClearSpace' as const, title, multiplier: n },
		referenceAssets: logoId != null ? [{ id: logoId, role: 'context' as const }] : [],
	}
}

export default projectStemClearSpace
