# Heuristic Criteria 계약 확장 (kind/measure/N.A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** heuristic criterion을 관찰형(presence)·수치형(measure) 2종으로 확장하고 not_applicable 관측을 도입하되, 판정은 단일 `compare` 파이프라인으로 통합한다.

**Architecture:** criterion 계약 타입(`HeuristicCriterion`)을 `checkers/types.ts`에 두고, evaluator·AI repository·admin 입력·ruleset 매핑·UI가 이 하나의 타입을 공유한다. AI는 criterion kind별 zod 스키마로 관측값만 반환하고, 판정(연산 비교·fulfillment·status)은 전부 `evaluateHeuristic`의 `compare` 한 곳에서 수행한다. 기존 present/absent 데이터는 `kind` 미지정 = presence로 그대로 유효하다 (스냅샷 하위호환).

**Tech Stack:** Payload CMS(blocks array field, drizzle migration), Vercel AI SDK(`generateText`+`Output.object`), zod, vitest.

## Global Constraints

스펙: `docs/superpowers/specs/2026-07-15-check-triage.md`의 "Heuristic Criteria 계약 확장" + "설계 원칙" 섹션.

- executor enum 값(`deterministic|heuristic|manual`)을 추가·변경하지 않는다.
- 새 컬렉션·새 CheckStatus·criterion 전용 admin 커스텀 컴포넌트를 만들지 않는다 (기존 array field UI만).
- criterion kind별 evaluator를 분리하지 않는다 — `compare()` 연산 분기 하나로 통합, comparisons·fulfillment·status 집계 파이프라인은 단일.
- measure operator는 `gte|lte|between`만. `eq`를 두지 않는다 (AI 수치 추정 ±5~10%p).
- `not_applicable`은 uncertain과 구분되는 확신 있는 관측이다. fulfillment 분모에서 제외하며, 모든 criteria가 N/A인 체크는 `pass` + detail `관측 대상 없음`으로 닫는다.
- AI에 보내는 criterion JSON은 기대값·연산에 **블라인드**: `{id, question, kind, unit}`만 전달한다 (기존에도 `{id, question}`만 전달 — 관측 중립 유지).
- 기존 stored rulesetSnapshot(criteria에 kind 없음)은 계속 동작해야 한다 — presence variant의 `kind`는 optional.
- choice/scale kind, criterion 간 조건부 의존은 구현하지 않는다.
- 스키마 변경 워크플로: 로컬 개발은 격리 DB, 완료 시 한 머신에서 `pnpm migrate:create`, `.ts`+snapshot `.json`+`migrations/index.ts` 함께 커밋, push로 갱신된 DB에 migrate 실행 금지, 검증은 fresh DB + `PAYLOAD_DB_PUSH=false`.
- biome 스타일(탭, single quote), 한국어 사용자 문구, Conventional Commits 한국어 요약.

## 실행 준비 (컨트롤러가 Task 1 전에 수행)

- 베이스 브랜치: **main** (stage 브랜치 없음; advisory-checker 작업이 main에만 있음).
- `superpowers:using-git-worktrees`로 워크트리 생성: 브랜치 `feat/heuristic-criteria-measure`.
- 현재 워크트리(`living-brand-system`)의 untracked 스펙 문서 `docs/superpowers/specs/2026-07-15-check-triage.md`를 새 워크트리에 복사하고 이 계획 문서와 함께 첫 커밋: `docs: Check 정리 판정표·criteria 계약 확장 스펙`.
- 새 워크트리에 `.env`·`.env.local` 복사 후 **`.env.local`의 `PAYLOAD_DB_PUSH=false`로 설정** (이 워크트리는 dev 서버로 스키마를 push하지 않는다 — 타입 생성·테스트·마이그레이션 검증만 수행).
- 단위 테스트는 DB 불필요(vitest). Task 5의 마이그레이션 검증만 일회용 DB를 만든다.

---

### Task 1: HeuristicCriterion 계약 타입 + evaluator 단일 compare 파이프라인

**Files:**
- Modify: `src/features/asset-check/checkers/types.ts` (AiCheckResult.observations 확장 + HeuristicCriterion 신설)
- Modify: `src/features/asset-check/checkers/heuristic-evaluator.ts` (전체 재작성 수준)
- Modify: `src/features/asset-check/services/get-check-ruleset.service.ts:41-45` (RuntimeCheck.heuristicCriteria 타입만 교체)
- Test: `src/features/asset-check/checkers/heuristic-evaluator.test.ts`

**Interfaces:**
- Consumes: 기존 `AiCheckResult`(types.ts), 기존 `evaluateHeuristic`/`evaluateAdvisory`.
- Produces (이후 Task가 의존):
  - `HeuristicCriterion` (types.ts export): presence variant `{id: string; question: string; kind?: 'presence'; expected: 'present'|'absent'}` | measure variant `{id: string; question: string; kind: 'measure'; operator: 'gte'|'lte'|'between'; expected: number; max?: number; unit?: string}`
  - `presenceObservationSchema`, `measureObservationSchema`, `type HeuristicObservation` (heuristic-evaluator.ts export)
  - `evaluateHeuristic(criteria: readonly HeuristicCriterion[], observations: Record<string, HeuristicObservation> | undefined): AiCheckResult`
  - 기존 export `heuristicObservationSchema`는 **삭제** (Task 2가 새 스키마로 교체할 때까지 repository가 일시적으로 컴파일 실패 — Task 2에서 해소, 아래 Step 6 참고)

