import type { GuidelineDocument } from '@/payload-types'
import { formatBlockForAgent } from '../blocks/runtime/project-guideline-block'
import { compact } from './block-text'
import { extractTextFromLexical } from './lexical-text'

export interface GuidelineSearchRuleSummary {
	key: string
	title: string
}

/** 발행 가이드라인의 검색 대상을 localized 평문으로 평탄화한다. Rule 요약은 호출자가 조회해 전달한다. */
export function buildGuidelineSearchText(
	document: GuidelineDocument,
	rules: GuidelineSearchRuleSummary[] = [],
): string {
	return compact([
		document.title,
		document.label,
		document.slug,
		typeof document.chapter === 'object' && document.chapter ? document.chapter.title : null,
		extractTextFromLexical(document.description),
		...(document.blocks?.map(formatBlockForAgent) ?? []),
		...rules.map(({ key, title }) => `${key} ${title}`),
	]).join('\n')
}
