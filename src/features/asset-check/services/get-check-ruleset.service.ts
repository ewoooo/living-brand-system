import { cache } from 'react'
import { hasChecker, hasDeterministicChecker } from '@/features/asset-check/checkers/registry'
import type { CheckStatus } from '@/features/asset-check/checkers/types'
import { getCheckSourceDocuments } from '@/features/asset-check/repositories/check-ruleset.payload.repository'
import { toRuntimeCheckMessages } from '@/features/asset-check/utils/check-messages'
import type { CheckEvidence, CheckReferenceAssetRole } from '@/features/guideline/blocks/types'
import {
	collectGuidelineCheckSources,
	type GuidelineCheckSource,
} from '@/features/guideline/checks/collect-guideline-check-sources'
import type { GuidelineDocument, RuleChecker } from '@/payload-types'

export interface CheckReferenceAsset {
	name: string
	url: string
	mimeType: string
	role: CheckReferenceAssetRole
}

export interface CheckerSummary {
	key: string
	type: RuleChecker['executor']
	implementationKey?: string
}

export interface RuntimeCheck {
	key: string
	title: string
	titleKo?: string
	tier?: 'recommended' | 'required'
	/** 기존 CheckSession snapshot에는 없을 수 있다. 새 snapshot은 항상 포함한다. */
	source?: { documentId: number }
	/** 화면에 표시할 Checker 계약이다. */
	checker: CheckerSummary
	/** 아래 필드는 기존 CheckSession snapshot과 런타임 실행 계약이다. */
	executor: RuleChecker['executor']
	checkerKey?: string
	model?: string
	prompt?: string
	options?: unknown
	heuristicCriteria?: {
		id: string
		question: string
		expected: 'present' | 'absent'
	}[]
	heuristicPrompt?: string
	/** 자동 검수 가능 여부 — deterministic인데 checker 미등록이면 false (UI 배지용). */
	implemented: boolean
	/** string은 기존 CheckSession snapshot 조회 호환용이다. */
	evidence: CheckEvidence | string
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
 * 검수 화면용 Check 뷰모델을 published 통합 문서와 내부 Block에서 조립한다.
 * Payload 조회는 check-ruleset repository가 소유한다.
 */
export const getCheckRuleset = cache(async (): Promise<CheckSection[]> => {
	const { documents } = await getCheckSourceDocuments()
	const byId = new Map(documents.map((document) => [document.id, document]))
	const items = documents.map((document) => ({
		documentOrder: (document.breadcrumbs?.length ?? 1) < 3 ? -1 : document.displayOrder,
		item: {
			title: document.title,
			slug: pathSegment(document),
			...toCheckPlacement(document, byId),
			checks: collectGuidelineCheckSources(document).map(toRuntimeCheck),
		},
	}))

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

function toRuntimeCheck({
	check,
	evidence,
	referenceAssets,
	source,
}: GuidelineCheckSource): RuntimeCheck {
	const checker = typeof check.checker === 'object' ? check.checker : null
	if (!checker) throw new Error(`RuleChecker가 연결되지 않은 Check입니다: ${check.key}`)
	const checkerKey = checker.checkerKey ?? undefined
	const model = checker.model ?? undefined
	const prompt = checker.prompt?.trim() || undefined
	const options = checker.executor === 'deterministic' ? (check.options ?? undefined) : undefined
	const heuristicCriteria =
		checker.executor === 'heuristic'
			? (check.criteria ?? []).flatMap((criterion) => {
					const question = criterion.question?.trim()
					return criterion.id && question
						? [
								{
									id: criterion.id,
									question,
									expected: criterion.expected,
								},
							]
						: []
				})
			: undefined
	const heuristicPrompt =
		checker.executor === 'heuristic' && check.heuristicPrompt?.trim()
			? check.heuristicPrompt.trim()
			: undefined
	const implemented =
		checker.executor === 'deterministic'
			? Boolean(
					checkerKey &&
						(hasDeterministicChecker(checkerKey) || hasChecker(checkerKey, options)),
				)
			: checker.executor === 'heuristic'
				? Boolean(model)
				: true

	return {
		key: check.key,
		title: check.title,
		titleKo: check.titleKo?.trim() || undefined,
		tier: check.tier ?? undefined,
		source,
		checker: {
			key: checker.key,
			type: checker.executor,
			implementationKey: checker.executor === 'deterministic' ? checkerKey : undefined,
		},
		executor: checker.executor,
		checkerKey,
		model,
		prompt,
		options,
		heuristicCriteria,
		heuristicPrompt,
		implemented,
		evidence,
		referenceAssets: referenceAssets.flatMap((asset) =>
			asset.asset.url && asset.asset.mimeType
				? [
						{
							name: asset.asset.name,
							url: asset.asset.url,
							mimeType: asset.asset.mimeType,
							role: asset.role,
						},
					]
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

function toCheckPlacement(document: GuidelineDocument, documents: Map<number, GuidelineDocument>) {
	const breadcrumbs = document.breadcrumbs ?? []
	const chapter = documents.get(relationshipId(breadcrumbs[0]?.doc)) ?? document
	const section = documents.get(relationshipId(breadcrumbs[1]?.doc)) ?? chapter
	const sectionSlug = pathSegment(section)
	const chapterSlug = pathSegment(chapter)

	return {
		groupTitle: section.title,
		groupSlug: sectionSlug,
		chapterTitle: chapter.title,
		chapterSlug,
		chapterOrder: chapter.displayOrder,
		sectionTitle: section.title,
		sectionSlug,
		sectionOrder: section.displayOrder,
	}
}

function pathSegment(document: GuidelineDocument) {
	return document.slug
}

function relationshipId(value: GuidelineDocument['parent'] | undefined): number {
	if (typeof value === 'number') return value
	return value?.id ?? -1
}
