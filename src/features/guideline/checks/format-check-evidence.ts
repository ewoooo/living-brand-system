import { kindLabel } from '../blocks/do-dont.block'
import { compact } from '../utils/block-text'
import type { CheckEvidence } from './check-source'

/** 구조화 evidence를 기존 평문 소비 경계에 맞게 변환한다. */
export function formatCheckEvidence(evidence: CheckEvidence | string): string {
	if (typeof evidence === 'string') return evidence

	switch (evidence.type) {
		case 'document':
			return compact([
				evidence.description,
				...evidence.blocks.map(formatCheckEvidence),
			]).join('\n\n')
		case 'columnUnit':
			return evidence.columns
				.map((column) => compact([column.heading, column.body]).join('\n'))
				.filter(Boolean)
				.join('\n\n')
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
	}
}
