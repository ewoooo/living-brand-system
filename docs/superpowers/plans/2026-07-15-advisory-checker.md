# Advisory 체커 (manual executor AI 조언 진화) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** model이 설정된 manual executor Check를 AI가 한 문단 디자인 조언(판정 없음)으로 검수하고, AI 배치를 모델별로 분리해 admin의 모델 선택이 실제로 작동하게 한다.

**Architecture:** 기존 heuristic AI 파이프(runImmediateCheck → pendingCheckKeys → runHeuristicCheck → runAiCheck)를 그대로 타되, (1) manual+model 체크를 pending에 합류시키고 (2) runAiCheck의 per-check 출력 스키마를 executor에 따라 observations/advice로 분기하며 (3) runHeuristicCheck가 모델별로 runAiCheck를 나눠 호출한다. executor enum 값은 변경하지 않는다 (`manual` 값 유지, 라벨만 `Advisory (AI)`).

**Tech Stack:** Next.js + Payload CMS, AI SDK(`ai` + `@ai-sdk/anthropic`), zod, vitest.

**Spec:** `docs/superpowers/specs/2026-07-15-advisory-checker-design.md`

## Global Constraints

- executor enum 값(`deterministic` | `heuristic` | `manual`)은 절대 변경·추가하지 않는다. DB 마이그레이션 0개.
- 사용자 노출 문구는 한국어. 코드 스타일은 biome(탭 들여쓰기, 작은따옴표) — 기존 파일 스타일을 그대로 따른다.
- 새 의존성 추가 금지.
- advisory 결과는 pass/fail 판정·충족률 집계에 절대 포함하지 않는다.
- model 미설정 manual 체커는 기존 "브랜드 담당자 확인 필요" needs_review 폴백을 그대로 유지한다.
- 테스트 실행: `pnpm vitest run <파일경로>` (worktree 루트 `/Users/plusx/Documents/living-brand-system`에서).

---

### Task 1: `advisory` 상태와 `evaluateAdvisory`

**Files:**
- Modify: `src/features/asset-check/checkers/types.ts:16` (CheckStatus), `:58`, `:87` (Exclude 확장)
- Modify: `src/features/asset-check/components/check-status.ts`
- Modify: `src/features/asset-check/checkers/heuristic-evaluator.ts`
- Test: `src/features/asset-check/checkers/heuristic-evaluator.test.ts`