- [ ] **Step 1: types.ts에 HeuristicCriterion 추가 + observations 항목 확장**

`src/features/asset-check/checkers/types.ts`의 `AiCheckResult` 위에 추가하고, `observations` 항목 타입을 교체:

```ts
export type HeuristicCriterion =
	| {
			id: string
			question: string
			/** 미지정은 presence — 기존 저장 데이터·스냅샷 호환 */
			kind?: 'presence'
			expected: 'present' | 'absent'
	  }
	| {
			id: string
			question: string
			kind: 'measure'
			operator: 'gte' | 'lte' | 'between'
			expected: number
			/** between 상한 */
			max?: number
			unit?: string
	  }
```

`AiCheckResult` 내 `observations` 배열 항목을 다음으로 교체:

```ts
	observations?: {
		criterionId: string
		question: string
		kind?: 'presence' | 'measure'
		expected: 'present' | 'absent' | number
		operator?: 'gte' | 'lte' | 'between'
		max?: number
		unit?: string
		actual: 'present' | 'absent' | 'uncertain' | 'not_applicable' | number
		confidence: number
		reason: string
		satisfied: boolean | null
	}[]
```

- [ ] **Step 2: 실패하는 테스트 작성**

`heuristic-evaluator.test.ts`에 기존 describe 유지한 채 추가 (기존 presence 테스트는 수정하지 않는다 — 하위호환 검증):

```ts
const measureCriteria = [
	{
		id: 'logo-area',
		question: '로고가 캔버스에서 차지하는 면적 비율(%)은?',
		kind: 'measure' as const,
		operator: 'between' as const,
		expected: 5,
		max: 30,
		unit: '%',
	},
	{
		id: 'aspect',
		question: '캔버스의 가로/세로 비율은?',
		kind: 'measure' as const,
		operator: 'gte' as const,
		expected: 0.7,
	},
]

describe('evaluateHeuristic - measure', () => {
	it('수치 관측값을 연산 기준으로 비교한다', () => {
		const pass = evaluateHeuristic(measureCriteria, {
			'logo-area': { value: 12, confidence: 80, reason: '로고 점유율 약 12%' },
			aspect: { value: 0.75, confidence: 90, reason: '3:4 비율' },
		})
		const fail = evaluateHeuristic(measureCriteria, {
			'logo-area': { value: 45, confidence: 85, reason: '로고가 과도하게 큼' },
			aspect: { value: 0.75, confidence: 90, reason: '3:4 비율' },
		})

		expect(pass.status).toBe('pass')
		expect(pass.fulfillment).toBe(100)
		expect(fail.status).toBe('fail')
		expect(fail.observations?.[0]?.satisfied).toBe(false)
		expect(fail.observations?.[0]?.actual).toBe(45)
		expect(fail.fulfillment).toBe(50)
	})

	it('lte 연산과 between 하한도 비교한다', () => {
		const lteCriterion = [
			{
				id: 'text-count',
				question: '시그니처 문구 개수는?',
				kind: 'measure' as const,
				operator: 'lte' as const,
				expected: 1,
				unit: '개',
			},
		]
		expect(
			evaluateHeuristic(lteCriterion, {
				'text-count': { value: 1, confidence: 90, reason: '1개' },
			}).status,
		).toBe('pass')
		expect(
			evaluateHeuristic(lteCriterion, {
				'text-count': { value: 3, confidence: 90, reason: '3개' },
			}).status,
		).toBe('fail')
		expect(
			evaluateHeuristic(measureCriteria.slice(0, 1), {
				'logo-area': { value: 3, confidence: 90, reason: '5% 미만' },
			}).status,
		).toBe('fail')
	})

	it('수치형에 숫자가 아닌 관측이 오면 판단 필요로 남긴다', () => {
		const review = evaluateHeuristic(measureCriteria.slice(0, 1), {
			'logo-area': { value: 'uncertain', confidence: 40, reason: '경계 불명확' },
		})
		expect(review.status).toBe('needs_review')
		expect(review.observations?.[0]?.satisfied).toBeNull()
	})
})

describe('evaluateHeuristic - not_applicable', () => {
	it('N/A는 분모에서 제외하고 나머지로 판정한다', () => {
		const result = evaluateHeuristic(criteria, {
			redness: { value: 'not_applicable', confidence: 95, reason: '피부가 없는 이미지' },
			texture: { value: 'present', confidence: 85, reason: '피부 질감 확인' },
		})
		expect(result.status).toBe('pass')
		expect(result.fulfillment).toBe(100)
		expect(result.observations?.[0]?.satisfied).toBeNull()
	})

	it('모든 기준이 N/A면 관측 대상 없음 pass로 닫는다', () => {
		const result = evaluateHeuristic(criteria, {
			redness: { value: 'not_applicable', confidence: 95, reason: '피부 없음' },
			texture: { value: 'not_applicable', confidence: 95, reason: '피부 없음' },
		})
		expect(result.status).toBe('pass')
		expect(result.detail).toBe('관측 대상 없음')
		expect(result.fulfillment).toBeNull()
	})
})

describe('evaluateHeuristic - fulfillment', () => {
	it('presence 기준도 충족 비율을 계산한다', () => {
		const fail = evaluateHeuristic(criteria, {
			redness: { value: 'present', confidence: 90, reason: '홍조 확인' },
			texture: { value: 'present', confidence: 85, reason: '피부 질감 확인' },
		})
		expect(fail.fulfillment).toBe(50)
	})
})
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm vitest run src/features/asset-check/checkers/heuristic-evaluator.test.ts`
Expected: FAIL — measure criterion 타입 불일치(TS) 또는 숫자 관측값 처리 불가.

