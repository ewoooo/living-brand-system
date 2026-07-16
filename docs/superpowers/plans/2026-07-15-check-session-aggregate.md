# CheckSession Aggregate 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CheckSession의 상태 전이·결과 병합 규칙을 서비스 함수에서 클래스 Aggregate로 옮기고, pendingCheckKeys를 세션에 영속화해 `/api/check/ai`가 클라이언트 입력 대신 서버 저장값을 쓰게 한다.

**Architecture:** `src/features/asset-check/domain/check-session.ts`에 CheckSession Aggregate(전이 메서드만 공개, 종결 상태에서 throw)를 신설한다. Repository가 Aggregate ↔ Payload 레코드 변환을 소유하고, 서비스는 오케스트레이션만 한다. 스펙: `docs/superpowers/specs/2026-07-15-check-session-aggregate-design.md`.

**Tech Stack:** Payload CMS(Local API·postgres), Vitest, TypeScript strict.

## Global Constraints

- 작업 위치: 워크트리 `/Users/plusx/Documents/living-brand-system/.agents/worktrees/refactor-check-session-aggregate` (브랜치 `refactor/check-session-aggregate`, main 기반).
- 워크트리 최초 사용 전 필수: `cp /Users/plusx/Documents/living-brand-system/.env /Users/plusx/Documents/living-brand-system/.env.local .agents/worktrees/refactor-check-session-aggregate/ 2>/dev/null; pnpm install` — 없으면 int 스위트가 조용히 누락돼 테스트 수가 줄어든 채 통과한 것처럼 보인다.
- 전체 테스트 기대 개수: 기존 250 + 이 계획의 신규 6 = **256**. 이보다 적으면 스위트 로드 실패를 의심할 것.
- 커밋 메시지: Conventional Commits + 한국어 요약, 끝에 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- 코드 스타일: 탭 들여쓰기, 기존 파일의 주석 밀도 유지. 서비스 파일은 export 함수 위에 유스케이스 경계 주석 필수(기존 주석 갱신).
- 완료된 세션 멱등 응답: AI 재실행 없이 저장된 `session.results` 전체를 200으로 반환. failed 세션은 `CheckSessionTerminalError` → route가 409.
- 기존 데이터 백필 없음: `pendingCheckKeys`가 null인 레코드는 `fromRecord`에서 빈 배열 취급.
- `pnpm migrate:create`는 Task 4에서 한 번만. 로컬 push DB에 생성된 마이그레이션을 실행하지 말 것.

---

### Task 1: CheckSessions 컬렉션에 pendingCheckKeys 필드 추가

**Files:**
- Modify: `src/collections/CheckSessions.ts` (results 필드 뒤, 68~74행 부근)
- Modify: `src/payload-types.ts` (자동 재생성)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: Payload 타입 `CheckSession.pendingCheckKeys?: JsonValue` — Task 2의 `fromRecord`가 읽는다.

- [ ] **Step 1: 필드 추가**

`src/collections/CheckSessions.ts`의 `results` 필드 정의 바로 뒤에 추가:

```ts
		{
			name: 'pendingCheckKeys',
			type: 'json',
			admin: {
				description: 'AI 후속 검수가 남은 Check key 목록입니다.',
			},
		},
```

- [ ] **Step 2: 타입 재생성**

Run: `pnpm generate:types`
Expected: `src/payload-types.ts`의 `CheckSession` 인터페이스에 `pendingCheckKeys` 옵셔널 필드가 생긴다.

- [ ] **Step 3: 타입 검사**

Run: `pnpm typecheck`
Expected: 에러 0.

- [ ] **Step 4: Commit**

```bash
git add src/collections/CheckSessions.ts src/payload-types.ts
git commit -m "feat: CheckSession에 pendingCheckKeys 필드 추가"
```

---

### Task 2: CheckSession Aggregate 클래스 (TDD)

**Files:**
- Create: `src/features/asset-check/domain/check-session.ts`
- Test: `src/features/asset-check/domain/check-session.test.ts`

