import type { CheckResult } from '@/features/asset-check/checkers/types'
import { checkDisplayStatus } from '@/features/asset-check/components/check-status'
import {
	type CheckScenario,
	filterRulesetByScenario,
	getCheckScenario,
} from '@/features/asset-check/scenarios'
import type {
	CheckSection,
	RuntimeCheck,
} from '@/features/asset-check/services/get-check-ruleset.service'
import type { CheckImage } from '@/features/asset-check/types'

export interface CheckReviewRow {
	check: RuntimeCheck
	rowId: string
	scenarioLabel: string | null
	appliesTo: string[]
	guidelineHref: string
	anchorId: string | null
	outcome?: CheckResult
	inProgress: boolean
	detail: string | null
}

export interface CheckReviewSummary {
	pass: number
	ok: number
	fail: number
	advisory: number
	notApplicable: number
	pendingManualCheck: number
}

export interface CheckReviewView {
	rows: CheckReviewRow[]
	summary: CheckReviewSummary
}

type MutableCheckRow = CheckReviewRow & { appliesToSet: Set<string> }

/**
 * 검수 리뷰 화면 view model 생성 경계.
 * ruleset/result 조회와 외부 I/O는 호출자가 소유하고, 이 함수는 화면 표시용 순수 계산만 담당한다.
 */
export function buildCheckReviewView({
	sections,
	scenarios,
	scenarioKey,
	selected,
	showFailOnly,
}: {
	sections: CheckSection[]
	scenarios: CheckScenario[]
	scenarioKey: string
	selected: CheckImage | null
	showFailOnly: boolean
}): CheckReviewView {
	const results = selected?.results
	const reviewScenarioKey = selected?.scenarioKey ?? scenarioKey
	const scenario = getCheckScenario(scenarios, reviewScenarioKey)
	const visibleSections = filterRulesetByScenario(sections, scenario)
	const allRows = buildRows({ visibleSections, selected, scenario })
	const summary = buildSummary(allRows, results)
	const rows =
		showFailOnly && results
			? allRows.filter((row) => row.outcome?.rawResult.status === 'fail')
			: allRows

	return { rows, summary }
}

function buildSummary(rows: CheckReviewRow[], results: CheckImage['results']): CheckReviewSummary {
	const summary = {
		pass: 0,
		ok: 0,
		fail: 0,
		advisory: 0,
		notApplicable: 0,
		pendingManualCheck: 0,
	}
	if (!results) return summary

	for (const row of rows) {
		const status = row.outcome ? checkDisplayStatus(row.outcome.rawResult) : undefined
		if (status === 'pass') summary.pass++
		else if (status === 'ok') summary.ok++
		else if (status === 'fail') summary.fail++
		else if (status === 'advisory') summary.advisory++
		else if (status === 'not_applicable') summary.notApplicable++
		else summary.pendingManualCheck++
	}

	return summary
}

/** 구조화된 판정을 Review 화면의 한국어 상태 문구로 바꾼다. 기존 세션은 message로 표시한다. */
function formatReviewDetail(outcome: CheckResult | undefined): string | null {
	if (!outcome) return null
	const { rawResult } = outcome

	if (rawResult.reasonCode === 'not_applicable') return '관측 대상 없음'
	if ('summary' in rawResult && rawResult.summary) {
		if (rawResult.status === 'fail') return `기준 ${rawResult.summary.failed}개 미충족`
		if (rawResult.status === 'needs_review') {
			return `기준 ${rawResult.summary.uncertain}개 판단 필요`
		}
		if (rawResult.status === 'pass') return `기준 ${rawResult.summary.satisfied}개 충족`
	}

	return outcome.message ?? rawResult.detail ?? null
}

function buildRows({
	visibleSections,
	selected,
	scenario,
}: {
	visibleSections: CheckSection[]
	selected: CheckImage | null
	scenario: CheckScenario
}): CheckReviewRow[] {
	const results = selected?.results
	const snapshotByKey = new Map(selected?.rulesetSnapshot?.map((check) => [check.key, check]))
	const pendingCheckKeys = new Set(selected?.pendingCheckKeys)
	const rowByCheckKey = new Map<string, MutableCheckRow>()

	for (const section of visibleSections) {
		for (const currentCheck of section.checks) {
			const check = snapshotByKey.get(currentCheck.key) ?? currentCheck
			const existing = rowByCheckKey.get(check.key)
			if (existing) {
				if (!existing.appliesToSet.has(section.title)) {
					existing.appliesToSet.add(section.title)
					existing.appliesTo.push(section.title)
				}
				continue
			}

			const outcome = results?.[check.key]
			if (!check.implemented) continue
			const inProgress = selected?.status === 'running' && pendingCheckKeys.has(check.key)

			const row = {
				check,
				rowId: `${scenario.key}:${check.key}`,
				scenarioLabel: null,
				appliesTo: [section.title],
				appliesToSet: new Set([section.title]),
				guidelineHref: toGuidelineHref(section),
				anchorId: null,
				outcome,
				inProgress,
				detail: inProgress ? '검사 중...' : formatReviewDetail(outcome),
			}
			rowByCheckKey.set(check.key, row)
		}
	}

	const orderedRows: CheckReviewRow[] = []
	for (const key of scenario.checkKeys) {
		const current = rowByCheckKey.get(key)
		if (!current) continue
		const { appliesToSet: _appliesToSet, ...row } = current
		const first = orderedRows.length === 0
		orderedRows.push({
			...row,
			scenarioLabel: first ? scenario.title : null,
			anchorId: first ? scenario.key : null,
		})
	}
	return orderedRows
}

function toGuidelineHref(section: CheckSection) {
	const chapterHref = `/guideline/${section.chapterSlug}`
	if (section.sectionSlug === section.chapterSlug) return chapterHref

	const sectionHref = `${chapterHref}/${section.sectionSlug}`
	return section.slug === section.sectionSlug ? sectionHref : `${sectionHref}#${section.slug}`
}
