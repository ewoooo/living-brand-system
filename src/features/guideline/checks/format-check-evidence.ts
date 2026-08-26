import { calloutKindLabel } from '../blocks/callout/projection'
import type { CheckEvidence } from '../blocks/runtime/project-guideline-block'
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
		case 'callout':
			return compact([
				evidence.title ?? calloutKindLabel[evidence.kind],
				...evidence.items.map((item) => `- ${item}`),
			]).join('\n')
		case 'section':
			return compact([
				evidence.title,
				evidence.description,
				...evidence.blocks.map(formatCheckEvidence),
			]).join('\n\n')
		case 'block':
			return `leaf ${evidence.childCount}개를 담은 블록`
	}
}