**Interfaces:**
- Consumes: Task 1의 `CheckSession` payload 타입(`pendingCheckKeys` 포함), `CheckResult`/`AiUsage`(`@/features/asset-check/checkers/types`), `RuntimeCheck`(`@/features/asset-check/services/get-check-ruleset.service`)
- Produces (Task 3이 사용):
  - `class CheckSession` — `static fromRecord(record: CheckSessionRecord): CheckSession`, getter `id: number`/`status`/`results: Record<string, CheckResult>`/`pendingCheckKeys: string[]`/`rulesetSnapshot: RuntimeCheck[] | undefined`/`isCompleted: boolean`/`isFailed: boolean`, 메서드 `applyImmediateResults({ results, pendingCheckKeys })`/`applyAiResults({ results, aiUsage? })`/`fail(errorMessage: string)`/`toUpdateData()`
  - `class CheckSessionStateError extends Error`
  - `class CheckSessionTerminalError extends Error`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/asset-check/domain/check-session.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import type { CheckSession as CheckSessionRecord } from '@/payload-types'
import { CheckSession, CheckSessionStateError } from './check-session'

function checkResult(key: string): CheckResult {
	return {
		rule: { key, title: key, executor: 'heuristic' },
		checker: { key: 'ai', type: 'ai' },
		rawResult: { status: 'needs_review', fulfillment: null, detail: '테스트' },
		message: '테스트',
	}
}

function record(overrides: Partial<CheckSessionRecord> = {}): CheckSessionRecord {
	return {
		id: 1,
		source: 'review-page',
		status: 'running',
		targetType: 'uploaded-image',
		createdAt: '2026-07-15T00:00:00.000Z',
		updatedAt: '2026-07-15T00:00:00.000Z',
		...overrides,
	}
}