**Interfaces:**
- Consumes: 기존 `AiCheckResult`, `needsReview()` (heuristic-evaluator.ts 내부 헬퍼)
- Produces: `CheckStatus`에 `'advisory'` 추가. `evaluateAdvisory(advice: string | undefined): AiCheckResult` — advice가 있으면 `{ status: 'advisory', fulfillment: null, detail: advice }`, 없으면 `{ status: 'needs_review', reasonCode: 'ai_output_invalid' }`. Task 3이 이 함수를 import한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/asset-check/checkers/heuristic-evaluator.test.ts` — import에 `evaluateAdvisory` 추가하고 파일 끝에 describe 블록 추가:

```ts
import { evaluateAdvisory, evaluateHeuristic } from './heuristic-evaluator'
```

```ts
describe('evaluateAdvisory', () => {
	it('조언 문단을 advisory 상태로 감싼다', () => {
		const result = evaluateAdvisory('로고 주변 여백을 넓히면 위계가 살아납니다.')

		expect(result.status).toBe('advisory')
		expect(result.detail).toBe('로고 주변 여백을 넓히면 위계가 살아납니다.')
		expect(result.fulfillment).toBeNull()
	})

	it('조언이 없거나 공백이면 검토로 닫는다', () => {
		expect(evaluateAdvisory(undefined).status).toBe('needs_review')
		expect(evaluateAdvisory(undefined).reasonCode).toBe('ai_output_invalid')
		expect(evaluateAdvisory('   ').reasonCode).toBe('ai_output_invalid')
	})
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run src/features/asset-check/checkers/heuristic-evaluator.test.ts`
Expected: FAIL — `evaluateAdvisory`가 export되지 않음.

- [ ] **Step 3: 타입·상태·evaluator 구현**

`src/features/asset-check/checkers/types.ts`:

```ts
// 16행
export type CheckStatus = 'pass' | 'ok' | 'advisory' | 'needs_review' | 'fail'
```

```ts
// 58행 (DeterministicEvaluationResult)
	status: Exclude<CheckStatus, 'ok' | 'advisory'>
```

```ts
// 87행 (AlgorithmCheckResult)
	status: Exclude<CheckStatus, 'ok' | 'advisory'>
```

`src/features/asset-check/components/check-status.ts` — `ok` 엔트리 다음에 추가:

```ts
	advisory: {
		label: '조언',
		pill: 'bg-info/15 text-info',
		dot: 'bg-info',
	},
```

`src/features/asset-check/checkers/heuristic-evaluator.ts` — `evaluateHeuristic` 아래에 추가:

```ts
/** AI 조언 문단을 advisory 결과로 감싼다. 조언만 싣고 판정은 만들지 않는다. */
export function evaluateAdvisory(advice: string | undefined): AiCheckResult {
	const trimmed = advice?.trim()
	if (!trimmed) return needsReview('AI 조언 없음', 'ai_output_invalid')
	return { status: 'advisory', fulfillment: null, detail: trimmed }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/features/asset-check/checkers/heuristic-evaluator.test.ts`
Expected: PASS (기존 evaluateHeuristic 테스트 포함 전부).

- [ ] **Step 5: 관련 파일 타입 확인**

Run: `pnpm tsc --noEmit`
Expected: PASS. `CHECK_STATUS`는 `Record<CheckStatus, …>`이므로 advisory 키 누락 시 여기서 잡힌다. 만약 다른 파일에서 `CheckStatus`를 전수 매핑하는 곳이 에러나면 해당 파일에 advisory 분기를 추가한다 (집계 로직이라면 pass/fail에 넣지 말 것).

- [ ] **Step 6: Commit**

```bash
git add src/features/asset-check/checkers/types.ts src/features/asset-check/components/check-status.ts src/features/asset-check/checkers/heuristic-evaluator.ts src/features/asset-check/checkers/heuristic-evaluator.test.ts
git commit -m "feat: advisory 검수 상태와 evaluateAdvisory 추가"
```

---

### Task 2: `runAiCheck` — advisory 출력 스키마와 advices 반환

**Files:**
- Modify: `src/features/asset-check/repositories/ai-check.agent.repository.ts`
- Test: `src/features/asset-check/repositories/ai-check.agent.repository.test.ts`

**Interfaces:**
- Consumes: `RuntimeCheck.executor`(`'manual'`이면 advisory), `heuristicObservationSchema` (기존)
- Produces: `AiCheckRunResult`에 `advices: Record<string, string>` 필드 추가 (checkKey → 조언 문단). 기존 `observations`·`failure`·`aiUsage` 계약 유지. **단일 모델 가드는 유지** — 호출자(Task 3)가 모델별로 그룹핑해 넘기는 것이 새 계약이다. Task 3이 `advices`를 소비한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/asset-check/repositories/ai-check.agent.repository.test.ts` 수정:

(0) 기존 테스트 'maps AI SDK token usage…'의 JSON `toEqual` 단언(123-145행)에서 checks[0]에 `kind: 'criteria'` 필드를 추가한다 (Step 3에서 직렬화에 kind가 추가되므로):

```ts
			checks: [
				{
					key: 'imagery.mood',
					kind: 'criteria',
					titleEn: 'Imagery mood',
					// …이하 기존 필드 그대로
```

기존 `checks` 배열 아래에 advisory fixture 추가:

```ts
const advisoryCheck: RuntimeCheck = {
	key: 'imagery.advice',
	title: 'Imagery advice',
	titleKo: '이미지 디자인 조언',
	source: { documentId: 12 },
	checker: { key: 'design-advisor', type: 'manual' },
	executor: 'manual',
	model: 'rule-spec-model',
	prompt: '사진 무드 관점에서 디자이너처럼 개선 조언을 작성한다.',
	implemented: true,
	evidence: '자연스러운 일상의 순간',
	referenceAssets: [],
	messages: {},
}
```

describe 블록 안에 테스트 추가:

```ts
	it('advisory 체크는 advice 스키마로 조언 문단을 수집한다', async () => {
		vi.mocked(generateText).mockResolvedValue({
			output: {
				results: {
					'imagery.mood': {
						observations: {
							'natural-expression': {
								value: 'present',
								confidence: 80,
								reason: '자연스러운 표정이 관측됩니다.',
							},
						},
					},
					'imagery.advice': { advice: '자연광을 더 살리면 무드가 개선됩니다.' },
				},
			},
			usage: {
				inputTokens: 100,
				inputTokenDetails: { noCacheTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0 },
				outputTokens: 20,
				outputTokenDetails: { textTokens: 20, reasoningTokens: 0 },
				totalTokens: 120,
				raw: {},
			},
		} as unknown as Awaited<ReturnType<typeof generateText>>)

		const { runAiCheck } = await import(
			'@/features/asset-check/repositories/ai-check.agent.repository'
		)
		const result = await runAiCheck([...checks, advisoryCheck], {
			image: { data: Buffer.from('png'), mediaType: 'image/png' },
			pixels: [],
			palette: [],
		})

		expect(result.advices).toEqual({
			'imagery.advice': '자연광을 더 살리면 무드가 개선됩니다.',
		})
		expect(result.observations).toEqual({
			'imagery.mood': {
				'natural-expression': {
					value: 'present',
					confidence: 80,
					reason: '자연스러운 표정이 관측됩니다.',
				},
			},
		})

		const request = vi.mocked(generateText).mock.calls[0]?.[0] as {
			messages?: Array<{ content?: Array<{ text?: string }> }>
		}
		const content = request.messages?.[0]?.content ?? []
		const jsonText = content.find((part) => part.text?.startsWith('{"checks":'))?.text
		const serialized = JSON.parse(jsonText ?? '{}') as {
			checks: { key: string; kind: string }[]
		}
		expect(serialized.checks.find((entry) => entry.key === 'imagery.advice')?.kind).toBe(
			'advisory',
		)
		expect(serialized.checks.find((entry) => entry.key === 'imagery.mood')?.kind).toBe(
			'criteria',
		)

		const schema = (
			vi.mocked(Output.object).mock.calls[0]?.[0] as {
				schema: { safeParse: (value: unknown) => { success: boolean } }
			}
		).schema
		expect(
			schema.safeParse({
				results: {
					'imagery.mood': {
						observations: {
							'natural-expression': { value: 'present', confidence: 80, reason: 'ok' },
						},
					},
					'imagery.advice': { advice: '조언 문단' },
				},
			}).success,
		).toBe(true)
		expect(
			schema.safeParse({
				results: {
					'imagery.mood': {
						observations: {
							'natural-expression': { value: 'present', confidence: 80, reason: 'ok' },
						},
					},
					'imagery.advice': { advice: '' },
				},
			}).success,
		).toBe(false)
	})

	it('advisory 체크는 criteria가 없어도 invalid_criteria로 떨어지지 않는다', async () => {
		vi.mocked(generateText).mockResolvedValue({
			output: { results: { 'imagery.advice': { advice: '조언 문단' } } },
			usage: {
				inputTokens: 10,
				inputTokenDetails: { noCacheTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0 },
				outputTokens: 5,
				outputTokenDetails: { textTokens: 5, reasoningTokens: 0 },
				totalTokens: 15,
				raw: {},
			},
		} as unknown as Awaited<ReturnType<typeof generateText>>)
		const { runAiCheck } = await import(
			'@/features/asset-check/repositories/ai-check.agent.repository'
		)

		const result = await runAiCheck([advisoryCheck], {
			image: { data: Buffer.from('png'), mediaType: 'image/png' },
			pixels: [],
			palette: [],
		})

		expect(result.failure).toBeUndefined()
		expect(result.advices['imagery.advice']).toBe('조언 문단')
	})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run src/features/asset-check/repositories/ai-check.agent.repository.test.ts`
Expected: FAIL — `result.advices` undefined, criteria 검증이 advisory 체크를 `invalid_criteria`로 떨어뜨림.

- [ ] **Step 3: repository 구현**

`src/features/asset-check/repositories/ai-check.agent.repository.ts` 수정:

(a) `AiCheckRunResult`에 advices 추가 (12-16행):

```ts
export interface AiCheckRunResult {
	observations: Record<string, Record<string, z.infer<typeof heuristicObservationSchema>>>
	advices: Record<string, string>
	failure?: { detail: string; reasonCode: string }
	aiUsage?: AiUsage
}
```

(b) criteria 검증을 heuristic 체크로 한정 (28-30행):

```ts
	if (
		checks.some(
			(check) => check.executor === 'heuristic' && !check.heuristicCriteria?.length,
		)
	) {
		return failed('Heuristic 판정 기준 없음', 'invalid_criteria')
	}
```

(c) 지시문 배열(49-60행)에서 두 줄 수정·추가 — `'Return one observation for every criterion id.'`를 다음으로 교체:

```ts
									'For checks whose kind is "criteria", return one observation for every criterion id.',
									'For checks whose kind is "advisory", return an advice field instead: one concise Korean paragraph of designer improvement advice about the target image from that check\'s perspective. The advice must not declare pass, fail, or overall approval.',
```

(d) 직렬화 JSON에 kind 추가 (65행 checks.map 내부, `key:` 위):

```ts
									checks: checks.map((check) => ({
										key: check.key,
										kind: check.executor === 'manual' ? 'advisory' : 'criteria',
										titleEn: check.title,
										// …이하 기존 필드 유지
```

(e) `buildAiCheckSchema`를 executor 분기로 교체 (127-147행):

```ts
function buildAiCheckSchema(checks: RuntimeCheck[]) {
	return z.strictObject({
		results: z.strictObject(
			Object.fromEntries(
				checks.map((check) => [
					check.key,
					check.executor === 'manual'
						? z.strictObject({ advice: z.string().min(1).max(600) })
						: z.strictObject({
								observations: z.strictObject(
									Object.fromEntries(
										(check.heuristicCriteria ?? []).map((criterion) => [
											criterion.id,
											heuristicObservationSchema,
										]),
									),
								),
							}),
				]),
			),
		),
	})
}
```

(f) 결과 파싱 분리 (110-119행):

```ts
		const results = output.results as Record<
			string,
			{
				observations?: Record<string, z.infer<typeof heuristicObservationSchema>>
				advice?: string
			}
		>
		return {
			observations: Object.fromEntries(
				checks
					.filter((check) => check.executor !== 'manual')
					.map((check) => [check.key, results[check.key]?.observations ?? {}]),
			),
			advices: Object.fromEntries(
				checks.flatMap((check) => {
					const advice = results[check.key]?.advice
					return check.executor === 'manual' && advice ? [[check.key, advice]] : []
				}),
			),
			aiUsage: toAiUsage(model, usage),
		}
```

(g) `failed()`에 advices 추가 (199-201행):

```ts
function failed(detail: string, reasonCode: string): AiCheckRunResult {
	return { observations: {}, advices: {}, failure: { detail, reasonCode } }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/features/asset-check/repositories/ai-check.agent.repository.test.ts`
Expected: PASS (기존 3개 + 신규 2개).

- [ ] **Step 5: Commit**

```bash
git add src/features/asset-check/repositories/ai-check.agent.repository.ts src/features/asset-check/repositories/ai-check.agent.repository.test.ts
git commit -m "feat: runAiCheck에 advisory advice 스키마 분기 추가"
```

---

### Task 3: `run-check.service` — advisory pending 분기와 모델별 배치

**Files:**
- Modify: `src/features/asset-check/services/run-check.service.ts`
- Test: `src/features/asset-check/services/run-check.service.test.ts`

**Interfaces:**
- Consumes: Task 1의 `evaluateAdvisory`, Task 2의 `AiCheckRunResult.advices`. `toCheckResult`, `evaluateHeuristic`, `runAiCheck` (기존).
- Produces: `runImmediateCheck`는 model 있는 manual 체크를 `pendingCheckKeys`로 분리 (model 없는 manual은 기존 즉시 폴백). `runHeuristicCheck`는 heuristic + manual(model 있음) 체크를 모델별로 나눠 `runAiCheck` 호출, `aiUsage`는 그룹 usage 합산. 외부 시그니처 변경 없음 — `start-check-session.service.ts`는 수정 불필요.

- [ ] **Step 1: 기존 mock에 advices 추가 + 실패하는 테스트 작성**

`src/features/asset-check/services/run-check.service.test.ts`:

(a) 기존 `mockResolvedValue` 4곳 모두에 `advices: {}` 프로퍼티 추가 (Task 2에서 `AiCheckRunResult`가 확장됐으므로).

(b) fixture와 신규 테스트 추가 — `check` 상수 아래에:

```ts
const advisoryCheck: RuntimeCheck = {
	key: 'imagery.advice',
	title: '이미지 디자인 조언',
	checker: { key: 'design-advisor', type: 'manual' },
	executor: 'manual',
	model: 'model',
	prompt: '사진 무드 관점에서 디자이너처럼 조언한다.',
	implemented: true,
	evidence: '자연스러운 일상의 순간',
	referenceAssets: [],
}
```

describe 블록 안에:

```ts
	it('advisory 체크는 조언 문단을 advisory 상태로 반환한다', async () => {
		vi.mocked(runAiCheck).mockResolvedValue({
			observations: {},
			advices: { 'imagery.advice': '자연광을 더 살리면 무드가 개선됩니다.' },
		})

		const result = await runHeuristicCheck(png, [advisoryCheck.key], [advisoryCheck])

		expect(runAiCheck).toHaveBeenCalledWith([advisoryCheck], expect.any(Object))
		expect(result.results[advisoryCheck.key]?.rawResult).toMatchObject({
			status: 'advisory',
			fulfillment: null,
			detail: '자연광을 더 살리면 무드가 개선됩니다.',
		})
	})

	it('모델이 다른 체크는 모델별로 나눠 호출하고 usage를 합산한다', async () => {
		const otherModelCheck = { ...check, key: 'imagery.tone', model: 'other-model' }
		vi.mocked(runAiCheck)
			.mockResolvedValueOnce({
				observations: {
					'imagery-misuse': {
						'artificial-redness': { value: 'absent', confidence: 90, reason: '없음' },
					},
				},
				advices: {},
				aiUsage: { model: 'model', callCount: 1, totalTokens: 100 },
			})
			.mockResolvedValueOnce({
				observations: {
					'imagery.tone': {
						'artificial-redness': { value: 'absent', confidence: 90, reason: '없음' },
					},
				},
				advices: {},
				aiUsage: { model: 'other-model', callCount: 1, totalTokens: 50 },
			})

		const result = await runHeuristicCheck(
			png,
			[check.key, otherModelCheck.key],
			[check, otherModelCheck],
		)

		expect(runAiCheck).toHaveBeenCalledTimes(2)
		expect(runAiCheck).toHaveBeenCalledWith([check], expect.any(Object))
		expect(runAiCheck).toHaveBeenCalledWith([otherModelCheck], expect.any(Object))
		expect(result.results[check.key]?.rawResult.status).toBe('pass')
		expect(result.results[otherModelCheck.key]?.rawResult.status).toBe('pass')
		expect(result.aiUsage).toMatchObject({
			model: 'model, other-model',
			callCount: 2,
			totalTokens: 150,
		})
	})

	it('모델이 없는 manual 체크는 AI 대상에서 제외한다', async () => {
		const manualCheck = { ...advisoryCheck, model: undefined }

		const result = await runHeuristicCheck(png, [manualCheck.key], [manualCheck])

		expect(runAiCheck).not.toHaveBeenCalled()
		expect(result.results[manualCheck.key]).toBeUndefined()
	})

	it('모델이 없는 heuristic 체크는 설정 오류로 격리한다', async () => {
		const noModelCheck = { ...check, key: 'imagery.nomodel', model: undefined }

		const result = await runHeuristicCheck(png, [noModelCheck.key], [noModelCheck])

		expect(runAiCheck).not.toHaveBeenCalled()
		expect(result.results[noModelCheck.key]?.rawResult).toEqual({
			status: 'needs_review',
			fulfillment: null,
			detail: 'AI 검사 도구 설정 오류',
			reasonCode: 'ai_checker_invalid',
		})
	})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run src/features/asset-check/services/run-check.service.test.ts`
Expected: FAIL — advisory 체크가 `runHeuristicCheck` 필터에서 제외되어 결과가 비고, 모델 그룹핑이 없어 호출이 1회.

- [ ] **Step 3: 서비스 구현**

`src/features/asset-check/services/run-check.service.ts` 수정:

(a) import 정리 — `evaluateAdvisory` 추가, `AiCheckRunResult`·`RawCheckResult`·`AiCheckResult` 타입 추가:

```ts
import { evaluateAdvisory, evaluateHeuristic } from '@/features/asset-check/checkers/heuristic-evaluator'
import type {
	AiCheckResult,
	AiUsage,
	AlgorithmCheckResult,
	CheckerContext,
	CheckResult,
	RawCheckResult,
} from '@/features/asset-check/checkers/types'
import {
	type AiCheckRunResult,
	runAiCheck,
} from '@/features/asset-check/repositories/ai-check.agent.repository'
```

(b) AI 대상 판별 헬퍼 추가:

```ts
/** AI 단계로 넘길 Check — heuristic 전부, manual은 model이 설정된 advisory만. */
function isPendingAiCheck(check: RuntimeCheck): boolean {
	return (
		check.executor === 'heuristic' ||
		(check.executor === 'manual' && Boolean(check.model))
	)
}
```

(c) `runImmediateCheck` 분기 교체 (56-59행):

```ts
		if (isPendingAiCheck(check)) {
			pendingCheckKeys.push(check.key)
			continue
		}
```

(d) `runHeuristicCheck` 본문 교체 (72-119행):

```ts
export async function runHeuristicCheck(
	buffer: Buffer,
	checkKeys: string[],
	inputChecks?: RuntimeCheck[],
): Promise<HeuristicCheckResult> {
	const checks = (inputChecks ?? (await getRuntimeChecks(checkKeys))).filter(
		(check) => isPendingAiCheck(check) && checkKeys.includes(check.key),
	)
	if (checks.length === 0) return { results: {} }

	const groups = new Map<string, RuntimeCheck[]>()
	for (const check of checks) {
		if (!check.model) continue
		if (check.executor === 'heuristic' && !check.heuristicCriteria?.length) continue
		groups.set(check.model, [...(groups.get(check.model) ?? []), check])
	}
	const ctx: CheckerContext = { image: imageInputFrom(buffer), pixels: [], palette: [] }
	const runs = await Promise.all(
		[...groups.values()].map(async (group) => ({
			keys: new Set(group.map((check) => check.key)),
			run: await runAiCheck(group, ctx),
		})),
	)
	const runByCheckKey = new Map<string, AiCheckRunResult>()
	for (const { keys, run } of runs) {
		for (const key of keys) runByCheckKey.set(key, run)
	}

	return {
		results: Object.fromEntries(
			checks.map((check) => [
				check.key,
				toCheckResult(toAiRawResult(check, runByCheckKey.get(check.key)), check, {
					key: 'ai',
					type: 'ai',
				}),
			]),
		),
		aiUsage: mergeAiUsages(runs.flatMap(({ run }) => (run.aiUsage ? [run.aiUsage] : []))),
	}
}

/** AI 실행 결과(또는 실행 불가 사유)를 Check 1건의 원판정으로 변환한다. */
function toAiRawResult(check: RuntimeCheck, run: AiCheckRunResult | undefined): RawCheckResult {
	if (check.executor === 'heuristic' && !check.heuristicCriteria?.length) {
		return aiNeedsReview('Heuristic 판정 기준 없음', 'invalid_criteria')
	}
	if (!check.model || !run) {
		return aiNeedsReview('AI 검사 도구 설정 오류', 'ai_checker_invalid')
	}
	if (run.failure) return aiNeedsReview(run.failure.detail, run.failure.reasonCode)
	return check.executor === 'manual'
		? evaluateAdvisory(run.advices[check.key])
		: evaluateHeuristic(check.heuristicCriteria ?? [], run.observations[check.key])
}

function aiNeedsReview(detail: string, reasonCode: string): AiCheckResult {
	return { status: 'needs_review', fulfillment: null, detail, reasonCode }
}

/** 모델 그룹별 usage를 세션 저장용 단일 usage로 합산한다. */
function mergeAiUsages(usages: AiUsage[]): AiUsage | undefined {
	if (usages.length <= 1) return usages[0]
	const total = (read: (usage: AiUsage) => number | undefined) =>
		usages.reduce((sum, usage) => sum + (read(usage) ?? 0), 0)
	return {
		model: usages.map((usage) => usage.model).join(', '),
		callCount: total((usage) => usage.callCount),
		inputTokens: total((usage) => usage.inputTokens),
		outputTokens: total((usage) => usage.outputTokens),
		totalTokens: total((usage) => usage.totalTokens),
		cacheReadInputTokens: total((usage) => usage.cacheReadInputTokens),
		cacheWriteInputTokens: total((usage) => usage.cacheWriteInputTokens),
		reasoningTokens: total((usage) => usage.reasoningTokens),
		rawUsage: { groups: usages.map((usage) => usage.rawUsage ?? {}) },
	}
}
```

(e) `runCheckByExecutor` 위 주석 교체 (130행):

```ts
// AI로 가는 Check(heuristic, model 있는 manual)는 호출 전에 분기되므로 여기 오지 않는다.
// model 없는 manual은 여기서 기존 담당자 확인 폴백을 유지한다.
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/features/asset-check/services/run-check.service.test.ts`
Expected: PASS (기존 4개 + 신규 4개). 기존 테스트 중 "판정 기준이 없는 룰만 격리"는 그룹핑 후에도 `runAiCheck`가 `[check]`로 호출되므로 그대로 통과해야 한다.

- [ ] **Step 5: Commit**

```bash
git add src/features/asset-check/services/run-check.service.ts src/features/asset-check/services/run-check.service.test.ts
git commit -m "feat: advisory 체크 AI 분기와 모델별 배치 분리"
```

---

### Task 4: admin — Advisory (AI) 라벨과 model·prompt 필드 노출

**Files:**
- Modify: `src/collections/RuleCheckers.ts`
- Modify: `src/blocks/guideline.ts:98`
- Test: `src/collections/RuleCheckers.test.ts`

**Interfaces:**
- Consumes: 기존 `requiredSelectFor` validator 패턴.
- Produces: executor 값은 그대로, admin에서 manual 체커가 `Advisory (AI)` 라벨로 보이고 model(선택)·prompt 필드를 입력받는다. 스키마 변화 없음(model·prompt 컬럼 기존재).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/collections/RuleCheckers.test.ts` describe 블록에 추가:

```ts
	it('manual executor는 Advisory (AI) 라벨로 표시하고 model은 선택 입력이다', () => {
		const executor = fieldNamed('executor')
		if (executor?.type !== 'select') throw new Error('executor select is not configured')

		expect(executor.options).toEqual([
			{ label: 'Deterministic', value: 'deterministic' },
			{ label: 'Heuristic (AI)', value: 'heuristic' },
			{ label: 'Advisory (AI)', value: 'manual' },
		])
		expect(validationFor('model')('', { siblingData: { executor: 'manual' } })).toBe(true)
	})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run src/collections/RuleCheckers.test.ts`
Expected: FAIL — executor options가 문자열 배열.

- [ ] **Step 3: 컬렉션·블록 수정**

`src/collections/RuleCheckers.ts`:

(a) executor 옵션 (66-69행):

```ts
		{
			name: 'executor',
			type: 'select',
			required: true,
			options: [
				{ label: 'Deterministic', value: 'deterministic' },
				{ label: 'Heuristic (AI)', value: 'heuristic' },
				{ label: 'Advisory (AI)', value: 'manual' },
			],
		},
```

(b) AI executor 공용 condition을 파일 상단 헬퍼 옆에 추가:

```ts
const aiExecutorCondition = (_data: unknown, siblingData: { executor?: RuleExecutor }) =>
	siblingData?.executor === 'heuristic' || siblingData?.executor === 'manual'
```

(c) `model` 필드 — condition 교체·설명 갱신 (validate는 heuristic 필수 그대로):

```ts
			validate: requiredSelectFor('heuristic', 'Model을 선택하세요.'),
			admin: {
				condition: aiExecutorCondition,
				description:
					'AI 검수에 사용할 Anthropic 모델입니다. Advisory는 미설정 시 브랜드 담당자 확인으로 폴백합니다.',
			},
```

(d) `prompt` 필드 — condition 교체·설명 갱신:

```ts
			admin: {
				condition: aiExecutorCondition,
				description:
					'AI에게 전달할 관찰·조언 지침입니다. Advisory는 이 프롬프트가 조언 관점을 정의합니다 (예: 타이포그래피 위계 관점에서 디자이너처럼 조언). 출력 형식과 판정 금지 규칙은 시스템이 강제합니다.',
			},
```

`src/blocks/guideline.ts` 98행:

```ts
					{ label: 'Advisory (AI)', value: 'manual' },
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/collections/RuleCheckers.test.ts src/blocks/guideline.test.ts`
Expected: PASS. `guideline.test.ts`가 라벨을 단언해 실패하면 해당 단언만 `Advisory (AI)`로 갱신한다.

- [ ] **Step 5: Commit**

```bash
git add src/collections/RuleCheckers.ts src/blocks/guideline.ts src/collections/RuleCheckers.test.ts
git commit -m "feat: manual 체커를 Advisory (AI)로 노출하고 model·prompt 입력 허용"
```

---

### Task 5: 리뷰 요약 — advisory 카운트와 표시

**Files:**
- Modify: `src/features/asset-check/utils/build-check-review-view.ts`
- Modify: `src/features/asset-check/components/check-result-summary.tsx`
- Test: `src/features/asset-check/utils/build-check-review-view.test.ts`

**Interfaces:**
- Consumes: Task 1의 `CheckStatus`(`'advisory'`), `CHECK_STATUS.advisory`.
- Produces: `CheckReviewSummary`에 `advisory: number` 추가. advisory는 pass/ok/fail 어디에도 세지 않고 별도 카운트 (pendingManualCheck에도 넣지 않는다). 요약 UI에 "조언 N" 메트릭 추가.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/asset-check/utils/build-check-review-view.test.ts`:

(a) 기존 summary 단언 2곳(53행·81행)에 `advisory: 0` 추가:

```ts
		expect(view.summary).toEqual({ pass: 0, ok: 0, fail: 0, advisory: 0, pendingManualCheck: 0 })
```

```ts
		expect(view.summary).toEqual({ pass: 2, ok: 1, fail: 2, advisory: 0, pendingManualCheck: 0 })
```

(b) 신규 테스트 추가:

```ts
	it('advisory 결과는 통과/미통과가 아닌 별도 카운트로 센다', () => {
		const selected = image({
			'logo.size.minimum': result('logo.size.minimum', 'pass'),
			'logo.space.clear': result('logo.space.clear', 'advisory'),
		})

		const view = buildCheckReviewView({
			sections,
			scenarios: INITIAL_CHECK_SCENARIOS,
			scenarioKey: 'quick',
			selected,
			showFailOnly: false,
		})

		expect(view.summary).toEqual({
			pass: 1,
			ok: 0,
			fail: 0,
			advisory: 1,
			pendingManualCheck: 3,
		})
	})
```

(quick 시나리오 가시 행이 5개이므로 결과 없는 나머지 3행이 pendingManualCheck이다.)

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run src/features/asset-check/utils/build-check-review-view.test.ts`
Expected: FAIL — summary에 advisory 키 없음, advisory 결과가 pendingManualCheck으로 계산됨.

- [ ] **Step 3: 구현**

`src/features/asset-check/utils/build-check-review-view.ts`:

```ts
export interface CheckReviewSummary {
	pass: number
	ok: number
	fail: number
	advisory: number
	pendingManualCheck: number
}
```

`buildSummary` 교체 (72-85행):

```ts
function buildSummary(rows: CheckReviewRow[], results: CheckImage['results']): CheckReviewSummary {
	const summary = { pass: 0, ok: 0, fail: 0, advisory: 0, pendingManualCheck: 0 }
	if (!results) return summary

	for (const row of rows) {
		const status = row.outcome?.rawResult.status
		if (status === 'pass') summary.pass++
		else if (status === 'ok') summary.ok++
		else if (status === 'fail') summary.fail++
		else if (status === 'advisory') summary.advisory++
		else summary.pendingManualCheck++
	}

	return summary
}
```

`src/features/asset-check/components/check-result-summary.tsx` — ok 메트릭 다음에 추가 (36-40행 뒤):

```tsx
					<SummaryMetric
						label={CHECK_STATUS.advisory.label}
						value={summary.advisory}
						colorClassName={CHECK_STATUS.advisory.dot}
					/>
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/features/asset-check/utils/build-check-review-view.test.ts`
Expected: PASS (기존 4개 + 신규 1개).

- [ ] **Step 5: 전체 검증**

Run: `pnpm tsc --noEmit && pnpm vitest run`
Expected: 타입 에러 0, 전체 테스트 PASS. 실패가 있으면 이 계획 범위의 변경이 원인인 것만 고친다 (기존부터 깨져 있던 테스트는 손대지 않고 보고).

- [ ] **Step 6: Commit**

```bash
git add src/features/asset-check/utils/build-check-review-view.ts src/features/asset-check/utils/build-check-review-view.test.ts src/features/asset-check/components/check-result-summary.tsx
git commit -m "feat: 검수 요약에 advisory 조언 카운트 추가"
```
