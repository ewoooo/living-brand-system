import type { GuidelineDocument } from '@/payload-types'
import { formatBlockForAgent } from '../blocks/registry'
import { compact } from './block-text'
import { extractTextFromLexical } from './lexical-text'

/** 발행 가이드라인의 검색 대상을 localized 평문으로 평탄화한다. */
export function buildGuidelineSearchText(document: GuidelineDocument): string {
	const checks = [
		...(document.checks ?? []),
		...(document.blocks ?? []).flatMap((block) => block.checks ?? []),
	]

	return compact([
		document.title,
		document.label,
		document.slug,
		document.breadcrumbs?.map(({ label }) => label).join(' '),
		extractTextFromLexical(document.description),
		...(document.blocks?.map(formatBlockForAgent) ?? []),
		...checks.map(({ key, title }) => `${key} ${title}`),
	]).join('\n')
}
