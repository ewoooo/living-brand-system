# AgentChatSession Aggregate 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AgentChatSession의 상태 전이·스텝 누적을 클로저에서 클래스 Aggregate로 옮기고, 스텝별 DB 쓰기(턴당 최대 11회)를 생성 1회 + 종결 1회로 줄이며, 종결-후-뒤집기 레이스를 종결 세션 불변 가드로 제거한다.

**Architecture:** `src/features/agent-chat/domain/agent-chat-session.ts`에 Aggregate를 신설한다(복원 경로 없음 — 세션이 한 요청 안에서 끝나므로 `fromRecord` 대신 `start()`만). 서비스는 외부 계약(`id`/`assistantMessageId`/`recordStep`/`fail`)을 유지한 채 내부를 Aggregate로 교체하고, route는 무변경이다. 스펙: `docs/superpowers/specs/2026-07-16-agent-chat-session-aggregate-design.md`.

**Tech Stack:** Payload CMS(Local API), Vitest, TypeScript strict.

## Global Constraints

- 작업 위치: 워크트리 `/Users/plusx/Documents/living-brand-system/.agents/worktrees/refactor-agent-chat-session-aggregate` (브랜치 `refactor/agent-chat-session-aggregate`, main 기반).
- 워크트리 최초 사용 전 필수: `cp /Users/plusx/Documents/living-brand-system/.env /Users/plusx/Documents/living-brand-system/.env.local <워크트리>/ ; pnpm install` — 없으면 int 스위트가 조용히 누락돼 테스트 수가 줄어든 채 통과한 것처럼 보인다.
- 전체 테스트 기대 개수: 기존 256 + 신규 domain 5 + 서비스 테스트 1→3 (+2) = **263**. 이보다 적으면 스위트 로드 실패를 의심할 것.
- **route(`src/app/api/agent-chat/route.ts`)는 무변경** — 커밋 전 `git diff --stat`에 이 파일이 나타나면 잘못된 것.
- **스키마·마이그레이션 없음** — `src/collections/`, `migrations/`, `src/payload-types.ts`를 건드리지 않는다.
- 리액션 저장(`updateAgentChatSessionReaction`)은 무변경 — 실행 생명주기가 아닌 피드백 메타데이터로 명시적 예외.
- 커밋 메시지: Conventional Commits + 한국어 요약, 끝에 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- 코드 스타일: 탭 들여쓰기. 서비스 파일은 export 함수 위 유스케이스 경계 주석 필수.

---

### Task 1: AgentChatSession Aggregate 클래스 (TDD)

**Files:**
- Create: `src/features/agent-chat/domain/agent-chat-session.ts`
- Test: `src/features/agent-chat/domain/agent-chat-session.test.ts`

**Interfaces:**
- Consumes: `createAgentChatSessionUsageCollector`/`AgentChatSessionUsageStep`/`AgentChatSessionUsageSnapshot`(`@/features/agent-chat/services/collect-agent-chat-session-usage.service`), `AgentChatSessionMessageInput`/`AgentChatSessionUsage`/`AgentChatAiUsage`(`@/features/agent-chat/types`), payload 타입 `AgentChatSession`(alias `AgentChatSessionRecord`)
- Produces (Task 2가 사용):
  - `class AgentChatSession` — `static start({ id: number; assistantMessageId: string; requestMessages: AgentChatSessionMessageInput[] }): AgentChatSession`, getter `id: number`/`assistantMessageId: string`/`status`/`isTerminal: boolean`, 메서드 `recordStep({ step: AgentChatSessionUsageStep; text?: string }): void`/`complete(): void`/`fail(errorMessage: string): void`/`toUpdateData(): AgentChatSessionUpdateData`
  - `class AgentChatSessionStateError extends Error`
  - `interface AgentChatSessionUpdateData` — `{ status; messages: AgentChatSessionMessageInput[]; messageCount: number; usedTools: AgentChatSessionUsage[]; usedSkills: AgentChatSessionUsage[]; aiUsage?: AgentChatAiUsage; errorMessage?: string; completedAt?: string }`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/agent-chat/domain/agent-chat-session.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { AgentChatSession, AgentChatSessionStateError } from './agent-chat-session'

function startSession() {
	return AgentChatSession.start({
		id: 41,
		assistantMessageId: 'assistant-1',
		requestMessages: [{ messageId: 'user-1', role: 'user', text: '가이드라인을 찾아줘.' }],
	})
}

