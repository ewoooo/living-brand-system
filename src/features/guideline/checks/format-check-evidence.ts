import { calloutKindLabel } from '../blocks/callout.block'
import type { CheckEvidence } from '../blocks/catalog'
import { kindLabel } from '../blocks/do-dont.block'
import { compact } from '../utils/block-text'

/** 구조화 evidence를 기존 평문 소비 경계에 맞게 변환한다. */
export function formatCheckEvidence(evidence: CheckEvidence | string): string {
	if (typeof evidence === 'string') return evidence

	// 동결된 CheckSession rulesetSnapshot에는 개명 전 'columnUnit' 판별자가 남아 있다.
	if ((evidence as { type: string }).type === 'columnUnit') {
		return formatCheckEvidence({ ...evidence, type: 'contentColumns' } as CheckEvidence)
	}
	// 동결된 CheckSession rulesetSnapshot에는 개명 전 'policyCallout' 판별자가 남아 있다.
	if ((evidence as { type: string }).type === 'policyCallout') {
		return formatCheckEvidence({ ...evidence, type: 'callout' } as CheckEvidence)
	}

	switch (evidence.type) {
		case 'document':
			return compact([
				evidence.description,
				...evidence.blocks.map(formatCheckEvidence),
			]).join('\n\n')
		case 'contentColumns':
			return evidence.columns
				.map((column) => compact([column.heading, column.body]).join('\n'))
				.filter(Boolean)
				.join('\n\n')
		case 'carousel':
			return evidence.slides
				.map((slide) => slide.caption)
				.filter(Boolean)
				.join('\n')
		case 'mediaShowcase':
			return 'Media showcase'
		case 'colorPalette':
			return compact([
				evidence.title ?? 'Color palette',
				...evidence.colors.map(
					(color) =>
						`- ${color.name}: HEX ${color.hex}${color.pantone ? `, PMS ${color.pantone}` : ''}`,
				),
			]).join('\n')
		case 'doDont':
			return compact([
				evidence.title ?? 'Do/Don’t',
				...evidence.groups.flatMap((group) =>
					compact([
						group.category,
						group.description,
						...group.examples.map(
							(example) => `${kindLabel[group.kind]}: ${example.caption ?? ''}`,
						),
					]),
				),
			]).join('\n')
		case 'callout':
			return compact([
				evidence.title ?? calloutKindLabel[evidence.kind],
				...evidence.items.map((item) => `- ${item}`),
			]).join('\n')
		case 'specList':
			return compact(
				evidence.groups.map((group) =>
					compact([
						group.label,
						...group.specs.map((spec) => `- ${spec.key}: ${spec.value}`),
					]).join('\n'),
				),
			).join('\n\n')
		case 'signatureShowcase':
			return compact(
				evidence.signatures.map((signature) =>
					compact([signature.label, signature.phrase, signature.note]).join('\n'),
				),
			).join('\n\n')
		case 'typeSpecimen':
			return compact([
				evidence.typeface?.name,
				evidence.samples.word,
				evidence.samples.sentence,
				evidence.samples.paragraph,
			]).join('\n')
		case 'typeScale':
			return compact([
				evidence.typeface?.name,
				...evidence.items.map(
					(item) =>
						`- ${item.name}: ${item.sizePx}/${item.lineHeightPx} · ${item.weight}`,
				),
			]).join('\n')
		case 'layoutGrid':
			return compact(
				evidence.variants.map((variant) =>
					compact([
						variant.label,
						`- Columns: ${variant.columns}`,
						variant.gutter ? `- Gutter: ${variant.gutter}` : undefined,
						variant.margin ? `- Margin: ${variant.margin}` : undefined,
					]).join('\n'),
				),
			).join('\n\n')
		case 'glyphGrid':
			return compact([evidence.title ?? 'Glyph grid', evidence.typeface?.name]).join('\n')
	}
}
