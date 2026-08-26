import { cache } from 'react'
import { hasChecker } from '@/features/asset-check/checkers/registry'
import type { HeuristicCriterion } from '@/features/asset-check/checkers/types'
import type { CheckSection, RuntimeCheck } from '@/features/asset-check/domain/runtime-check'
import {
	type CheckRulesetSourceDocument,
	getCheckSourceDocuments,
} from '@/features/asset-check/repositories/check-ruleset.payload.repository'
import { toRuntimeCheckMessages } from '@/features/asset-check/utils/check-messages'
import type { GuidelineCheckSource } from '@/features/guideline/checks/collect-guideline-check-sources'

/**
 * 검수 화면용 Check 뷰모델을 published 통합 문서와 내부 Block에서 조립한다.
 * Payload 조회는 check-ruleset repository가 소유한다.
 */
export const getCheckRuleset = cache(async (): Promise<CheckSection[]> => {
	const { documents } = await getCheckSourceDocuments()
	const byId = new Map(documents.map((document) => [document.id, document]))
	const items = documents.map((document) => ({
		documentOrder: document.breadcrumbDocumentIds.length < 3 ? -1 : document.displayOrder,
		item: {
			title: document.title,
			slug: document.slug,
			...toCheckPlacement(document, byId),
			checks: document.checks.map(toRuntimeCheck),
		},
	}))

	return items
		.filter(({ item }) => item.checks.length > 0)
		.sort(
			(a, b) =>
				a.item.chapterOrder - b.item.chapterOrder ||
				a.item.topicOrder - b.item.topicOrder ||
				a.documentOrder - b.documentOrder,
		)
		.map(({ item }) => item)
})

/**
 * 검수 실행용 Check snapshot을 checkKeys 순서로 반환하며 누락·미구현 실행 구성을 거부한다.
 * published source 조회는 check-ruleset repository가 소유한다.
 */
export async function getRuntimeChecks(checkKeys?: string[]): Promise<RuntimeCheck[]> {
	const checks = uniqueChecks((await getCheckRuleset()).flatMap((section) => section.checks))
	const requestedKeys = checkKeys ?? checks.map((check) => check.key)
	const byKey = new Map(checks.map((check) => [check.key, check]))
	assertRunnableCheckKeys(requestedKeys, byKey)

	return requestedKeys.map((key) => byKey.get(key) as RuntimeCheck)
}

function assertRunnableCheckKeys(requestedKeys: string[], checks: Map<string, RuntimeCheck>): void {
	if (requestedKeys.length === 0) {
		throw new Error('Check 실행 구성 오류: 실행할 Check key가 없습니다.')
	}

	const duplicateKeys = requestedKeys.filter((key, index) => requestedKeys.indexOf(key) !== index)
	const missingKeys = requestedKeys.filter((key) => !checks.has(key))
	const unimplementedKeys = requestedKeys.filter((key) => checks.get(key)?.implemented === false)
	const problems = [
		...formatKeyProblem('중복', duplicateKeys),
		...formatKeyProblem('누락', missingKeys),
		...formatKeyProblem('미구현', unimplementedKeys),
	]
	if (problems.length > 0) {
		throw new Error(`Check 실행 구성 오류: ${problems.join('; ')}`)
	}
}

function formatKeyProblem(label: string, keys: string[]): string[] {
	return keys.length > 0 ? [`${label} [${[...new Set(keys)].join(', ')}]`] : []
}

