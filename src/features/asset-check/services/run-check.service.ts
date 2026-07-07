import { opaquePixels } from '@/features/asset-check/checkers/color-metrics'
import { getChecker } from '@/features/asset-check/checkers/registry'
import type {
	AlgorithmCheckResult,
	CheckerContext,
	CheckResult,
	CheckResultChecker,
	RawCheckResult,
} from '@/features/asset-check/checkers/types'
import { extractPixelGrid } from '@/features/asset-check/repositories/image-decoder.sharp.repository'
import { runAiCheck } from '@/features/asset-check/services/ai-check.service'
import { getCheckPalette } from '@/features/asset-check/services/get-check-palette.service'
import {
	type CheckRule,
	getCheckRules,
} from '@/features/asset-check/services/get-check-ruleset.service'
import type { ImageContentFlags } from '@/features/asset-check/types'

export interface ImmediateCheckResult {
	results: Record<string, CheckResult>
	pendingRuleKeys: string[]
}

/**
 * 검수 대상 이미지를 deterministic/advisory 룰까지만 즉시 판정한다.
 * AI 휴리스틱 룰은 pendingRuleKeys로 분리해 후속 요청이 실행한다.
 */
export async function runImmediateCheck(
	buffer: Buffer,
	flags: ImageContentFlags,
	inputRules?: CheckRule[],
): Promise<ImmediateCheckResult> {
	const [grid, rules, palette] = await Promise.all([
		extractPixelGrid(buffer),
		inputRules ?? getCheckRules(),
		getCheckPalette(),
	])
	const pixels = opaquePixels(grid)
	const image = imageInputFrom(buffer)

	const results: Record<string, CheckResult> = {}
	const pendingRuleKeys: string[] = []
	const ctx = { pixels, palette, grid, image }
	for (const rule of rules) {
		if (results[rule.key] || !shouldCheckRule(rule.key, flags)) continue
		if (rule.executor === 'heuristic') {
			pendingRuleKeys.push(rule.key)
			continue
		}
		const result = runRuleByExecutor(rule, ctx)
		if (result) results[rule.key] = result
	}

	return { results, pendingRuleKeys }
}

/**
 * 후속 AI 검수 요청에서 heuristic 룰만 판정한다.
 * 첫 응답의 pendingRuleKeys를 기준으로 실행 범위를 좁힌다.
 */
export async function runHeuristicCheck(
	buffer: Buffer,
	ruleKeys: string[],
	inputRules?: CheckRule[],
): Promise<Record<string, CheckResult>> {
	const rules = (inputRules ?? (await getCheckRules(ruleKeys))).filter(
		(rule) => rule.executor === 'heuristic' && ruleKeys.includes(rule.key),
	)
	if (rules.length === 0) return {}
	const results = await runAiCheck(rules, {
		image: imageInputFrom(buffer),
		pixels: [],
		palette: [],
	})
	return Object.fromEntries(
		Object.entries(results).map(([key, result]) => [
			key,
			toCheckResult(
				result,
				rules.find((rule) => rule.key === key),
				{ key: 'ai', type: 'ai' },
			),
		]),
	)
}

/** 룰이 요소 종속이면 사용자가 표시한 포함 요소 플래그가 켜져 있을 때만 검수한다. */
function shouldCheckRule(ruleKey: string, flags: ImageContentFlags): boolean {
	if (ruleKey.startsWith('logo.')) return flags.logo
	if (ruleKey.startsWith('typography.')) return flags.typography
	if (ruleKey.startsWith('illustration.')) return flags.illustration
	if (ruleKey.startsWith('imagery.')) return flags.photography
	return true
}

/** 룰 메시지 패턴({facts.x} 치환)을 렌더한다. 패턴이 없으면 checker detail을 그대로 쓴다. */
function renderCheckMessage(pattern: string | undefined, result: RawCheckResult): string {
	if (!pattern) return result.detail
	return pattern.replace(/\{([^}]+)\}/g, (_match, path: string) =>
		String(readPath(result, path.trim()) ?? ''),
	)
}

function readPath(value: unknown, path: string): unknown {
	return path.split('.').reduce<unknown>((current, key) => {
		if (!current || typeof current !== 'object') return undefined
		const next = (current as Record<string, unknown>)[key]
		return Array.isArray(next) ? next.join(', ') : next
	}, value)
}

// heuristic 룰은 호출 전에 runAiCheck로 분기되므로 여기 오지 않는다.
function runRuleByExecutor(rule: CheckRule, ctx: CheckerContext): CheckResult | null {
	if (rule.executor === 'advisory') {
		const rawResult: AlgorithmCheckResult = {
			status: 'needs_review',
			fulfillment: null,
			detail: '브랜드 담당자 확인 필요',
		}
		return toCheckResult(rawResult, rule, { key: 'advisory', type: 'advisory' })
	}
	const checker = getChecker(rule.key)
	if (!checker) return null
	const result = checker(ctx)
	return result ? toCheckResult(result, rule, { key: rule.key, type: 'algorithm' }) : null
}

function toCheckResult(
	rawResult: RawCheckResult,
	rule: CheckRule | undefined,
	checker: CheckResultChecker,
): CheckResult {
	const message = renderCheckMessage(rule?.messages?.[rawResult.status], rawResult)
	return {
		rule: {
			key: rule?.key ?? checker.key,
			title: rule?.title ?? checker.key,
			executor: rule?.executor ?? (checker.type === 'ai' ? 'heuristic' : 'deterministic'),
		},
		checker,
		rawResult,
		message,
		executor: rule?.executor ?? (checker.type === 'ai' ? 'heuristic' : 'deterministic'),
		status: rawResult.status,
		fulfillment: rawResult.fulfillment,
		detail: message,
		metric: rawResult.metric,
		facts: rawResult.facts,
	}
}

function imageInputFrom(buffer: Buffer): CheckerContext['image'] {
	if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
		return { data: buffer, mediaType: 'image/jpeg' }
	}
	if (
		buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
	) {
		return { data: buffer, mediaType: 'image/png' }
	}
	if (
		buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
		buffer.subarray(8, 12).toString('ascii') === 'WEBP'
	) {
		return { data: buffer, mediaType: 'image/webp' }
	}
}
