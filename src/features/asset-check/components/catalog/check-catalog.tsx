'use client'

import { useState } from 'react'
import { type CheckScenario, filterRulesetByScenario } from '@/features/asset-check/scenarios'
import type {
	CheckSection,
	RuntimeCheck,
} from '@/features/asset-check/services/get-check-ruleset.service'
import { toCheckAnchor } from '@/features/asset-check/utils/check-anchor'
import { formatCheckEvidence } from '@/features/guideline/checks/format-check-evidence'
import { CheckEvidence } from './check-evidence'

const executorLabels = {
	deterministic: '자동 측정',
	heuristic: 'AI 평가',
	manual: '담당자 확인',
} as const

type ExecutorFilter = 'all' | keyof typeof executorLabels

/**
 * /review/rules — 시나리오별 검수 기준 카탈로그 (검색 + executor 필터).
 * in : { sections: CheckSection[]; scenarios: CheckScenario[] }   // 서버에서 주입, 컨텍스트 미사용
 * 검색 대상 텍스트: scenario.title + check.title/titleKo/key + formatCheckEvidence(check.evidence)
 * 항목 렌더 필드: check.key, check.title, check.evidence, check.referenceAssets,
 *   check.executor('자동 측정'|'AI 평가'|'담당자 확인'), check.implemented(미구현 배지),
 *   check.messages { pass?, ok?, needs_review?, fail? }
 * 앵커: section id = scenario.key, article id = toCheckAnchor(scenarioKey, checkKey)
 */
export function CheckCatalog({
	sections,
	scenarios,
}: {
	sections: CheckSection[]
	scenarios: CheckScenario[]
}) {
	const [query, setQuery] = useState('')
	const [executor, setExecutor] = useState<ExecutorFilter>('all')
	const normalizedQuery = query.trim().toLocaleLowerCase()
	const scenarioGroups = scenarios.map((scenario) => ({
		...scenario,
		checks: scenarioChecks(filterRulesetByScenario(sections, scenario), scenario),
	}))
	const totalCount = scenarioGroups.reduce((count, scenario) => count + scenario.checks.length, 0)
	const filteredScenarios: typeof scenarioGroups = []
	for (const scenario of scenarioGroups) {
		const checks = scenario.checks.filter((check) => {
			if (executor !== 'all' && check.executor !== executor) return false

			const searchText = [
				scenario.title,
				check.title,
				check.titleKo,
				check.key,
				formatCheckEvidence(check.evidence),
			]
				.filter(Boolean)
				.join(' ')
				.toLocaleLowerCase()

			return !normalizedQuery || searchText.includes(normalizedQuery)
		})
		if (checks.length > 0) filteredScenarios.push({ ...scenario, checks })
	}
	const filteredCount = filteredScenarios.reduce(
		(count, scenario) => count + scenario.checks.length,
		0,
	)

	return (
		<div>
			<div className="grid gap-4 border-b pb-6 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end">
				<label className="type-body-emphasized grid gap-2" htmlFor="check-catalog-search">
					검수 항목 검색
					<input
						id="check-catalog-search"
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="제목, 키, 근거 내용 검색"
						className="type-body w-full rounded-md border bg-background px-3 py-2.5 font-normal focus-visible:outline-2 focus-visible:outline-offset-2"
					/>
				</label>
				<label className="type-body-emphasized grid gap-2" htmlFor="check-executor-filter">
					판정 방식
					<select
						id="check-executor-filter"
						value={executor}
						onChange={(event) => setExecutor(event.target.value as ExecutorFilter)}
						className="type-body w-full rounded-md border bg-background px-3 py-2.5 font-normal focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<option value="all">전체 판정 방식</option>
						{Object.entries(executorLabels).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</label>
			</div>
			<p className="type-body py-4 text-foreground-muted" aria-live="polite">
				필터 결과 {filteredCount}개 / 전체 {totalCount}개
			</p>
			<div className="divide-y divide-border border-t">
				{filteredScenarios.map((scenario) => (
					<section key={scenario.key} id={scenario.key} className="scroll-mt-16 py-10">
						<h2 className="type-title-1">{scenario.title}</h2>
						<div className="mt-6 divide-y divide-border">
							{scenario.checks.map((check) => (
								<article
									key={`${scenario.key}:${check.key}`}
									id={toCheckAnchor(scenario.key, check.key)}
									className="grid scroll-mt-16 gap-4 py-6 md:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)] md:gap-8"
								>
									<div className="min-w-0">
										<h3 className="type-body-emphasized">{check.title}</h3>
										<code className="type-callout mt-2 block break-words text-foreground-muted">
											{check.key}
										</code>
									</div>
									<div className="type-body flex min-w-0 max-w-[80ch] flex-col gap-3 break-words">
										<CheckEvidence
											evidence={check.evidence}
											referenceAssets={check.referenceAssets}
										/>
										<p className="type-body text-foreground-muted">
											{executorLabels[check.executor]}
											{check.implemented ? '' : ' / 미구현'}
										</p>
										<CheckMessages messages={check.messages} />
									</div>
								</article>
							))}
						</div>
					</section>
				))}
				{filteredCount === 0 && (
					<p className="type-body py-16 text-center text-foreground-muted">
						조건에 맞는 검수 항목이 없습니다.
					</p>
				)}
			</div>
		</div>
	)
}

function scenarioChecks(sections: CheckSection[], scenario: CheckScenario): RuntimeCheck[] {
	const byKey = new Map(
		sections.flatMap((section) => section.checks.map((check) => [check.key, check])),
	)
	return scenario.checkKeys.flatMap((key) => {
		const check = byKey.get(key)
		return check ? [check] : []
	})
}

function CheckMessages({ messages }: { messages: CheckSection['checks'][number]['messages'] }) {
	const entries = [
		['pass', messages?.pass],
		['ok', messages?.ok],
		['needs_review', messages?.needs_review],
		['fail', messages?.fail],
	].filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '')

	if (entries.length === 0) return null

	return (
		<dl className="type-callout grid gap-2 rounded-md bg-fill-muted/50 p-3">
			{entries.map(([status, message]) => (
				<div key={status} className="grid gap-2 md:grid-cols-[6rem_1fr]">
					<dt className="type-callout-emphasized">{status}</dt>
					<dd className="text-foreground-muted">{message}</dd>
				</div>
			))}
		</dl>
	)
}