const toolStep = {
	model: { modelId: 'test-model' },
	toolCalls: [{ toolName: 'searchGuidelines', input: {} }],
}

describe('AgentChatSession aggregate', () => {
	it('recordStep은 메모리에만 누적하고 running을 유지한다', () => {
		const session = startSession()
		session.recordStep({ step: toolStep, text: '부분 응답' })
		expect(session.status).toBe('running')
		expect(session.isTerminal).toBe(false)
		expect(session.toUpdateData().completedAt).toBeUndefined()
	})

	it('complete는 completedAt을 찍고 assistant 메시지를 합성한다', () => {
		const session = startSession()
		session.recordStep({ step: toolStep, text: '찾은 가이드라인입니다.' })
		session.complete()

		const data = session.toUpdateData()
		expect(data.status).toBe('completed')
		expect(data.completedAt).toEqual(expect.any(String))
		expect(data.messageCount).toBe(2)
		expect(data.usedTools).toEqual([{ name: 'searchGuidelines', callCount: 1 }])
		expect(data.messages[1]).toMatchObject({
			messageId: 'assistant-1',
			role: 'assistant',
			text: '찾은 가이드라인입니다.',
			usedTools: [{ name: 'searchGuidelines', callCount: 1 }],
		})
	})

	it('텍스트와 usage가 전혀 없으면 assistant 메시지를 추가하지 않는다', () => {
		const session = startSession()
		session.complete()

		const data = session.toUpdateData()
		expect(data.messages).toHaveLength(1)
		expect(data.messageCount).toBe(1)
		expect(data.messages[0]).toMatchObject({ messageId: 'user-1', role: 'user' })
	})

	it('종결된 세션에 전이를 시도하면 AgentChatSessionStateError를 던진다', () => {
		const completed = startSession()
		completed.complete()
		expect(() => completed.recordStep({ step: toolStep })).toThrow(AgentChatSessionStateError)
		expect(() => completed.complete()).toThrow(AgentChatSessionStateError)
		expect(() => completed.fail('boom')).toThrow(AgentChatSessionStateError)

		const failed = startSession()
		failed.fail('boom')
		expect(() => failed.complete()).toThrow(AgentChatSessionStateError)
	})

	it('fail은 errorMessage와 completedAt을 기록하고 누적된 부분 텍스트를 보존한다', () => {
		const session = startSession()
		session.recordStep({ step: toolStep, text: '부분 텍스트' })
		session.fail('boom')

		const data = session.toUpdateData()
		expect(data.status).toBe('failed')
		expect(data.errorMessage).toBe('boom')
		expect(data.completedAt).toEqual(expect.any(String))
		expect(data.messages[1]).toMatchObject({ role: 'assistant', text: '부분 텍스트' })
	})
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/features/agent-chat/domain/agent-chat-session.test.ts`
Expected: FAIL — `Cannot find module './agent-chat-session'` 류의 모듈 부재 에러.

- [ ] **Step 3: Aggregate 구현**

`src/features/agent-chat/domain/agent-chat-session.ts`:

```ts
import {
	type AgentChatSessionUsageSnapshot,
	type AgentChatSessionUsageStep,
	createAgentChatSessionUsageCollector,
} from '@/features/agent-chat/services/collect-agent-chat-session-usage.service'
import type {
	AgentChatAiUsage,
	AgentChatSessionMessageInput,
	AgentChatSessionUsage,
} from '@/features/agent-chat/types'
import type { AgentChatSession as AgentChatSessionRecord } from '@/payload-types'

/** 종결(completed/failed)된 세션에 전이를 시도했을 때의 방어선. 정상 경로에서는 나오지 않는다. */
export class AgentChatSessionStateError extends Error {}

export interface AgentChatSessionUpdateData {
	status: AgentChatSessionRecord['status']
	messages: AgentChatSessionMessageInput[]
	messageCount: number
	usedTools: AgentChatSessionUsage[]
	usedSkills: AgentChatSessionUsage[]
	aiUsage?: AgentChatAiUsage
	errorMessage?: string
	completedAt?: string
}

/**
 * Agent 채팅 세션 Aggregate — running → completed/failed 전이와 스텝 누적을 소유한다.
 * 스텝 기록은 메모리에만 쌓고 DB 쓰기는 종결 전이 후 1회다. 저장 변환은 repository만 수행한다.
 * fromRecord(복원)는 두지 않는다 — 세션 생명주기가 한 요청 안에서 끝난다.
 */
export class AgentChatSession {
	private _status: AgentChatSessionRecord['status'] = 'running'
	private _assistantText = ''
	private _errorMessage: string | undefined
	private _completedAt: string | undefined
	private readonly _usage = createAgentChatSessionUsageCollector()

	private constructor(
		readonly id: number,
		readonly assistantMessageId: string,
		private readonly _requestMessages: AgentChatSessionMessageInput[],
	) {}

	static start(input: {
		id: number
		assistantMessageId: string
		requestMessages: AgentChatSessionMessageInput[]
	}): AgentChatSession {
		return new AgentChatSession(input.id, input.assistantMessageId, [...input.requestMessages])
	}

	get status() {
		return this._status
	}

	get isTerminal() {
		return this._status !== 'running'
	}

	/** 스트림 스텝 1회분을 메모리에 누적한다. DB 쓰기는 하지 않는다. */
	recordStep(input: { step: AgentChatSessionUsageStep; text?: string }): void {
		this.assertRunning('recordStep')
		if (input.text) this._assistantText = input.text
		this._usage.addStep(input.step)
	}

	complete(): void {
		this.assertRunning('complete')
		this._status = 'completed'
		this._completedAt = new Date().toISOString()
	}

	fail(errorMessage: string): void {
		this.assertRunning('fail')
		this._status = 'failed'
		this._errorMessage = errorMessage
		this._completedAt = new Date().toISOString()
	}

	/** Repository 전용 — 저장 필드만 뽑는다. assistant 메시지는 이 시점에 조건부 합성한다. */
	toUpdateData(): AgentChatSessionUpdateData {
		const usage = this._usage.snapshot()
		const messages = this.toMessages(usage)

		return {
			status: this._status,
			messages,
			messageCount: messages.length,
			usedTools: usage.usedTools,
			usedSkills: usage.usedSkills,
			aiUsage: usage.aiUsage,
			errorMessage: this._errorMessage,
			completedAt: this._completedAt,
		}
	}

	private toMessages(usage: AgentChatSessionUsageSnapshot): AgentChatSessionMessageInput[] {
		if (
			!this._assistantText &&
			!usage.aiUsage &&
			usage.usedTools.length === 0 &&
			usage.usedSkills.length === 0
		) {
			return this._requestMessages
		}

		return [
			...this._requestMessages,
			{
				messageId: this.assistantMessageId,
				role: 'assistant',
				text: this._assistantText,
				usedTools: usage.usedTools,
				usedSkills: usage.usedSkills,
				aiUsage: usage.aiUsage,
			},
		]
	}

	private assertRunning(action: string): void {
		if (this._status !== 'running') {
			throw new AgentChatSessionStateError(`${action}: session is ${this._status}, not running`)
		}
	}
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run src/features/agent-chat/domain/agent-chat-session.test.ts`
Expected: PASS 5/5.

- [ ] **Step 5: 포맷 확인 후 커밋**

Run: `pnpm exec biome check src/features/agent-chat/domain/` — 에러 0 확인 (포맷 어긋나면 `pnpm exec biome format --write src/features/agent-chat/domain/` 후 재확인).

```bash
git add src/features/agent-chat/domain/
git commit -m "feat: AgentChatSession Aggregate 도메인 객체 추가"
```

---

### Task 2: 서비스·Repository 배선 전환 (route 무변경)

서비스와 repository는 시그니처가 맞물려 있어 함께 바꿔야 컴파일된다. 기존 서비스 테스트도 새 계약으로 같이 갱신한다.

**Files:**
- Modify: `src/features/agent-chat/services/start-agent-chat-session.service.ts` (전체 교체)
- Modify: `src/features/agent-chat/repositories/agent-chat-session.payload.repository.ts` (update 함수 교체, create·reaction 유지)
- Test: `src/features/agent-chat/services/start-agent-chat-session.service.test.ts` (전체 교체)

**Interfaces:**
- Consumes: Task 1의 `AgentChatSession`·`AgentChatSessionUpdateData`, 기존 `createAgentChatSessionRecord`
- Produces: `saveAgentChatSessionRecord(session: AgentChatSession, user: User): Promise<void>`. `startAgentChatSession`의 반환 계약(`id`/`assistantMessageId`/`recordStep({step, text?, status})`/`fail(message)`)은 기존과 동일 — route는 무변경.

- [ ] **Step 1: 실패하는 서비스 테스트 작성**

`src/features/agent-chat/services/start-agent-chat-session.service.test.ts` 전체를 다음으로 교체:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import {
	createAgentChatSessionRecord,
	saveAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import { startAgentChatSession } from '@/features/agent-chat/services/start-agent-chat-session.service'
import type { User } from '@/payload-types'

vi.mock('@/features/agent-chat/repositories/agent-chat-session.payload.repository', () => ({
	createAgentChatSessionRecord: vi.fn(),
	saveAgentChatSessionRecord: vi.fn(),
}))

const createSession = vi.mocked(createAgentChatSessionRecord)
const saveSession = vi.mocked(saveAgentChatSessionRecord)

const user = { id: 7 } as User
const messages = [
	{
		id: 'user-message',
		role: 'user',
		parts: [{ type: 'text', text: '가이드라인을 찾아줘.' }],
	},
] as AgentChatMessage[]

const toolStep = {
	model: { modelId: 'test-model' },
	toolCalls: [{ toolName: 'searchGuidelines' }],
}

describe('startAgentChatSession', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		createSession.mockResolvedValue({ id: 41 } as never)
	})

	it('요청 메시지로 running 세션을 생성한다', async () => {
		await startAgentChatSession({ messages, pagePath: '/guidelines', user })

		expect(createSession).toHaveBeenCalledWith({
			status: 'running',
			pagePath: '/guidelines',
			messageCount: 1,
			messages: [
				{
					messageId: 'user-message',
					role: 'user',
					text: '가이드라인을 찾아줘.',
				},
			],
			user,
		})
	})

	it('running 스텝은 저장하지 않고 completed 스텝에서 한 번만 저장한다', async () => {
		const session = await startAgentChatSession({ messages, pagePath: '/guidelines', user })

		await session.recordStep({ status: 'running', step: toolStep })
		expect(saveSession).not.toHaveBeenCalled()

		await session.recordStep({
			status: 'completed',
			text: '찾은 가이드라인입니다.',
			step: toolStep,
		})
		expect(saveSession).toHaveBeenCalledTimes(1)

		const [saved, savedUser] = saveSession.mock.calls[0]
		expect(savedUser).toBe(user)
		const data = saved.toUpdateData()
		expect(data.status).toBe('completed')
		expect(data.messageCount).toBe(2)
		expect(data.usedTools).toEqual([{ name: 'searchGuidelines', callCount: 2 }])
		expect(data.messages[1]).toMatchObject({
			messageId: session.assistantMessageId,
			role: 'assistant',
			text: '찾은 가이드라인입니다.',
		})
	})

	it('종결 후 fail은 no-op이고 완료 세션을 뒤집지 않는다', async () => {
		const session = await startAgentChatSession({ messages, user })

		await session.recordStep({ status: 'completed', text: '완료 응답', step: toolStep })
		expect(saveSession).toHaveBeenCalledTimes(1)

		await session.fail('late error')
		expect(saveSession).toHaveBeenCalledTimes(1)
		expect(saveSession.mock.calls[0][0].toUpdateData().status).toBe('completed')
	})
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run src/features/agent-chat/services/start-agent-chat-session.service.test.ts`
Expected: FAIL — `saveAgentChatSessionRecord`가 아직 없어 mock 대상 불일치 또는 import 에러.

- [ ] **Step 3: Repository 교체**

`src/features/agent-chat/repositories/agent-chat-session.payload.repository.ts`에서 `UpdateAgentChatSessionInput` 인터페이스(19~29행)와 `updateAgentChatSessionRecord` 함수(58~80행)를 삭제하고 다음으로 대체. import에 `AgentChatSession`(domain)을 추가하고, 더 이상 안 쓰는 `AgentChatAiUsage`·`AgentChatSessionUsage` import를 제거한다 (`AgentChatSessionMessageInput`·`AgentChatReaction`은 create·reaction이 계속 쓴다):

```ts
import { AgentChatSession } from '@/features/agent-chat/domain/agent-chat-session'
```

```ts
/**
 * AgentChatSession 저장 repository — Aggregate의 종결 시점 상태를 기록한다.
 * 저장 필드 선택은 Aggregate의 toUpdateData()가 소유한다.
 */
export async function saveAgentChatSessionRecord(
	session: AgentChatSession,
	user: User,
): Promise<void> {
	const payload = await getPayload({ config })
	await payload.update({
		collection: 'agent-chat-sessions',
		id: session.id,
		data: session.toUpdateData(),
		overrideAccess: true,
		user,
	})
}
```

`createAgentChatSessionRecord`와 `updateAgentChatSessionReaction`은 그대로 둔다.

- [ ] **Step 4: 서비스 교체**

`src/features/agent-chat/services/start-agent-chat-session.service.ts` 전체를 다음으로 교체:

```ts
import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import { AgentChatSession } from '@/features/agent-chat/domain/agent-chat-session'
import {
	createAgentChatSessionRecord,
	saveAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import type { AgentChatSessionUsageStep } from '@/features/agent-chat/services/collect-agent-chat-session-usage.service'
import type { AgentChatSessionMessageInput } from '@/features/agent-chat/types'
import { getAgentMessageText } from '@/features/agent-chat/utils/get-agent-message-parts'
import type { User } from '@/payload-types'

export interface StartAgentChatSessionInput {
	messages: AgentChatMessage[]
	pagePath?: string
	user: User
}

/**
 * Agent 채팅 세션을 시작하고 스트림 실행 기록을 저장하는 유스케이스.
 * 전이와 스텝 누적은 AgentChatSession Aggregate가 소유하며, DB 쓰기는 생성 1회와
 * 종결(completed/failed) 후 1회만 일어난다. 저장 I/O는 agent-chat-session repository가 소유한다.
 * 종결 후 recordStep/fail 호출은 no-op이다 — 완료된 세션을 뒤집는 레이스를 막는다.
 */
export async function startAgentChatSession(input: StartAgentChatSessionInput) {
	const assistantMessageId = crypto.randomUUID()
	const requestMessages = toSessionMessages(input.messages)
	const record = await createAgentChatSessionRecord({
		status: 'running',
		pagePath: input.pagePath,
		messageCount: requestMessages.length,
		messages: requestMessages,
		user: input.user,
	})
	const session = AgentChatSession.start({
		id: record.id,
		assistantMessageId,
		requestMessages,
	})

	return {
		assistantMessageId,
		id: session.id,
		fail: async (errorMessage: string) => {
			if (session.isTerminal) return
			session.fail(errorMessage)
			await saveAgentChatSessionRecord(session, input.user)
		},
		recordStep: async ({
			step,
			text,
			status,
		}: {
			step: AgentChatSessionUsageStep
			text?: string
			status: 'completed' | 'running'
		}) => {
			if (session.isTerminal) return
			session.recordStep({ step, text })
			if (status !== 'completed') return
			session.complete()
			await saveAgentChatSessionRecord(session, input.user)
		},
	}
}

function toSessionMessages(messages: AgentChatMessage[]): AgentChatSessionMessageInput[] {
	return messages.map((message) => ({
		messageId: message.metadata?.agentChatMessageId ?? message.id,
		role: message.role,
		text: getAgentMessageText(message),
		reaction: message.metadata?.reaction,
	}))
}
```

(기존 `toMessagesWithAssistant`와 usage collector 사용 코드는 Aggregate 내부로 이동했으므로 이 파일에서 삭제된다.)

- [ ] **Step 5: 테스트·정적 검사·전체 스위트**

Run: `pnpm vitest run src/features/agent-chat/services/start-agent-chat-session.service.test.ts src/features/agent-chat/domain/agent-chat-session.test.ts`
Expected: PASS 8/8 (서비스 3 + domain 5).

Run: `pnpm check && pnpm typecheck && pnpm vitest run`
Expected: biome·tsc 에러 0, 테스트 **263/263** (263보다 적으면 `.env` 복사 누락 의심).

Run: `git diff --stat`
Expected: 변경 파일은 서비스·repository·서비스 테스트 3개뿐. `src/app/api/agent-chat/route.ts`가 나타나면 안 된다.

- [ ] **Step 6: Commit**

```bash
git add src/features/agent-chat/services/start-agent-chat-session.service.ts src/features/agent-chat/services/start-agent-chat-session.service.test.ts src/features/agent-chat/repositories/agent-chat-session.payload.repository.ts
git commit -m "refactor: AgentChatSession 전이를 Aggregate로 이관하고 스텝 저장을 종결 시 1회로 축소"
```