- [ ] **Step 4: heuristic-evaluator.ts 구현**

파일 전체를 다음으로 교체:

```ts
import { z } from 'zod'
import type { AiCheckResult, HeuristicCriterion } from './types'

export const presenceObservationSchema = z.strictObject({
	value: z.enum(['present', 'absent', 'uncertain', 'not_applicable']),
	confidence: z.number().min(0).max(100),
	reason: z.string().min(1).max(300),
})

export const measureObservationSchema = z.strictObject({
	value: z.union([z.number(), z.enum(['uncertain', 'not_applicable'])]),
	confidence: z.number().min(0).max(100),
	reason: z.string().min(1).max(300),
})

export type HeuristicObservation =
	| z.infer<typeof presenceObservationSchema>
	| z.infer<typeof measureObservationSchema>

/** AI 관측값을 Check 기준과 비교해 최종 상태를 결정한다. kind와 무관하게 compare 한 곳에서 판정한다. */
export function evaluateHeuristic(
	criteria: readonly HeuristicCriterion[],
	observations: Record<string, HeuristicObservation> | undefined,
): AiCheckResult {
	if (criteria.length === 0) return needsReview('판정 기준 없음', 'invalid_criteria')
	if (!observations) return needsReview('AI 관측 결과 없음', 'ai_output_invalid')

	const comparisons = criteria.map((criterion) => {
		const observation = observations[criterion.id]
		if (!observation) return null
		return {
			criterionId: criterion.id,
			question: criterion.question,
			kind: criterion.kind ?? 'presence',
			expected: criterion.expected,
			operator: criterion.kind === 'measure' ? criterion.operator : undefined,
			max: criterion.kind === 'measure' ? criterion.max : undefined,
			unit: criterion.kind === 'measure' ? criterion.unit : undefined,
			actual: observation.value,
			confidence: observation.confidence,
			reason: observation.reason,
			satisfied:
				observation.value === 'uncertain' || observation.value === 'not_applicable'
					? null
					: compare(criterion, observation.value),
		}
	})
	if (comparisons.some((comparison) => comparison === null)) {
		return needsReview('AI 관측 결과 누락', 'ai_output_invalid')
	}

	const complete = comparisons.filter((comparison) => comparison !== null)
	const applicable = complete.filter((comparison) => comparison.actual !== 'not_applicable')
	if (applicable.length === 0) {
		return {
			status: 'pass',
			fulfillment: null,
			detail: '관측 대상 없음',
			observations: complete,
		}
	}

	const failed = applicable.filter((comparison) => comparison.satisfied === false).length
	const uncertain = applicable.filter((comparison) => comparison.satisfied === null).length
	const satisfied = applicable.filter((comparison) => comparison.satisfied === true).length
	const status = failed > 0 ? 'fail' : uncertain > 0 ? 'needs_review' : 'pass'

	return {
		status,
		fulfillment: Math.round((satisfied / applicable.length) * 100),
		detail:
			status === 'fail'
				? `기준 ${failed}개 미충족`
				: status === 'needs_review'
					? `기준 ${uncertain}개 판단 필요`
					: `기준 ${applicable.length}개 충족`,
		observations: complete,
	}
}

/** kind별 관측값-기준 비교. 관측값 타입이 기준과 어긋나면 판정 불가(null)로 남긴다. */
function compare(
	criterion: HeuristicCriterion,
	value: 'present' | 'absent' | number,
): boolean | null {
	if (criterion.kind === 'measure') {
		if (typeof value !== 'number') return null
		if (criterion.operator === 'gte') return value >= criterion.expected
		if (criterion.operator === 'lte') return value <= criterion.expected
		return value >= criterion.expected && value <= (criterion.max ?? criterion.expected)
	}
	return typeof value === 'number' ? null : value === criterion.expected
}

function needsReview(detail: string, reasonCode: string): AiCheckResult {
	return { status: 'needs_review', fulfillment: null, detail, reasonCode }
}

/** AI 조언 문단을 advisory 결과로 감싼다. 조언만 싣고 판정은 만들지 않는다. */
export function evaluateAdvisory(advice: string | undefined): AiCheckResult {
	const trimmed = advice?.trim()
	if (!trimmed) return needsReview('AI 조언 없음', 'ai_output_invalid')
	return { status: 'advisory', fulfillment: null, detail: trimmed }
}
```

