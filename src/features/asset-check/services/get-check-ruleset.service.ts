import { cache } from 'react'
import { hasChecker } from '@/features/asset-check/checkers/registry'
import type { CheckStatus } from '@/features/asset-check/checkers/types'
import { getCheckSourceDocuments } from '@/features/asset-check/repositories/check-ruleset.payload.repository'
import { toRuntimeCheckMessages } from '@/features/asset-check/utils/check-messages'
import {
	collectGuidelineCheckSources,
	type GuidelineCheckSource,
} from '@/features/guideline/checks/collect-guideline-check-sources'
import type { GuidelineSection, RuleChecker } from '@/payload-types'

export interface CheckReferenceAsset {
	name: string
	url: string
	mimeType: string
}

export interface RuntimeCheck {
	key: string
	title: string
	titleKo?: string
	tier?: 'recommended' | 'required'
	executor: RuleChecker['executor']
	checkerKey?: string
	model?: string
	promptKey?: string
	options?: unknown
	heuristicPrompt?: string
	/** 자동 검수 가능 여부 — deterministic인데 checker 미등록이면 false (UI 배지용). */
	implemented: boolean
	evidence: string
	referenceAssets: CheckReferenceAsset[]
	messages?: Partial<Record<CheckStatus, string>>
}

/** 검수 화면에서 Check 배치를 표시하는 가이드라인 문서 단위다. */
export interface CheckSection {
	title: string
	slug: string
	groupTitle: string
	groupSlug: string
	chapterTitle: string
	chapterSlug: string
	chapterOrder: number
	sectionTitle: string
	sectionSlug: string
	sectionOrder: number
	checks: RuntimeCheck[]
}

/**
 * 검수 화면용 Check 뷰모델을 published Section/Page와 내부 Block에서 조립한다.
 * Payload 조회는 check-ruleset repository가 소유한다.
 */
export const getCheckRuleset = cache(async (): Promise<CheckSection[]> => {
	const { sections, pages } = await getCheckSourceDocuments()
	const items = [
		...sections.map((section) => ({
			documentOrder: -1,
			item: {
				title: section.title,
				slug: section.slug ?? String(section.id),
				...toCheckPlacement(section),
				checks: collectGuidelineCheckSources(section).map(toRuntimeCheck),
			},
		})),
		...pages.map((page) => ({
			documentOrder: page.displayOrder,
			item: {
				title: page.title,
				slug: page.slug ?? String(page.id),
				...toCheckPlacement(page.section),
				checks: collectGuidelineCheckSources(page).map(toRuntimeCheck),
			},
		})),
	]

	return items
		.filter(({ item }) => item.checks.length > 0)
		.sort(
			(a, b) =>
				a.item.chapterOrder - b.item.chapterOrder ||
				a.item.sectionOrder - b.item.sectionOrder ||
				a.documentOrder - b.documentOrder,
		)
		.map(({ item }) => item)
})

/**
 * 검수 실행용 Check snapshot을 checkKeys 순서로 반환한다.
 * published source 조회는 check-ruleset repository가 소유한다.
 */
export async function getRuntimeChecks(checkKeys?: string[]): Promise<RuntimeCheck[]> {
	const checks = uniqueChecks((await getCheckRuleset()).flatMap((section) => section.checks))
	if (!checkKeys) return checks
	const order = new Map(checkKeys.map((key, index) => [key, index]))

	return checks
		.filter((check) => order.has(check.key))
		.sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0))
}

function toRuntimeCheck({ check, evidence, referenceAssets }: GuidelineCheckSource): RuntimeCheck {
	const checker = typeof check.checker === 'object' ? check.checker : null
	if (!checker) throw new Error(`RuleChecker가 연결되지 않은 Check입니다: ${check.key}`)
	const checkerKey = checker.checkerKey ?? undefined
	const model = checker.model ?? undefined
	const promptKey = checker.promptKey ?? undefined
	const options = checker.executor === 'deterministic' ? (check.options ?? undefined) : undefined
	const heuristicPrompt =
		checker.executor === 'heuristic' && check.heuristicPrompt?.trim()
			? check.heuristicPrompt.trim()
			: undefined
	const implemented =
		checker.executor === 'deterministic'
			? Boolean(checkerKey && hasChecker(checkerKey, options))
			: checker.executor === 'heuristic'
				? Boolean(model && promptKey)
				: true

	return {
		key: check.key,
		title: check.title,
		titleKo: check.titleKo?.trim() || undefined,
		tier: check.tier ?? undefined,
		executor: checker.executor,
		checkerKey,
		model,
		promptKey,
		options,
		heuristicPrompt,
		implemented,
		evidence,
		referenceAssets: referenceAssets.flatMap((asset) =>
			asset.url && asset.mimeType
				? [{ name: asset.name, url: asset.url, mimeType: asset.mimeType }]
				: [],
		),
		messages:
			checker.executor === 'heuristic' ? undefined : toRuntimeCheckMessages(check.messages),
	}
}

function uniqueChecks(checks: RuntimeCheck[]): RuntimeCheck[] {
	const byKey = new Map<string, RuntimeCheck>()
	for (const check of checks) {
		if (byKey.has(check.key)) {
			throw new Error(`중복된 Check key입니다: ${check.key}`)
		}
		byKey.set(check.key, check)
	}
	return [...byKey.values()]
}

function toCheckPlacement(section: number | GuidelineSection) {
	if (typeof section === 'number') {
		return {
			groupTitle: 'Check',
			groupSlug: 'check',
			chapterTitle: 'Check',
			chapterSlug: 'check',
			chapterOrder: 0,
			sectionTitle: 'Check',
			sectionSlug: 'check',
			sectionOrder: 0,
		}
	}
	const sectionSlug = section.slug ?? String(section.id)
	const chapter = typeof section.chapter === 'number' ? null : section.chapter
	const chapterTitle = chapter?.title ?? section.title
	const chapterSlug = chapter?.slug ?? sectionSlug

	return {
		groupTitle: section.title,
		groupSlug: sectionSlug,
		chapterTitle,
		chapterSlug,
		chapterOrder: chapter?.displayOrder ?? 0,
		sectionTitle: section.title,
		sectionSlug,
		sectionOrder: section.displayOrder,
	}
}
