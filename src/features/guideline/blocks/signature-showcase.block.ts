import { compact } from '../utils/block-text'
import type { GuidelineBlock } from './types'

type SignatureShowcase = Extract<GuidelineBlock, { blockType: 'signatureShowcase' }>

export function projectSignatureShowcase(block: SignatureShowcase) {
	const signatures = (block.signatures ?? []).map((signature) => ({
		label: signature.label?.trim() || undefined,
		phrase: signature.phrase,
		note: signature.note?.trim() || undefined,
	}))

	return {
		text: compact(
			signatures.map((signature) =>
				compact([signature.label, signature.phrase, signature.note]).join('\n'),
			),
		).join('\n\n'),
		evidence: { type: 'signatureShowcase' as const, signatures },
		referenceAssets: [],
	}
}