주의: 기존 `heuristicObservationSchema` export는 삭제된다. presence 기준의 fulfillment가 `null` → 비율로 바뀐다 (기존 evaluator 테스트에 fulfillment null 단언은 없음 — advisory만 null 단언 유지).

- [ ] **Step 5: RuntimeCheck 타입 교체**

`src/features/asset-check/services/get-check-ruleset.service.ts`:
- import 추가: `import type { HeuristicCriterion } from '@/features/asset-check/checkers/types'` (기존 checkers/types import가 있으면 거기 병합)
- 41~45행의 inline 타입을 교체:

```ts
	heuristicCriteria?: HeuristicCriterion[]
```

`toRuntimeCheck`의 매핑 로직은 이 Task에서 바꾸지 않는다 (기존 `{id, question, expected}` 산출물은 presence variant에 그대로 대입 가능).

- [ ] **Step 6: 테스트 통과·경계 확인**

Run: `pnpm vitest run src/features/asset-check/checkers/heuristic-evaluator.test.ts src/features/asset-check/services/get-check-ruleset.service.test.ts`
Expected: PASS.

Run: `pnpm typecheck`
Expected: **FAIL — `src/features/asset-check/repositories/ai-check.agent.repository.ts`의 `heuristicObservationSchema` import 1건만** (Task 2가 해소). 다른 파일 오류가 있으면 이 Task에서 고친다. 이 상태를 report에 명시한다.

- [ ] **Step 7: Commit**

```bash
git add src/features/asset-check/checkers/types.ts src/features/asset-check/checkers/heuristic-evaluator.ts src/features/asset-check/services/get-check-ruleset.service.ts src/features/asset-check/checkers/heuristic-evaluator.test.ts
git commit -m "feat: heuristic criterion presence/measure 계약과 단일 compare 판정 도입"
```

---

### Task 2: AI 응답 스키마·프롬프트 — kind별 관측 계약

**Files:**
- Modify: `src/features/asset-check/repositories/ai-check.agent.repository.ts`
- Test: `src/features/asset-check/repositories/ai-check.agent.repository.test.ts`

**Interfaces:**
- Consumes (Task 1): `presenceObservationSchema`, `measureObservationSchema`, `HeuristicObservation`, `HeuristicCriterion`(RuntimeCheck.heuristicCriteria 경유).
- Produces: `AiCheckRunResult.observations: Record<string, Record<string, HeuristicObservation>>` (run-check.service가 그대로 사용 — 시그니처 변화 없음).

- [ ] **Step 1: 실패하는 테스트 작성**

`ai-check.agent.repository.test.ts`의 기존 픽스처 스타일을 따라 추가 (기존 테스트의 mock 구조 확인 후 동일 패턴 사용):

```ts
it('measure criterion은 숫자 관측 스키마로, presence는 enum 스키마로 조립한다', async () => {
	// 기존 heuristic check 픽스처를 복제해 criteria만 교체
	const measureCheck = {
		...heuristicCheck,
		key: 'logo.size.minimum',
		heuristicCriteria: [
			{
				id: 'logo-area',
				question: '로고 점유 면적 비율(%)은?',
				kind: 'measure' as const,
				operator: 'gte' as const,
				expected: 5,
				unit: '%',
			},
			{ id: 'legible', question: '로고가 판독 가능한가?', expected: 'present' as const },
		],
	}
	mockGenerateText.mockResolvedValueOnce({
		output: {
			results: {
				'logo.size.minimum': {
					observations: {
						'logo-area': { value: 12, confidence: 80, reason: '약 12%' },
						legible: { value: 'present', confidence: 90, reason: '선명함' },
					},
				},
			},
		},
		usage: usageFixture,
	})

	const result = await runAiCheck([measureCheck], ctx)

	expect(result.failure).toBeUndefined()
	expect(result.observations['logo.size.minimum']?.['logo-area']?.value).toBe(12)
	// AI에 전달된 criteria JSON은 기대값·연산에 블라인드
	const serialized = JSON.parse(
		mockGenerateText.mock.calls.at(-1)?.[0].messages[0].content[1].text,
	)
	expect(serialized.checks[0].criteria[0]).toEqual({
		id: 'logo-area',
		question: '로고 점유 면적 비율(%)은?',
		kind: 'measure',
		unit: '%',
	})
	expect(serialized.checks[0].criteria[1]).toEqual({
		id: 'legible',
		question: '로고가 판독 가능한가?',
		kind: 'presence',
	})
})
```

주의: 위 픽스처·mock 이름(`heuristicCheck`, `mockGenerateText`, `usageFixture`, `ctx`)은 기존 테스트 파일의 실제 이름으로 맞춘다. `Output.object` 스키마 검증 방식이 mock이라 스키마 자체는 zod 단위로 직접 확인:

