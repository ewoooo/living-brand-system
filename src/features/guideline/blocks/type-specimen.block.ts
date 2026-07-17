import { compact } from '../utils/block-text'
import type { GuidelineBlock } from './types'

type TypeSpecimen = Extract<GuidelineBlock, { blockType: 'typeSpecimen' }>

export function projectTypeSpecimen(block: TypeSpecimen) {
	const typeface =
		typeof block.typeface === 'object' && block.typeface !== null
			? { name: block.typeface.name, familyName: block.typeface.familyName }
			: undefined
	const samples = {
		word: block.samples?.word?.trim() || undefined,
		sentence: block.samples?.sentence?.trim() || undefined,
		paragraph: block.samples?.paragraph?.trim() || undefined,
	}

	return {
		text: compact([typeface?.name, samples.word, samples.sentence, samples.paragraph]).join(
			'\n',
		),
		evidence: { type: 'typeSpecimen' as const, typeface, samples },
		referenceAssets: [],
	}
}