function toRuntimeCheck({
	rule,
	evidence,
	referenceAssets,
	source,
}: GuidelineCheckSource): RuntimeCheck {
	const checker = typeof rule.checker === 'object' && rule.checker !== null ? rule.checker : null
	if (!checker) throw new Error(`RuleChecker가 연결되지 않은 Check입니다: ${rule.key}`)
	const checkerKey = checker.checkerKey ?? undefined
	const model = checker.model ?? undefined
	const prompt = checker.prompt?.trim() || undefined
	const options = checker.executor === 'deterministic' ? (rule.options ?? undefined) : undefined
	const heuristicCriteria =
		checker.executor === 'heuristic'
			? (rule.criteria ?? []).flatMap((criterion): HeuristicCriterion[] => {
					const question = criterion.question?.trim()
					if (!criterion.id || !question) return []
					if (criterion.kind === 'measure') {
						return criterion.operator && typeof criterion.expectedValue === 'number'
							? [
									{
										id: criterion.id,
										question,
										kind: 'measure',
										operator: criterion.operator,
										expected: criterion.expectedValue,
										max: criterion.max ?? undefined,
										unit: criterion.unit?.trim() || undefined,
									},
								]
							: []
					}
					return criterion.expected
						? [{ id: criterion.id, question, expected: criterion.expected }]
						: []
				})
			: undefined
	const heuristicPrompt =
		checker.executor === 'heuristic' && rule.heuristicPrompt?.trim()
			? rule.heuristicPrompt.trim()
			: undefined
	const implemented =
		checker.executor === 'deterministic'
			? Boolean(checkerKey && hasChecker(checkerKey, options))
			: checker.executor === 'heuristic'
				? Boolean(model)
				: true

	return {
		key: rule.key,
		title: rule.title,
		titleKo: rule.titleKo?.trim() || undefined,
		tier: rule.tier,
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
		referenceAssets: referenceAssets.flatMap(({ asset, role }) =>
			asset.url && asset.mimeType
				? [{ name: asset.name, url: asset.url, mimeType: asset.mimeType, role }]
				: [],
		),
		messages:
			checker.executor === 'heuristic' ? undefined : toRuntimeCheckMessages(rule.messages),
	}
}

function uniqueChecks(checks: RuntimeCheck[]): RuntimeCheck[] {
	const byKey = new Map<string, RuntimeCheck[]>()
	for (const check of checks) {
		const placements = byKey.get(check.key)
		if (placements) placements.push(check)
		else byKey.set(check.key, [check])
	}
	return [...byKey.values()].map(mergeCheckPlacements)
}

// 같은 Rule이 여러 문서·블록에 배치되면 정의는 공유되므로 근거와 참조 자산만 합친다.
function mergeCheckPlacements(placements: RuntimeCheck[]): RuntimeCheck {
	const [first] = placements
	if (placements.length === 1) return first

	const evidences = placements
		.map(({ evidence }) => evidence)
		.filter(
			(evidence): evidence is Exclude<typeof evidence, string> =>
				typeof evidence !== 'string',
		)
	const descriptions = [
		...new Set(
			evidences.flatMap((evidence) =>
				evidence.type === 'document' && evidence.description ? [evidence.description] : [],
			),
		),
	]
	return {
		...first,
		evidence: {
			type: 'document',
			description: descriptions.length > 0 ? descriptions.join('\n') : undefined,
			blocks: evidences.flatMap((evidence) =>
				evidence.type === 'document' ? evidence.blocks : [evidence],
			),
		},
		referenceAssets: [
			...new Map(
				placements
					.flatMap((placement) => placement.referenceAssets)
					.map((asset) => [`${asset.url}:${asset.role}`, asset] as const),
			).values(),
		],
	}
}

function toCheckPlacement(
	document: CheckRulesetSourceDocument,
	documents: Map<number, CheckRulesetSourceDocument>,
) {
	const chapter = documents.get(document.breadcrumbDocumentIds[0] ?? -1) ?? document
	const topic = documents.get(document.breadcrumbDocumentIds[1] ?? -1) ?? chapter
	const topicSlug = topic.slug
	const chapterSlug = chapter.slug

	return {
		groupTitle: topic.title,
		groupSlug: topicSlug,
		chapterTitle: chapter.title,
		chapterSlug,
		chapterOrder: chapter.displayOrder,
		topicTitle: topic.title,
		topicSlug,
		topicOrder: topic.displayOrder,
	}
}