```ts
it('kind별 관측값 스키마를 강제한다', () => {
	expect(
		presenceObservationSchema.safeParse({
			value: 'not_applicable',
			confidence: 95,
			reason: '대상 없음',
		}).success,
	).toBe(true)
	expect(measureObservationSchema.safeParse({ value: 12, confidence: 80, reason: '12%' }).success).toBe(
		true,
	)
	expect(
		measureObservationSchema.safeParse({ value: 'present', confidence: 80, reason: 'x' }).success,
	).toBe(false)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run src/features/asset-check/repositories/ai-check.agent.repository.test.ts`
Expected: FAIL (import 오류 — 삭제된 `heuristicObservationSchema` — 또는 serialized criteria에 kind 없음).

- [ ] **Step 3: repository 구현**

`ai-check.agent.repository.ts` 변경 4곳:

(a) import 교체:

```ts
import {
	type HeuristicObservation,
	measureObservationSchema,
	presenceObservationSchema,
} from '@/features/asset-check/checkers/heuristic-evaluator'
```

(b) `AiCheckRunResult`와 결과 캐스트의 관측 타입 교체:

```ts
export interface AiCheckRunResult {
	observations: Record<string, Record<string, HeuristicObservation>>
	advices: Record<string, string>
	failure?: { detail: string; reasonCode: string }
	aiUsage?: AiUsage
}
```

결과 캐스트(기존 115행 부근):

```ts
		const results = output.results as Record<
			string,
			{
				observations?: Record<string, HeuristicObservation>
				advice?: string
			}
		>
```

(c) 사용자 프롬프트 지침 — 기존 `'Return present when ...'` 한 줄을 다음 세 줄로 교체:

```ts
									'Each criterion carries a kind. For "presence" criteria, return present when the questioned condition is visibly present, absent when it is visibly absent, and uncertain when pixels or supplied context are insufficient.',
									'For "measure" criteria, estimate the numeric answer to the question in the stated unit and return the bare number as value; return "uncertain" when the image cannot support an estimate.',
									'For any criterion, return "not_applicable" when the element the question asks about does not exist in the target image at all.',
```

(d) criteria 직렬화(기존 78행 부근)와 `buildAiCheckSchema` 교체:

```ts
									criteria: (check.heuristicCriteria ?? []).map((criterion) => ({
										id: criterion.id,
										question: criterion.question,
										kind: criterion.kind ?? 'presence',
										unit:
											criterion.kind === 'measure' ? criterion.unit : undefined,
									})),
```

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
											criterion.kind === 'measure'
												? measureObservationSchema
												: presenceObservationSchema,
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

- [ ] **Step 4: 테스트·typecheck 통과 확인**

Run: `pnpm vitest run src/features/asset-check/repositories/ai-check.agent.repository.test.ts src/features/asset-check/services/run-check.service.test.ts && pnpm typecheck`
Expected: 모두 PASS (Task 1의 일시적 typecheck 실패가 여기서 해소).

- [ ] **Step 5: Commit**

```bash
git add src/features/asset-check/repositories/ai-check.agent.repository.ts src/features/asset-check/repositories/ai-check.agent.repository.test.ts
git commit -m "feat: AI 관측 스키마를 criterion kind별로 분기하고 N/A 지침 추가"
```

---

### Task 3: admin criteria 입력 확장 + ruleset 매핑

**Files:**
- Modify: `src/blocks/guideline.ts` (criteria array 필드 + `validateHeuristicCriteria`)
- Modify: `src/features/asset-check/services/get-check-ruleset.service.ts` (`toRuntimeCheck` criteria 매핑)
- Modify: `src/payload-types.ts` (재생성)
- Test: `src/blocks/guideline.test.ts`, `src/features/asset-check/services/get-check-ruleset.service.test.ts`

**Interfaces:**
- Consumes (Task 1): `HeuristicCriterion`.
- Produces: criteria row 신규 저장 필드 `kind`('presence'|'measure', 기본 presence) / `operator`('gte'|'lte'|'between') / `expectedValue`(number) / `max`(number) / `unit`(text). 숫자 기대값 컬럼은 기존 enum 컬럼 `expected`와 분리하기 위해 `expectedValue`로 명명 — DB 컬럼 충돌 방지.

- [ ] **Step 1: 실패하는 테스트 작성**

`guideline.test.ts`에 추가 (기존 필드 구조 테스트 패턴 재사용):

```ts
it('criteria row는 kind에 따라 관찰형/수치형 입력을 나눈다', () => {
	const checks = guidelineChecksField() as { fields: { name?: string; fields?: unknown[] }[] }
	const criteria = checks.fields.find(
		(field) => 'name' in field && field.name === 'criteria',
	) as {
		validate: (value: unknown, args: { siblingData: unknown }) => true | string
		fields: { fields: { name: string; required?: boolean }[] }[]
	}
	const rowFieldNames = criteria.fields.flatMap((row) => row.fields.map((field) => field.name))
	expect(rowFieldNames).toEqual(
		expect.arrayContaining(['question', 'kind', 'expected', 'operator', 'expectedValue', 'max', 'unit']),
	)

	const heuristic = { executor: 'heuristic' }
	// 관찰형: expected 필수
	expect(
		criteria.validate([{ kind: 'presence', question: 'q' }], { siblingData: heuristic }),
	).toContain('적합 기준')
	// 수치형: operator/expectedValue 필수
	expect(
		criteria.validate([{ kind: 'measure', question: 'q' }], { siblingData: heuristic }),
	).toContain('연산과 기대값')
	// between: max > expectedValue
	expect(
		criteria.validate(
			[{ kind: 'measure', question: 'q', operator: 'between', expectedValue: 30, max: 5 }],
			{ siblingData: heuristic },
		),
	).toContain('최대값')
	// 정상 케이스
	expect(
		criteria.validate(
			[
				{ kind: 'presence', question: 'q', expected: 'present' },
				{ kind: 'measure', question: 'q', operator: 'between', expectedValue: 5, max: 30, unit: '%' },
			],
			{ siblingData: heuristic },
		),
	).toBe(true)
	// kind 미지정 기존 데이터는 presence로 검증
	expect(
		criteria.validate([{ question: 'q', expected: 'absent' }], { siblingData: heuristic }),
	).toBe(true)
})
```

