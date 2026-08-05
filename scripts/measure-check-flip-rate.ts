/**
 * AI heuristic 검수 flip rate 측정.
 * 같은 이미지를 N회 검수해 check status와 criterion 관측값이 실행 간 얼마나 일치하는지 리포트한다.
 * 어떤 criterion이 흔들리는지 찾아 재작성·deterministic 이관 대상을 고르는 용도다.
 * 실행: PAYLOAD_DB_PUSH=false pnpm exec payload run scripts/measure-check-flip-rate.ts -- --image <path> [--runs 5] [--flags logo,typography] [--out <json path>]
 * --flags: 요소 플래그(logo|typography|illustration|photography)로 검수 대상 check 목록을
 * 호출 전에 좁힌다. 전부 켜면 레퍼런스 이미지가 한 요청에 몰려 413이 나므로 실제 시나리오와
 * 같은 조합으로 지정한다.
 */
import { readFile, writeFile } from 'node:fs/promises'
import type { AiCheckResult, CheckResult } from '@/features/asset-check/checkers/types'
import { getRuntimeChecks } from '@/features/asset-check/services/get-check-ruleset.service'
import {
	runHeuristicCheck,
	runImmediateCheck,
} from '@/features/asset-check/services/run-check.service'

const args = process.argv.slice(2)
function argValue(flag: string): string | undefined {
	const index = args.indexOf(flag)
	return index >= 0 ? args[index + 1] : undefined
}

const imagePath = argValue('--image')
const runs = Number(argValue('--runs') ?? 5)
const outPath = argValue('--out')
if (!imagePath || !Number.isInteger(runs) || runs < 2) {
	console.error(
		'사용법: pnpm exec payload run scripts/measure-check-flip-rate.ts -- --image <path> [--runs 5] [--out <json path>]',
	)
	process.exit(1)
}

const buffer = await readFile(imagePath)
const enabledFlags = (argValue('--flags') ?? 'logo,typography,illustration,photography').split(',')
const flags = {
	logo: enabledFlags.includes('logo'),
	typography: enabledFlags.includes('typography'),
	illustration: enabledFlags.includes('illustration'),
	photography: enabledFlags.includes('photography'),
}
function isEnabledCheckKey(key: string): boolean {
	if (key.startsWith('logo.')) return flags.logo
	if (key.startsWith('typography.')) return flags.typography
	if (key.startsWith('illustration.')) return flags.illustration
	if (key.startsWith('imagery.')) return flags.photography
	return true
}
const checks = (await getRuntimeChecks()).filter((check) => isEnabledCheckKey(check.key))
const { pendingCheckKeys } = await runImmediateCheck(buffer, checks)
console.log(`AI check ${pendingCheckKeys.length}건 × ${runs}회 실행: ${imagePath}`)

const allRuns: Record<string, CheckResult>[] = []
for (let i = 0; i < runs; i++) {
	const started = Date.now()
	const { results, aiUsage } = await runHeuristicCheck(buffer, pendingCheckKeys)
	allRuns.push(results)
	console.log(
		`run ${i + 1}/${runs} 완료 (${Math.round((Date.now() - started) / 1000)}s, ${aiUsage?.totalTokens ?? '?'} tokens)`,
	)
}

function tally<T>(values: T[]): Map<string, number> {
	const counts = new Map<string, number>()
	for (const value of values) {
		const key = String(value)
		counts.set(key, (counts.get(key) ?? 0) + 1)
	}
	return counts
}

function formatTally(counts: Map<string, number>): string {
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([value, count]) => `${value}×${count}`)
		.join(' ')
}

function agreement(counts: Map<string, number>): number {
	return Math.max(...counts.values()) / runs
}

const checkKeys = [...new Set(allRuns.flatMap((run) => Object.keys(run)))]

console.log('\n=== Check status 일관성 ===')
const statusRows = checkKeys
	.map((key) => {
		const counts = tally(
			allRuns.map((run) => {
				const raw = run[key]?.rawResult
				if (!raw) return '(missing)'
				return raw.reasonCode ? `${raw.status}(${raw.reasonCode})` : raw.status
			}),
		)
		return { key, counts, agreement: agreement(counts) }
	})
	.sort((a, b) => a.agreement - b.agreement)
for (const row of statusRows) {
	console.log(
		`${Math.round(row.agreement * 100)}%`.padStart(4),
		row.key.padEnd(36),
		formatTally(row.counts),
	)
}

console.log('\n=== Criterion 일관성 (satisfied 기준, 불안정한 것부터) ===')
interface CriterionRow {
	key: string
	satisfied: Map<string, number>
	actual: Map<string, number>
	confidences: number[]
	agreement: number
}
const criterionIds = new Set(
	allRuns.flatMap((run) =>
		Object.entries(run).flatMap(([key, result]) =>
			((result.rawResult as AiCheckResult).observations ?? []).map(
				(observation) => `${key}/${observation.criterionId}`,
			),
		),
	),
)
const criterionRows: CriterionRow[] = [...criterionIds].map((id) => {
	const observations = allRuns.flatMap((run) =>
		Object.entries(run).flatMap(([key, result]) =>
			((result.rawResult as AiCheckResult).observations ?? []).filter(
				(observation) => `${key}/${observation.criterionId}` === id,
			),
		),
	)
	const satisfied = tally(observations.map((observation) => observation.satisfied))
	return {
		key: id,
		satisfied,
		actual: tally(observations.map((observation) => observation.actual)),
		confidences: observations.map((observation) => observation.confidence),
		agreement: agreement(satisfied),
	}
})
criterionRows.sort((a, b) => a.agreement - b.agreement)
for (const row of criterionRows) {
	const flaky = row.agreement < 1
	if (!flaky) continue
	console.log(
		`${Math.round(row.agreement * 100)}%`.padStart(4),
		row.key.padEnd(48),
		`satisfied: ${formatTally(row.satisfied)}`.padEnd(40),
		`actual: ${formatTally(row.actual)}`,
		`conf: ${Math.min(...row.confidences)}~${Math.max(...row.confidences)}`,
	)
}
const stableCount = criterionRows.filter((row) => row.agreement === 1).length
console.log(`\n안정 criterion: ${stableCount}/${criterionRows.length}`)

if (outPath) {
	await writeFile(
		outPath,
		JSON.stringify(
			{
				imagePath,
				runs,
				statusRows: statusRows.map(({ key, counts }) => ({
					key,
					counts: Object.fromEntries(counts),
				})),
				criterionRows: criterionRows.map((row) => ({
					...row,
					satisfied: Object.fromEntries(row.satisfied),
					actual: Object.fromEntries(row.actual),
				})),
				raw: allRuns,
			},
			null,
			'\t',
		),
	)
	console.log(`원본 결과 저장: ${outPath}`)
}

process.exit(0)
