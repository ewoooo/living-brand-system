import type { CheckEvidence } from '../blocks/runtime/project-guideline-block'
import { compact } from '../utils/block-text'

/**
 * 동결된 CheckSession rulesetSnapshot에만 남아 있는 근거 꼴. 만든 블록은 지워졌지만(콜아웃·콘텐츠 열은
 * 2026-09-04, 개명 전 판별자 columnUnit·policyCallout은 그 이전) 스냅샷은 그대로이므로 읽는 자리만
 * 유지한다. 새로 만들지 않는다.
 */
type FrozenEvidence =
	| { type: 'contentColumns' | 'columnUnit'; columns: { heading?: string; body?: string }[] }
	| { type: 'callout' | 'policyCallout'; kind: string; title?: string; items: string[] }

const CALLOUT_KIND_LABEL: Record<string, string> = {
	must: '반드시',
	recommended: '권장',
	dont: '금지',
}
const FROZEN_TYPES = new Set(['contentColumns', 'columnUnit', 'callout', 'policyCallout'])

function formatFrozenEvidence(evidence: FrozenEvidence): string {
	switch (evidence.type) {
		case 'contentColumns':
		case 'columnUnit':
			return evidence.columns
				.map((column) => compact([column.heading, column.body]).join('\n'))
				.filter(Boolean)
				.join('\n\n')
		case 'callout':
		case 'policyCallout':
			return compact([
				evidence.title ?? CALLOUT_KIND_LABEL[evidence.kind],
				...evidence.items.map((item) => `- ${item}`),
			]).join('\n')
	}
}

/** 구조화 evidence를 기존 평문 소비 경계에 맞게 변환한다. */
export function formatCheckEvidence(evidence: CheckEvidence | string): string {
	if (typeof evidence === 'string') return evidence
	if (FROZEN_TYPES.has(evidence.type)) return formatFrozenEvidence(evidence as never)

	switch (evidence.type) {
		case 'document':
			return compact([
				evidence.description,
				...evidence.blocks.map(formatCheckEvidence),
			]).join('\n\n')
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