`get-check-ruleset.service.test.ts`에 추가 (기존 toRuntimeCheck/getRuntimeChecks 테스트 픽스처 패턴 재사용 — 실제 픽스처 헬퍼 이름에 맞춘다):

```ts
it('measure criterion을 HeuristicCriterion으로 매핑하고 불완전 행은 버린다', async () => {
	// heuristic check 픽스처의 criteria를 다음으로 교체해 조회
	// [
	//   { id: 'c1', question: '로고 점유율(%)은?', kind: 'measure', operator: 'gte', expectedValue: 5, unit: '%' },
	//   { id: 'c2', question: '불완전 수치형', kind: 'measure' },            // operator/expectedValue 없음 → 제외
	//   { id: 'c3', question: '관찰형', expected: 'present' },               // kind 미지정 → presence
	// ]
	const check = /* 픽스처 조회 결과 */
	expect(check.heuristicCriteria).toEqual([
		{ id: 'c1', question: '로고 점유율(%)은?', kind: 'measure', operator: 'gte', expected: 5, max: undefined, unit: '%' },
		{ id: 'c3', question: '관찰형', expected: 'present' },
	])
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run src/blocks/guideline.test.ts src/features/asset-check/services/get-check-ruleset.service.test.ts`
Expected: FAIL (신규 필드 없음, 매핑 없음).

- [ ] **Step 3: guideline.ts criteria 필드 구현**

`validateHeuristicCriteria`를 다음으로 교체:

```ts
type HeuristicCriterionRow = {
	kind?: string
	expected?: string
	operator?: string
	expectedValue?: number
	max?: number
}

const validateHeuristicCriteria: NonNullable<ArrayField['validate']> = (value, { siblingData }) => {
	const executor = (siblingData as { executor?: CheckExecutor })?.executor
	if (executor !== 'heuristic') return true
	if (!Array.isArray(value) || value.length === 0) {
		return 'Heuristic Check에는 판정 기준이 1개 이상 필요합니다.'
	}
	for (const row of value as HeuristicCriterionRow[]) {
		if (row?.kind === 'measure') {
			if (!row.operator || typeof row.expectedValue !== 'number') {
				return '수치형 기준에는 연산과 기대값이 필요합니다.'
			}
			if (
				row.operator === 'between' &&
				!(typeof row.max === 'number' && row.max > row.expectedValue)
			) {
				return '범위(between) 기준에는 기대값보다 큰 최대값이 필요합니다.'
			}
		} else if (row?.expected !== 'present' && row?.expected !== 'absent') {
			return '관찰형 기준에는 적합 기준(있어야 함/없어야 함)이 필요합니다.'
		}
	}
	return true
}
```

criteria array의 `fields`를 다음으로 교체 (기존 `expected`의 `required: true`는 제거 — 검증은 위 array validate가 수행. Payload는 admin.condition과 무관하게 required를 검증하므로 measure 행이 저장 불가해지는 것을 막기 위함):

```ts
			fields: [
				{
					type: 'row',
					fields: [
						{
							name: 'question',
							type: 'text',
							required: true,
							maxLength: 300,
							label: '판정 질문',
							admin: { width: '55%' },
						},
						{
							name: 'kind',
							enumName: 'enum_heuristic_criterion_kind',
							type: 'select',
							required: true,
							defaultValue: 'presence',
							label: '기준 유형',
							options: [
								{ label: '관찰형', value: 'presence' },
								{ label: '수치형', value: 'measure' },
							],
							admin: { width: '20%' },
						},
						{
							name: 'expected',
							enumName: 'enum_heuristic_criterion_expected',
							type: 'select',
							label: '적합 기준',
							options: [
								{ label: '있어야 함', value: 'present' },
								{ label: '없어야 함', value: 'absent' },
							],
							admin: {
								width: '25%',
								condition: (_data, siblingData) =>
									(siblingData as { kind?: string })?.kind !== 'measure',
							},
						},
					],
				},
				{
					type: 'row',
					fields: [
						{
							name: 'operator',
							enumName: 'enum_heuristic_criterion_operator',
							type: 'select',
							label: '연산',
							options: [
								{ label: '이상 (≥)', value: 'gte' },
								{ label: '이하 (≤)', value: 'lte' },
								{ label: '범위', value: 'between' },
							],
							admin: { width: '25%', condition: measureCriterionCondition },
						},
						{
							name: 'expectedValue',
							type: 'number',
							label: '기대값',
							admin: { width: '25%', condition: measureCriterionCondition },
						},
						{
							name: 'max',
							type: 'number',
							label: '최대값',
							admin: {
								width: '25%',
								condition: (_data, siblingData) =>
									(siblingData as { kind?: string; operator?: string })?.kind ===
										'measure' &&
									(siblingData as { operator?: string })?.operator === 'between',
							},
						},
						{
							name: 'unit',
							type: 'text',
							maxLength: 20,
							label: '단위',
							admin: { width: '25%', condition: measureCriterionCondition },
						},
					],
				},
			],
```

