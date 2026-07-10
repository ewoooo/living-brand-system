import type { CheckResult } from '@/features/asset-check/checkers/types'
import { filterRulesetByScenario, getCheckScenario } from '@/features/asset-check/scenarios'
import type {
	CheckSection,
	RuntimeCheck,
} from '@/features/asset-check/services/get-check-ruleset.service'
import type { CheckImage } from '@/features/asset-check/types'

export interface CheckReviewRow {
	check: RuntimeCheck
	rowId: string
	sectionLabel: string | null
	appliesTo: string[]
	anchorId: string | null
	outcome?: CheckResult
	inProgress: boolean
	detail: string | null
}

export interface CheckReviewSummary {
	pass: number
	ok: number
	fail: number
	pendingManualCheck: number
}

export interface CheckReviewView {
	rows: CheckReviewRow[]
	summary: CheckReviewSummary
}

type MutableCheckRow = CheckReviewRow & { appliesToSet: Set<string> }

/**
 * 검수 리뷰 화면 view model 생성 경계.
 * ruleset/result 조회와 외부 I/O는 호출자가 소유하고, 이 서비스는 화면 표시용 순수 계산만 담당한다.
 */
export function buildCheckReviewView({
	sections,
	scenarioKey,
	selected,
	showFailOnly,
}: {
	sections: CheckSection[]
	scenarioKey: string
	selected: CheckImage | null
	showFailOnly: boolean
}): CheckReviewView {
	const results = selected?.results
	const reviewScenarioKey = selected?.scenarioKey ?? scenarioKey
	const visibleSections = filterRulesetByScenario(sections, getCheckScenario(reviewScenarioKey))
	const allRows = buildRows({ visibleSections, selected })
	const summary = buildSummary(allRows, results)
	const rows =
		showFailOnly && results
			? allRows.filter((row) => row.outcome?.rawResult.status === 'fail')
			: allRows

	return { rows, summary }
}

function buildSummary(rows: CheckReviewRow[], results: CheckImage['results']): CheckReviewSummary {
	const summary = { pass: 0, ok: 0, fail: 0, pendingManualCheck: 0 }
	if (!results) return summary

	for (const row of rows) {
		const status = row.outcome?.rawResult.status
		if (status === 'pass') summary.pass++
		else if (status === 'ok') summary.ok++
		else if (status === 'fail') summary.fail++
		else summary.pendingManualCheck++
	}

	return summary
}

function buildRows({
	visibleSections,
	selected,
}: {
	visibleSections: CheckSection[]
	selected: CheckImage | null
}): CheckReviewRow[] {
	const results = selected?.results
	const rows: MutableCheckRow[] = []
	const rowByCheckKey = new Map<string, MutableCheckRow>()
	const seenSections = new Set<string>()

	for (const section of visibleSections) {
		for (const check of section.checks) {
			const existing = rowByCheckKey.get(check.key)
			if (existing) {
				if (!existing.appliesToSet.has(section.title)) {
					existing.appliesToSet.add(section.title)
					existing.appliesTo.push(section.title)
				}
				continue
			}

			const outcome = results?.[check.key]
			const status = outcome?.rawResult.status
			if (!check.implemented) continue

			const first = !seenSections.has(section.slug)
			seenSections.add(section.slug)
			const row = {
				check,
				rowId: `${section.slug}:${check.key}`,
				sectionLabel: first ? section.title : null,
				appliesTo: [section.title],
				appliesToSet: new Set([section.title]),
				anchorId: first ? section.slug : null,
				outcome,
				inProgress:
					selected?.status === 'running' &&
					selected.pendingCheckKeys?.includes(check.key) === true,
				detail: status !== 'pass' ? (outcome?.message ?? null) : null,
			}
			rows.push(row)
			rowByCheckKey.set(check.key, row)
		}
	}

	return rows.map(({ appliesToSet: _appliesToSet, ...row }) => row)
}
