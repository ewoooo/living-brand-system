import { compact, formatImage, relationshipId } from '../../utils/block-text'
import { extractTextFromLexical } from '../../utils/lexical-text'
import type { GuidelineBlock } from '../types'

type LogoViewer = Extract<GuidelineBlock, { blockType: 'logoViewer' }>

export function projectLogoViewer(block: LogoViewer) {
	const title = block.title?.trim() || undefined
	const topicsText = (block.topics ?? []).map((topic) =>
		compact([topic.label, extractTextFromLexical(topic.description)]).join('\n'),
	)
	const ids = [block.logo, block.registeredMark, block.clearSpaceGuide]
		.map((image) => relationshipId(image))
		.filter((id): id is number => id != null)

	return {
		text: compact([title ?? 'Logo viewer', formatImage(block.logo), ...topicsText]).join('\n'),
		evidence: { type: 'logoViewer' as const, title },
		referenceAssets: ids.map((id) => ({ id, role: 'context' as const })),
	}
}

export default projectLogoViewer