파일 상단(다른 condition 헬퍼 옆)에 추가:

```ts
const measureCriterionCondition = (_data: unknown, siblingData: { kind?: string }) =>
	siblingData?.kind === 'measure'
```

- [ ] **Step 4: payload 타입 재생성**

Run: `pnpm generate:types`
Expected: `src/payload-types.ts` 갱신 (criteria row에 kind/operator/expectedValue/max/unit 추가). diff가 criteria 관련 외 변경을 포함하면 중단하고 보고.

- [ ] **Step 5: toRuntimeCheck 매핑 구현**

`get-check-ruleset.service.ts`의 `heuristicCriteria` 계산을 교체:

```ts
	const heuristicCriteria =
		checker.executor === 'heuristic'
			? (check.criteria ?? []).flatMap((criterion): HeuristicCriterion[] => {
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
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm vitest run src/blocks/guideline.test.ts src/features/asset-check/services/get-check-ruleset.service.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/blocks/guideline.ts src/features/asset-check/services/get-check-ruleset.service.ts src/payload-types.ts src/blocks/guideline.test.ts src/features/asset-check/services/get-check-ruleset.service.test.ts
git commit -m "feat: criteria admin 입력에 수치형(kind/operator/기대값/단위) 확장"
```

---

### Task 4: 결과 UI — measure·N/A 표시

**Files:**
- Create: `src/features/asset-check/components/check-observation-format.ts`
- Modify: `src/features/asset-check/components/check-tables.tsx` (`HeuristicObservations` 셀 3곳)
- Test: `src/features/asset-check/components/check-observation-format.test.ts`

**Interfaces:**
- Consumes (Task 1): `AiCheckResult['observations']` 항목 타입.
- Produces: `formatObservationExpected(observation): string`, `formatObservationActual(observation): string` — 인자 타입은 `NonNullable<AiCheckResult['observations']>[number]`.

- [ ] **Step 1: 실패하는 테스트 작성**

`check-observation-format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
	formatObservationActual,
	formatObservationExpected,
} from './check-observation-format'

const base = { criterionId: 'c', question: 'q', confidence: 80, reason: 'r', satisfied: true }

describe('formatObservationExpected', () => {
	it('presence 기준을 한국어로 표기한다', () => {
		expect(formatObservationExpected({ ...base, expected: 'present', actual: 'present' })).toBe(
			'있어야 함',
		)
		expect(formatObservationExpected({ ...base, expected: 'absent', actual: 'absent' })).toBe(
			'없어야 함',
		)
	})

	it('measure 기준을 연산·단위와 함께 표기한다', () => {
		expect(
			formatObservationExpected({
				...base,
				kind: 'measure',
				expected: 5,
				operator: 'gte',
				unit: '%',
				actual: 12,
			}),
		).toBe('5% 이상')
		expect(
			formatObservationExpected({
				...base,
				kind: 'measure',
				expected: 1,
				operator: 'lte',
				unit: '개',
				actual: 1,
			}),
		).toBe('1개 이하')
		expect(
			formatObservationExpected({
				...base,
				kind: 'measure',
				expected: 5,
				max: 30,
				operator: 'between',
				unit: '%',
				actual: 12,
			}),
		).toBe('5~30%')
	})
})

describe('formatObservationActual', () => {
	it('관측값을 한국어로 표기한다', () => {
		expect(formatObservationActual({ ...base, expected: 'present', actual: 'present' })).toBe('있음')
		expect(formatObservationActual({ ...base, expected: 'present', actual: 'uncertain' })).toBe(
			'판단 불가',
		)
		expect(
			formatObservationActual({ ...base, expected: 'present', actual: 'not_applicable' }),
		).toBe('해당 없음')
		expect(
			formatObservationActual({
				...base,
				kind: 'measure',
				expected: 5,
				operator: 'gte',
				unit: '%',
				actual: 12,
			}),
		).toBe('12%')
	})
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run src/features/asset-check/components/check-observation-format.test.ts`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: 구현**

`check-observation-format.ts`:

