import { compact, formatImage, relationshipId } from '../../utils/block-text'
import { extractTextFromLexical } from '../../utils/lexical-text'
import type { GuidelineBlock } from '../types'

type LogoGroupViewer = Extract<GuidelineBlock, { blockType: 'logoGroupViewer' }>

export function projectLogoGroupViewer(block: LogoGroupViewer) {
	const title = block.title?.trim() || undefined
	const logoText = (block.logos ?? []).map((row) =>
		compact([row.label, formatImage(row.logo)]).join(' '),
	)
	const topicsText = (block.topics ?? []).map((topic) =>
		compact([topic.label, extractTextFromLexical(topic.description)]).join('\n'),
	)
	const ids = (block.logos ?? [])
		.flatMap((row) => [row.logo, row.registeredMark, row.clearSpaceGuide])
		.map((image) => relationshipId(image))
		.filter((id): id is number => id != null)

	return {
		text: compact([title ?? 'Logo group viewer', ...logoText, ...topicsText]).join('\n'),
		evidence: { type: 'logoGroupViewer' as const, title },
		referenceAssets: ids.map((id) => ({ id, role: 'context' as const })),
	}
}

export default projectLogoGroupViewer