describe('CheckSession aggregate', () => {
	it('즉시 결과 적용 후 pending이 남으면 running을 유지한다', () => {
		const session = CheckSession.fromRecord(record())
		session.applyImmediateResults({
			results: { a: checkResult('a') },
			pendingCheckKeys: ['b'],
		})
		expect(session.status).toBe('running')
		expect(session.pendingCheckKeys).toEqual(['b'])
		expect(session.toUpdateData().completedAt).toBeUndefined()
	})

	it('pending이 비면 자동으로 completed가 되고 completedAt을 기록한다', () => {
		const session = CheckSession.fromRecord(record())
		session.applyImmediateResults({
			results: { a: checkResult('a') },
			pendingCheckKeys: [],
		})
		expect(session.status).toBe('completed')
		expect(session.isCompleted).toBe(true)
		expect(session.toUpdateData().completedAt).toEqual(expect.any(String))
	})

	it('AI 결과 적용 시 해당 키를 pending에서 제거하고 결과를 병합한다', () => {
		const session = CheckSession.fromRecord(
			record({ results: { a: checkResult('a') }, pendingCheckKeys: ['b', 'c'] }),
		)
		session.applyAiResults({ results: { b: checkResult('b') } })
		expect(session.status).toBe('running')
		expect(session.pendingCheckKeys).toEqual(['c'])

		session.applyAiResults({ results: { c: checkResult('c') }, aiUsage: { model: 'm' } })
		expect(session.status).toBe('completed')
		expect(Object.keys(session.results).sort()).toEqual(['a', 'b', 'c'])
		expect(session.toUpdateData().aiUsage).toEqual({ model: 'm' })
	})

	it('종결된 세션에 전이를 시도하면 CheckSessionStateError를 던진다', () => {
		const completed = CheckSession.fromRecord(record({ status: 'completed' }))
		expect(() => completed.applyAiResults({ results: {} })).toThrow(CheckSessionStateError)
		expect(() => completed.fail('boom')).toThrow(CheckSessionStateError)

		const failed = CheckSession.fromRecord(record({ status: 'failed' }))
		expect(() =>
			failed.applyImmediateResults({ results: {}, pendingCheckKeys: [] }),
		).toThrow(CheckSessionStateError)
	})

	it('fail은 errorMessage와 completedAt을 기록한다', () => {
		const session = CheckSession.fromRecord(record())
		session.fail('boom')
		expect(session.isFailed).toBe(true)
		expect(session.toUpdateData().errorMessage).toBe('boom')
		expect(session.toUpdateData().completedAt).toEqual(expect.any(String))
	})

	it('fromRecord는 pendingCheckKeys가 없는 과거 레코드를 빈 배열로 복원한다', () => {
		const session = CheckSession.fromRecord(record())
		expect(session.pendingCheckKeys).toEqual([])
	})
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/features/asset-check/domain/check-session.test.ts`
Expected: FAIL — `Cannot find module './check-session'` 류의 모듈 부재 에러.

- [ ] **Step 3: Aggregate 구현**

`src/features/asset-check/domain/check-session.ts`:

```ts
import type { AiUsage, CheckResult } from '@/features/asset-check/checkers/types'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'
import type { CheckSession as CheckSessionRecord } from '@/payload-types'

/** 종결(completed/failed)된 세션에 전이를 시도했을 때의 방어선. 정상 경로에서는 나오지 않는다. */
export class CheckSessionStateError extends Error {}

/** failed 세션에 AI 후속 검수를 요청했을 때. API route가 409로 변환한다. */
export class CheckSessionTerminalError extends Error {}

export interface CheckSessionUpdateData {
	status: CheckSessionRecord['status']
	results: Record<string, CheckResult>
	pendingCheckKeys: string[]
	aiUsage?: AiUsage
	errorMessage?: string
	completedAt?: string
}

/**
 * 검수 세션 Aggregate — running → completed/failed 전이와 결과 병합 규칙을 소유한다.
 * pending이 비는 순간 스스로 완료하며, 호출자는 완료 조건을 계산하지 않는다.
 * Payload 레코드와의 변환은 check-session repository만 수행한다.
 */
export class CheckSession {
	private constructor(
		readonly id: number,
		private _status: CheckSessionRecord['status'],
		private _results: Record<string, CheckResult>,
		private _pendingCheckKeys: string[],
		readonly rulesetSnapshot: RuntimeCheck[] | undefined,
		private _aiUsage: AiUsage | undefined,
		private _errorMessage: string | undefined,
		private _completedAt: string | undefined,
	) {}

	static fromRecord(record: CheckSessionRecord): CheckSession {
		return new CheckSession(
			record.id,
			record.status,
			(record.results ?? {}) as Record<string, CheckResult>,
			Array.isArray(record.pendingCheckKeys)
				? record.pendingCheckKeys.filter((key): key is string => typeof key === 'string')
				: [],
			Array.isArray(record.rulesetSnapshot)
				? (record.rulesetSnapshot as RuntimeCheck[])
				: undefined,
			(record.aiUsage ?? undefined) as AiUsage | undefined,
			record.errorMessage ?? undefined,
			record.completedAt ?? undefined,
		)
	}

	get status() {
		return this._status
	}

	get results(): Record<string, CheckResult> {
		return this._results
	}

	get pendingCheckKeys(): string[] {
		return [...this._pendingCheckKeys]
	}

	get isCompleted() {
		return this._status === 'completed'
	}

	get isFailed() {
		return this._status === 'failed'
	}

	/** 즉시(deterministic/manual) 판정 결과와 남은 AI Check 목록을 반영한다. */
	applyImmediateResults(input: {
		results: Record<string, CheckResult>
		pendingCheckKeys: string[]
	}): void {
		this.assertRunning('applyImmediateResults')
		this._results = { ...this._results, ...input.results }
		this._pendingCheckKeys = [...input.pendingCheckKeys]
		this.completeIfDone()
	}

	/** AI 판정 결과를 병합하고 판정된 키를 pending에서 제거한다. */
	applyAiResults(input: { results: Record<string, CheckResult>; aiUsage?: AiUsage }): void {
		this.assertRunning('applyAiResults')
		this._results = { ...this._results, ...input.results }
		const applied = new Set(Object.keys(input.results))
		this._pendingCheckKeys = this._pendingCheckKeys.filter((key) => !applied.has(key))
		if (input.aiUsage) this._aiUsage = input.aiUsage
		this.completeIfDone()
	}

	fail(errorMessage: string): void {
		this.assertRunning('fail')
		this._status = 'failed'
		this._errorMessage = errorMessage
		this._completedAt = new Date().toISOString()
	}

	/** Repository 전용 — 갱신 대상 필드만 뽑는다. */
	toUpdateData(): CheckSessionUpdateData {
		return {
			status: this._status,
			results: this._results,
			pendingCheckKeys: this._pendingCheckKeys,
			aiUsage: this._aiUsage,
			errorMessage: this._errorMessage,
			completedAt: this._completedAt,
		}
	}

	private completeIfDone(): void {
		if (this._pendingCheckKeys.length > 0) return
		this._status = 'completed'
		this._completedAt = new Date().toISOString()
	}

	private assertRunning(action: string): void {
		if (this._status !== 'running') {
			throw new CheckSessionStateError(`${action}: session is ${this._status}, not running`)
		}
	}
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run src/features/asset-check/domain/check-session.test.ts`
Expected: PASS 6/6.

- [ ] **Step 5: Commit**

```bash
git add src/features/asset-check/domain/
git commit -m "feat: CheckSession Aggregate 도메인 객체 추가"
```

---

### Task 3: Repository·서비스·API·클라이언트 배선 전환

이 네 파일은 시그니처가 맞물려 있어 함께 바꿔야 각 커밋이 컴파일된다.

**Files:**
- Modify: `src/features/asset-check/repositories/check-session.payload.repository.ts` (전체 교체)
- Modify: `src/services/start-check-session.service.ts` (전체 교체)
- Modify: `src/app/api/check/ai/route.ts`
- Modify: `src/features/asset-check/services/submit-check.client.ts:27-41,66-70`

**Interfaces:**
- Consumes: Task 2의 `CheckSession` Aggregate·`CheckSessionTerminalError`, 기존 `runImmediateCheck(buffer, flags, checks?): Promise<{ results, pendingCheckKeys }>`·`runHeuristicCheck(buffer, checkKeys, checks?): Promise<{ results, aiUsage? }>`
- Produces: `completeCheckSessionAiCheck({ buffer, checkSessionId: number, user })` — `checkKeys` 입력이 사라진 새 계약. `startCheckSession`의 입출력은 기존과 동일(agent tool `runCheck`는 무변경).

- [ ] **Step 1: Repository 교체**

`src/features/asset-check/repositories/check-session.payload.repository.ts` 전체를 다음으로 교체:

```ts
import config from '@payload-config'
import { getPayload } from 'payload'
import { CheckSession } from '@/features/asset-check/domain/check-session'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'
import type { CheckSessionSource } from '@/features/asset-check/types'
import type { AgentChatSession, User } from '@/payload-types'

interface CreateCheckSessionInput {
	agentChatSessionId?: AgentChatSession['id']
	source: CheckSessionSource
	imageName?: string
	rulesetSnapshot?: RuntimeCheck[]
	user: User
}

/**
 * CheckSession 저장 repository — Aggregate ↔ Payload 레코드 변환과 Local API 쓰기를 소유한다.
 * 세션은 항상 running으로 시작하고, 이후 전이는 CheckSession Aggregate가 소유한다.
 */
export async function createCheckSessionRecord(
	input: CreateCheckSessionInput,
): Promise<CheckSession> {
	const payload = await getPayload({ config })
	const record = await payload.create({
		collection: 'check-sessions',
		data: {
			source: input.source,
			status: 'running',
			targetType: 'uploaded-image',
			imageName: input.imageName,
			rulesetSnapshot: input.rulesetSnapshot,
			pendingCheckKeys: [],
			agentChatSession: input.agentChatSessionId,
			createdBy: input.user.id,
		},
		overrideAccess: false,
		user: input.user,
	})

	return CheckSession.fromRecord(record)
}

/**
 * CheckSession 단건 조회 repository — 저장 레코드를 Aggregate로 복원해 돌려준다.
 */
export async function getCheckSessionRecord(id: number, user: User): Promise<CheckSession> {
	const payload = await getPayload({ config })
	const record = await payload.findByID({
		collection: 'check-sessions',
		id,
		overrideAccess: true,
		user,
	})

	return CheckSession.fromRecord(record)
}

/**
 * CheckSession 저장 repository — Aggregate의 현재 상태를 기록한다.
 * 저장 필드 선택은 Aggregate의 toUpdateData()가 소유한다.
 */
export async function saveCheckSessionRecord(session: CheckSession, user: User): Promise<void> {
	const payload = await getPayload({ config })
	await payload.update({
		collection: 'check-sessions',
		id: session.id,
		data: session.toUpdateData(),
		overrideAccess: true,
		user,
	})
}
```

- [ ] **Step 2: 서비스 교체**

`src/services/start-check-session.service.ts` 전체를 다음으로 교체:

```ts
import { CheckSessionTerminalError } from '@/features/asset-check/domain/check-session'
import {
	createCheckSessionRecord,
	getCheckSessionRecord,
	saveCheckSessionRecord,
} from '@/features/asset-check/repositories/check-session.payload.repository'
import {
	type CheckScenario,
	getCheckScenario,
	getCheckScenarioFlags,
} from '@/features/asset-check/scenarios'
import { getRuntimeChecks } from '@/features/asset-check/services/get-check-ruleset.service'
import { getCheckScenarios } from '@/features/asset-check/services/get-check-scenarios.service'
import {
	runHeuristicCheck,
	runImmediateCheck,
} from '@/features/asset-check/services/run-check.service'
import type { CheckSessionSource, ImageContentFlags } from '@/features/asset-check/types'
import type { AgentChatSession, User } from '@/payload-types'

interface StartCheckSessionInput {
	agentChatSessionId?: AgentChatSession['id']
	buffer: Buffer
	deferHeuristic?: boolean
	flags?: ImageContentFlags
	imageName?: string
	scenario?: CheckScenario
	scenarioKey?: string
	source: CheckSessionSource
	user: User
}

interface CompleteCheckSessionAiCheckInput {
	buffer: Buffer
	checkSessionId: number
	user: User
}

/**
 * 검수 세션 시작 유스케이스 — 기본은 전체 판정을 저장하고, 화면 요청은 AI 룰을 후속 처리로 분리한다.
 * 상태 전이와 결과 병합은 CheckSession Aggregate가, 저장 I/O는 check-session repository가,
 * 룰 판정은 asset-check 기능의 run-check/get-check-rules service가 소유한다.
 */
export async function startCheckSession(input: StartCheckSessionInput) {
	const scenario =
		input.scenario ?? getCheckScenario(await getCheckScenarios(input.user), input.scenarioKey)
	const rulesetSnapshot = await getRuntimeChecks(scenario.checkKeys)
	const session = await createCheckSessionRecord({
		agentChatSessionId: input.agentChatSessionId,
		source: input.source,
		imageName: input.imageName,
		rulesetSnapshot,
		user: input.user,
	})

	try {
		const immediate = await runImmediateCheck(
			input.buffer,
			input.flags ?? getCheckScenarioFlags(scenario),
			rulesetSnapshot,
		)
		session.applyImmediateResults(immediate)
		if (!input.deferHeuristic && session.pendingCheckKeys.length > 0) {
			const aiCheck = await runHeuristicCheck(
				input.buffer,
				session.pendingCheckKeys,
				rulesetSnapshot,
			)
			session.applyAiResults(aiCheck)
		}
		await saveCheckSessionRecord(session, input.user)

		return {
			checkSessionId: session.id,
			results: session.results,
			pendingCheckKeys: session.pendingCheckKeys,
			rulesetSnapshot,
		}
	} catch (error) {
		if (session.status === 'running') {
			session.fail(error instanceof Error ? error.message : 'Check failed.')
			await saveCheckSessionRecord(session, input.user)
		}
		throw error
	}
}

/**
 * 검수 세션 AI 완료 유스케이스 — 세션에 저장된 pendingCheckKeys로 heuristic 룰을 실행하고 병합한다.
 * 이미 완료된 세션은 저장된 결과를 그대로 돌려주고(멱등), 실패한 세션은 CheckSessionTerminalError를 던진다.
 */
export async function completeCheckSessionAiCheck(input: CompleteCheckSessionAiCheckInput) {
	const session = await getCheckSessionRecord(input.checkSessionId, input.user)
	if (session.isCompleted) {
		return { checkSessionId: session.id, results: session.results }
	}
	if (session.isFailed) {
		throw new CheckSessionTerminalError('Check session already failed.')
	}

	const aiCheck = await runHeuristicCheck(
		input.buffer,
		session.pendingCheckKeys,
		session.rulesetSnapshot,
	)
	session.applyAiResults(aiCheck)
	await saveCheckSessionRecord(session, input.user)

	return { checkSessionId: session.id, results: aiCheck.results }
}
```

- [ ] **Step 3: API route 수정**

`src/app/api/check/ai/route.ts`에서:

1. `parseCheckKeys` 함수(8~16행)와 그 호출을 삭제한다.
2. import에 `CheckSessionTerminalError`를 추가한다.
3. 검증과 catch를 아래처럼 바꾼다:

```ts
import { CheckSessionTerminalError } from '@/features/asset-check/domain/check-session'
import { isPayloadUser } from '@/lib/auth'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'
import { completeCheckSessionAiCheck } from '@/services/start-check-session.service'
import { readCheckImage } from '../read-check-image'

export const maxDuration = 30

function parseCheckSessionId(value: FormDataEntryValue | null | undefined): number | null {
	const id = typeof value === 'string' ? Number(value) : NaN
	return Number.isInteger(id) ? id : null
}

export async function POST(req: Request) {
	if (isCrossOriginRequest(req)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()
	if (!isPayloadUser(user)) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const form = await req.formData().catch(() => null)
	const checkSessionId = parseCheckSessionId(form?.get('checkSessionId'))
	if (checkSessionId === null) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}
	const image = await readCheckImage(form?.get('image'))
	if ('response' in image) return image.response

	try {
		const result = await completeCheckSessionAiCheck({
			buffer: image.buffer,
			checkSessionId,
			user,
		})

		return Response.json(result)
	} catch (error) {
		if (error instanceof CheckSessionTerminalError) {
			return Response.json({ message: 'Check session already finished.' }, { status: 409 })
		}
		payload.logger.error({ err: error }, 'asset-check.ai.failed')

		return Response.json({ message: 'Check failed.' }, { status: 500 })
	}
}
```

- [ ] **Step 4: 클라이언트 수정**

`src/features/asset-check/services/submit-check.client.ts`에서 `submitAiCheck`의 `checkKeys` 파라미터와 form 필드를 제거:

```ts
/** 첫 응답에서 분리된 AI(heuristic) 룰의 후속 판정을 요청한다. 대상 룰은 서버가 세션에서 읽는다. */
export async function submitAiCheck(
	file: File,
	checkSessionId: number,
): Promise<Record<string, CheckResult>> {
	const form = new FormData()
	form.append('image', file)
	form.append('checkSessionId', String(checkSessionId))
	const response = await fetch('/api/check/ai', { method: 'POST', body: form })
	if (!response.ok) throw new Error(`ai check failed: ${response.status}`)
	const { results } = (await response.json()) as { results: Record<string, CheckResult> }
	return results
}
```

`runFullCheck`의 호출부(66~70행)를 다음으로 교체 (AI 실패 폴백은 이미 받아둔 `pendingCheckKeys`를 그대로 쓴다):

```ts
	const aiResults = await submitAiCheck(file, serverResult.checkSessionId).catch(() =>
		aiFailureResults(serverResult.pendingCheckKeys),
	)
```

- [ ] **Step 5: 정적 검사와 전체 테스트**

Run: `pnpm check && pnpm typecheck && pnpm vitest run`
Expected: biome·tsc 에러 0, 테스트 256/256 통과 (256보다 적으면 `.env` 복사 누락 의심).

- [ ] **Step 6: Commit**

```bash
git add src/features/asset-check/repositories/check-session.payload.repository.ts src/services/start-check-session.service.ts src/app/api/check/ai/route.ts src/features/asset-check/services/submit-check.client.ts
git commit -m "refactor: CheckSession 전이를 Aggregate로 이관하고 AI 검수를 서버 pendingCheckKeys 기반으로 전환"
```

---

### Task 4: 핸드오프 마이그레이션 생성과 최종 검증

**Files:**
- Create: `migrations/<timestamp>_check_session_pending_check_keys.ts` (자동 생성)
- Create: `migrations/<timestamp>_check_session_pending_check_keys.json` (drizzle 스냅샷, 자동 생성)
- Modify: `migrations/index.ts` (자동 생성)

**Interfaces:**
- Consumes: Task 1의 스키마 변경.
- Produces: 공유 환경(`PAYLOAD_DB_PUSH=false`)에 적용할 마이그레이션.

- [ ] **Step 1: 마이그레이션 생성**

Run: `pnpm migrate:create check_session_pending_check_keys`
Expected: `migrations/`에 `.ts`와 `.json` 스냅샷이 생기고 `index.ts`가 갱신된다. 생성된 `.ts`에 `check_sessions` 테이블 `pending_check_keys`(jsonb) 컬럼 추가만 있는지 확인 — 다른 테이블 변경이 섞여 있으면 스냅샷 어긋남이므로 중단하고 보고할 것.

- [ ] **Step 2: 생성물을 로컬 push DB에 실행하지 않는다**

로컬 DB는 push로 이미 갱신된 상태다. `pnpm payload migrate`를 로컬에서 실행하지 말 것 (CLAUDE.md 규칙).

- [ ] **Step 3: 최종 검증**

Run: `pnpm check && pnpm typecheck && pnpm vitest run`
Expected: 모두 통과, 256/256.

- [ ] **Step 4: Commit**

```bash
git add migrations/
git commit -m "chore: check_sessions pending_check_keys 마이그레이션 추가"
```