```ts
import type { AiCheckResult } from '@/features/asset-check/checkers/types'

type ObservationEntry = NonNullable<AiCheckResult['observations']>[number]

/** 검수 결과 표의 기준값 셀 문구. 판정 로직 없이 표기만 담당한다. */
export function formatObservationExpected(observation: ObservationEntry): string {
	if (typeof observation.expected !== 'number') {
		return observation.expected === 'present' ? '있어야 함' : '없어야 함'
	}
	const unit = observation.unit ?? ''
	if (observation.operator === 'gte') return `${observation.expected}${unit} 이상`
	if (observation.operator === 'lte') return `${observation.expected}${unit} 이하`
	return `${observation.expected}~${observation.max}${unit}`
}

/** 검수 결과 표의 관찰값 셀 문구. */
export function formatObservationActual(observation: ObservationEntry): string {
	if (typeof observation.actual === 'number') {
		return `${observation.actual}${observation.unit ?? ''}`
	}
	if (observation.actual === 'present') return '있음'
	if (observation.actual === 'absent') return '없음'
	if (observation.actual === 'not_applicable') return '해당 없음'
	return '판단 불가'
}
```

`check-tables.tsx`의 `HeuristicObservations` 셀 교체 — import 추가 후:

```tsx
							<td className="px-3 py-2 align-top whitespace-nowrap">
								{formatObservationExpected(observation)}
							</td>
							<td className="px-3 py-2 align-top whitespace-nowrap">
								{formatObservationActual(observation)} ({observation.confidence}%)
							</td>
							<td className="px-3 py-2 align-top whitespace-nowrap">
								{observation.satisfied === true
									? '충족'
									: observation.satisfied === false
										? '미충족'
										: observation.actual === 'not_applicable'
											? '해당 없음'
											: '검토 필요'}
							</td>
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/features/asset-check/components/check-observation-format.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/asset-check/components/check-observation-format.ts src/features/asset-check/components/check-observation-format.test.ts src/features/asset-check/components/check-tables.tsx
git commit -m "feat: 검수 결과 표에 수치형 기준·해당 없음 표기 추가"
```

---

### Task 5: 스키마 마이그레이션 생성·검증 + 전체 게이트

**Files:**
- Create: `migrations/<timestamp>_heuristic_criterion_measure.ts` + 같은 이름 `.json` (자동 생성)
- Modify: `migrations/index.ts` (자동 생성)

**Interfaces:**
- Consumes: Task 3의 guideline.ts 스키마 변경 (criteria 컬럼: kind/operator/expected_value/max/unit — Check를 가진 모든 블록 테이블 + 버전 테이블).
- Produces: 공유 DB에 적용할 커밋된 마이그레이션.

- [ ] **Step 1: 마이그레이션 생성**

Run: `pnpm migrate:create heuristic_criterion_measure`
Expected: `migrations/`에 새 `.ts`+`.json` 생성, `index.ts` 갱신. 생성된 `.ts`가 criteria 관련 `ADD COLUMN`(kind/operator/expected_value/max/unit — `*_checks_criteria` 계열 및 대응 버전 테이블)과 enum 생성만 포함하는지 열어서 확인. 전체 스키마 재생성(수백 줄 CREATE TABLE)이면 **중단하고 보고** — snapshot 누락 신호.

- [ ] **Step 2: fresh DB 검증**

```bash
createdb hd_cms_criteria_verify
DATABASE_URL=postgresql://payload@localhost:5432/hd_cms_criteria_verify PAYLOAD_DB_PUSH=false pnpm migrate
```

Expected: 전체 마이그레이션(신규 포함) 성공. 이후 확인·정리:

```bash
psql postgresql://payload@localhost:5432/hd_cms_criteria_verify -c "\d guideline_docs_checks_criteria" | grep -E "kind|operator|expected_value|max|unit"
dropdb hd_cms_criteria_verify
```

Expected: 신규 컬럼 5종 존재. (접속 사용자·비밀번호는 이 워크트리 `.env.local`의 `DATABASE_URL` 계정을 재사용해 구성한다.)

- [ ] **Step 3: 전체 게이트**

Run: `pnpm check && pnpm typecheck && pnpm vitest run`
Expected: 모두 PASS.

- [ ] **Step 4: Commit**

```bash
git add migrations/
git commit -m "chore: heuristic criterion 수치형 컬럼 마이그레이션 추가"
```

---

## Self-Review 결과

- 스펙 커버리지: kind 2종(Task 1·3), 단일 compare(Task 1), N/A·all-N/A pass(Task 1), fulfillment 분모 제외(Task 1), AI 스키마 분기·블라인드 직렬화·N/A 지침(Task 2), admin 입력·검증(Task 3), 마이그레이션 워크플로(Task 5), UI 표기(Task 4) — 스펙의 "criteria 계약 확장" 섹션 전 항목에 대응 태스크 존재.
- 후속(이 계획 범위 밖): 판정표 3~4단계(룰별 criteria 데이터 작성·일괄 반영 스크립트)는 별도 진행.
- 타입 일관성: `HeuristicCriterion`(types.ts) ← evaluator·repository·ruleset 매핑·UI가 동일 import. 숫자 기대값 저장명 `expectedValue` ↔ 런타임 계약 `expected`(number) 매핑은 Task 3 Step 5 한 곳에서만 수행.
- 알려진 일시 상태: Task 1 완료 시점에 repository의 구 import 1건으로 typecheck 실패 — Task 1 report에 명시, Task 2 Step 4에서 해소 확인.
