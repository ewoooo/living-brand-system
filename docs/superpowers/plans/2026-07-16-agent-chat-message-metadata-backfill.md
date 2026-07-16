# AgentChatSession 메시지 메타데이터 백필 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 새 턴 세션 레코드를 만들 때 직전 세션 레코드에서 히스토리 assistant 메시지의 usedTools/usedSkills/aiUsage를 messageId 매칭으로 복사해, 최신 레코드가 대화 전체 턴별 실행 기록의 합본이 되게 한다.

**Architecture:** repository에 "특정 messageId를 포함하는 본인 세션 최신 1건" 조회 함수를 추가하고, 신규 백필 서비스가 조회 + 순수 병합을 수행한다. `startAgentChatSession`은 `toSessionMessages()` 직후 백필을 한 번 호출한다. 직전 레코드는 이미 백필된 합본이므로 1건 조회로 충분하다(체인 원리).

**Tech Stack:** Payload Local API(`payload.find`), Vitest(vi.mock), TypeScript. 스키마·마이그레이션 변경 없음.

## Global Constraints

- 스펙: `docs/superpowers/specs/2026-07-16-agent-chat-message-metadata-backfill-design.md`
- Aggregate(`agent-chat-session.ts`), 컬렉션 스키마(`AgentChatSessions.ts`), 어드민 UI(`AgentChatMessagesTable.tsx`)는 변경 금지
- 복사 필드는 `usedTools`/`usedSkills`/`aiUsage` 세 개만. **`aiUsage.rawUsage`는 복사하지 않는다** — 합본마다 복제하면 레코드가 턴 수만큼 비대해진다(원본 턴 레코드에만 남긴다). `text`/`reaction`은 클라이언트 현재값 유지
- 백필은 best-effort: 조회 실패 시 입력을 그대로 반환하고 채팅을 막지 않는다. 에러 로깅은 payload 인스턴스를 가진 repository가 소유한다(`payload.logger.warn`)
- 백필 대상은 `role: 'assistant'`이고 usedTools/usedSkills/aiUsage가 모두 없는 히스토리 메시지만
- 조회는 `overrideAccess: true` + `createdBy: { equals: user.id }` 필터 — 컬렉션 read가 `managerOrAdmin`이라 사용자 컨텍스트로는 본인 기록도 읽을 수 없으므로, 같은 파일의 `updateAgentChatSessionReaction`과 동일한 패턴으로 명시적 소유자 필터가 본인 세션 한정을 보장한다
- 서비스 파일 최상단 export 함수 위에 유스케이스 경계와 하위 계층 I/O 소유를 설명하는 짧은 주석 필수 (CLAUDE.md 규칙)
- 커밋 전 `pnpm exec biome check <변경 파일들>` 통과 확인
- 커밋 메시지: Conventional Commits 한국어 + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` 트레일러
- 작업 위치: 워크트리 `.agents/worktrees/feat-agent-chat-message-metadata-backfill` (브랜치 `feat/agent-chat-message-metadata-backfill`, main 기반, pnpm install 완료)

---

### Task 1: repository 조회 함수 + 백필 서비스 + 단위 테스트

**Files:**
- Modify: `src/features/agent-chat/repositories/agent-chat-session.payload.repository.ts` (함수 1개 추가)
- Create: `src/features/agent-chat/services/backfill-agent-chat-session-messages.service.ts`
- Test: `src/features/agent-chat/services/backfill-agent-chat-session-messages.service.test.ts`

**Interfaces:**
- Consumes: `AgentChatSessionMessageInput`, `AgentChatSessionUsage`, `AgentChatAiUsage` (`@/features/agent-chat/types`), `AgentChatSession` 레코드 타입 (`@/payload-types`)
- Produces:
  - `findLatestAgentChatSessionContainingMessage(messageId: string, user: User): Promise<AgentChatSessionRecord | null>` — repository. 조회 실패 시 throw하지 않고 warn 로깅 후 `null` 반환
  - `backfillAgentChatSessionMessages(messages: AgentChatSessionMessageInput[], user: User): Promise<AgentChatSessionMessageInput[]>` — 서비스. Task 2가 이 시그니처로 호출

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/agent-chat/services/backfill-agent-chat-session-messages.service.test.ts` 생성:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findLatestAgentChatSessionContainingMessage } from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import { backfillAgentChatSessionMessages } from '@/features/agent-chat/services/backfill-agent-chat-session-messages.service'
import type { AgentChatSessionMessageInput } from '@/features/agent-chat/types'
import type { AgentChatSession as AgentChatSessionRecord, User } from '@/payload-types'

vi.mock('@/features/agent-chat/repositories/agent-chat-session.payload.repository', () => ({
	findLatestAgentChatSessionContainingMessage: vi.fn(),
}))

const findPrevious = vi.mocked(findLatestAgentChatSessionContainingMessage)

const user = { id: 7 } as User

const history: AgentChatSessionMessageInput[] = [
	{ messageId: 'u-1', role: 'user', text: '가이드라인 알려줘' },
	{ messageId: 'a-1', role: 'assistant', text: '가이드라인입니다.', reaction: 'good' },
	{ messageId: 'u-2', role: 'user', text: '더 자세히' },
]

const previousRecord = {
	id: 21,
	messages: [
		{ messageId: 'u-1', role: 'user', text: '가이드라인 알려줘' },
		{
			messageId: 'a-1',
			role: 'assistant',
			text: '가이드라인입니다.',
			reaction: 'bad',
			usedTools: [{ name: 'loadSkill', callCount: 1, id: 'row-1' }],
			usedSkills: [{ name: 'Guideline Curator', callCount: 1, id: 'row-2' }],
			aiUsage: {
				model: 'claude-sonnet-4-6',
				callCount: 2,
				inputTokens: 100,
				outputTokens: 20,
				totalTokens: 120,
				cacheReadInputTokens: 0,
				cacheWriteInputTokens: 0,
				reasoningTokens: 0,
				rawUsage: { steps: [{ raw: true }] },
			},
		},
	],
} as unknown as AgentChatSessionRecord

describe('backfillAgentChatSessionMessages', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('히스토리 assistant 메시지에 직전 레코드의 메타데이터를 복사한다', async () => {
		findPrevious.mockResolvedValue(previousRecord)

		const result = await backfillAgentChatSessionMessages(history, user)

		expect(findPrevious).toHaveBeenCalledWith('a-1', user)
		expect(result[1]).toMatchObject({
			messageId: 'a-1',
			usedTools: [{ name: 'loadSkill', callCount: 1 }],
			usedSkills: [{ name: 'Guideline Curator', callCount: 1 }],
			aiUsage: { model: 'claude-sonnet-4-6', callCount: 2, totalTokens: 120 },
		})
		expect(result[1].usedTools?.[0]).not.toHaveProperty('id')
		expect(result[1].aiUsage).not.toHaveProperty('rawUsage')
	})

	it('text와 reaction은 클라이언트 현재값을 유지한다', async () => {
		findPrevious.mockResolvedValue(previousRecord)

		const result = await backfillAgentChatSessionMessages(history, user)

		expect(result[1].text).toBe('가이드라인입니다.')
		expect(result[1].reaction).toBe('good')
		expect(result[0]).toEqual(history[0])
		expect(result[2]).toEqual(history[2])
	})

	it('assistant 메시지가 없는 첫 턴은 조회 없이 입력을 그대로 반환한다', async () => {
		const firstTurn: AgentChatSessionMessageInput[] = [
			{ messageId: 'u-1', role: 'user', text: '안녕' },
		]

		const result = await backfillAgentChatSessionMessages(firstTurn, user)

		expect(result).toBe(firstTurn)
		expect(findPrevious).not.toHaveBeenCalled()
	})

	it('직전 레코드에 없는 messageId는 빈칸 그대로 둔다', async () => {
		findPrevious.mockResolvedValue({ id: 21, messages: [] } as unknown as AgentChatSessionRecord)

		const result = await backfillAgentChatSessionMessages(history, user)

		expect(result[1]).toEqual(history[1])
	})

	it('조회가 실패해도 입력을 그대로 반환한다', async () => {
		findPrevious.mockRejectedValue(new Error('db down'))

		const result = await backfillAgentChatSessionMessages(history, user)

		expect(result).toEqual(history)
	})
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/plusx/Documents/living-brand-system/.agents/worktrees/feat-agent-chat-message-metadata-backfill && pnpm vitest run src/features/agent-chat/services/backfill-agent-chat-session-messages.service.test.ts`
Expected: FAIL — `backfill-agent-chat-session-messages.service` 모듈 없음, `findLatestAgentChatSessionContainingMessage` export 없음

- [ ] **Step 3: repository 조회 함수 추가**

`src/features/agent-chat/repositories/agent-chat-session.payload.repository.ts`의 `createAgentChatSessionRecord` 함수 아래에 추가:

```typescript
/**
 * AgentChatSession 조회 repository — messageId를 포함하는 본인 세션 최신 1건을 돌려준다.
 * 백필 소스 조회 전용이라 실패해도 throw하지 않고 warn 로깅 후 null을 반환한다(best-effort).
 */
export async function findLatestAgentChatSessionContainingMessage(
	messageId: string,
	user: User,
): Promise<AgentChatSessionRecord | null> {
	const payload = await getPayload({ config })

	try {
		// read 접근이 managerOrAdmin이라 사용자 컨텍스트로는 본인 기록도 못 읽는다.
		// updateAgentChatSessionReaction과 동일하게 overrideAccess + createdBy 필터로 본인 세션만 한정한다.
		const result = await payload.find({
			collection: 'agent-chat-sessions',
			depth: 0,
			limit: 1,
			sort: '-createdAt',
			overrideAccess: true,
			user,
			where: {
				and: [
					{ 'messages.messageId': { equals: messageId } },
					{ createdBy: { equals: user.id } },
				],
			},
		})

		return result.docs[0] ?? null
	} catch (error) {
		payload.logger.warn({ err: error, messageId }, 'agent-chat.backfill-lookup.failed')
		return null
	}
}
```

주의: 이 파일은 이미 `AgentChatSession as AgentChatSessionRecord`를 type import하고 있다(`import type { AgentChatSession as AgentChatSessionRecord, User } from '@/payload-types'`). 새 import는 필요 없다.

- [ ] **Step 4: 백필 서비스 작성**

`src/features/agent-chat/services/backfill-agent-chat-session-messages.service.ts` 생성:

```typescript
import { findLatestAgentChatSessionContainingMessage } from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import type {
	AgentChatAiUsage,
	AgentChatSessionMessageInput,
	AgentChatSessionUsage,
} from '@/features/agent-chat/types'
import type { AgentChatSession as AgentChatSessionRecord, User } from '@/payload-types'

type AgentChatSessionRecordMessage = NonNullable<AgentChatSessionRecord['messages']>[number]

/**
 * 클라이언트 왕복으로 비는 히스토리 assistant 메시지의 실행 메타데이터(usedTools/usedSkills/aiUsage)를
 * 직전 세션 레코드에서 messageId 매칭으로 복사하는 유스케이스. 직전 레코드는 이미 백필된 합본이므로
 * 1건 조회로 충분하다. 조회 I/O와 실패 로깅은 agent-chat-session repository가 소유하고,
 * 여기서는 실패 시 입력을 그대로 반환한다(best-effort — 백필은 채팅의 전제조건이 아니다).
 */
export async function backfillAgentChatSessionMessages(
	messages: AgentChatSessionMessageInput[],
	user: User,
): Promise<AgentChatSessionMessageInput[]> {
	const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')

	if (!lastAssistant) {
		return messages
	}

	let previous: AgentChatSessionRecord | null = null

	try {
		previous = await findLatestAgentChatSessionContainingMessage(lastAssistant.messageId, user)
	} catch {
		// 조회 실패 로깅은 repository가 담당한다 — 여기서는 백필만 건너뛴다.
	}

	const sources = new Map(
		(previous?.messages ?? [])
			.filter((message) => message.role === 'assistant')
			.map((message) => [message.messageId, message]),
	)

	if (sources.size === 0) {
		return messages
	}

	return messages.map((message) => {
		if (message.role !== 'assistant' || message.usedTools || message.usedSkills || message.aiUsage) {
			return message
		}

		const source = sources.get(message.messageId)
		const metadata = source ? toMessageMetadata(source) : null

		return metadata ? { ...message, ...metadata } : message
	})
}

function toMessageMetadata(source: AgentChatSessionRecordMessage) {
	const usedTools = toUsage(source.usedTools)
	const usedSkills = toUsage(source.usedSkills)
	const aiUsage = toAiUsage(source.aiUsage)

	if (!usedTools && !usedSkills && !aiUsage) {
		return null
	}

	return {
		...(usedTools ? { usedTools } : {}),
		...(usedSkills ? { usedSkills } : {}),
		...(aiUsage ? { aiUsage } : {}),
	}
}

function toUsage(
	rows: AgentChatSessionRecordMessage['usedTools'],
): AgentChatSessionUsage[] | undefined {
	if (!rows?.length) {
		return undefined
	}

	return rows.map(({ name, callCount }) => ({ name, callCount: callCount ?? undefined }))
}

// ponytail: rawUsage는 원본 턴 레코드에만 남긴다 — 합본마다 복제하면 레코드가 턴 수만큼 비대해진다.
function toAiUsage(
	group: AgentChatSessionRecordMessage['aiUsage'],
): AgentChatAiUsage | undefined {
	if (group?.callCount == null) {
		return undefined
	}

	return {
		model: group.model ?? undefined,
		callCount: group.callCount,
		inputTokens: group.inputTokens ?? undefined,
		outputTokens: group.outputTokens ?? undefined,
		totalTokens: group.totalTokens ?? undefined,
		cacheReadInputTokens: group.cacheReadInputTokens ?? undefined,
		cacheWriteInputTokens: group.cacheWriteInputTokens ?? undefined,
		reasoningTokens: group.reasoningTokens ?? undefined,
	}
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd /Users/plusx/Documents/living-brand-system/.agents/worktrees/feat-agent-chat-message-metadata-backfill && pnpm vitest run src/features/agent-chat/services/backfill-agent-chat-session-messages.service.test.ts`
Expected: PASS (5/5)

- [ ] **Step 6: biome 확인 후 커밋**

```bash
cd /Users/plusx/Documents/living-brand-system/.agents/worktrees/feat-agent-chat-message-metadata-backfill
pnpm exec biome check src/features/agent-chat/services/backfill-agent-chat-session-messages.service.ts src/features/agent-chat/services/backfill-agent-chat-session-messages.service.test.ts src/features/agent-chat/repositories/agent-chat-session.payload.repository.ts
git add src/features/agent-chat/services/backfill-agent-chat-session-messages.service.ts src/features/agent-chat/services/backfill-agent-chat-session-messages.service.test.ts src/features/agent-chat/repositories/agent-chat-session.payload.repository.ts
git commit -m "feat: 세션 메시지 메타데이터 백필 서비스와 조회 repository 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

biome이 포맷 차이를 지적하면 `pnpm exec biome check --write <파일들>`로 고친 뒤 테스트를 다시 돌리고 커밋한다.

---

### Task 2: startAgentChatSession 배선 + 서비스 테스트 갱신

**Files:**
- Modify: `src/features/agent-chat/services/start-agent-chat-session.service.ts:26-27` (백필 호출 배선)
- Test: `src/features/agent-chat/services/start-agent-chat-session.service.test.ts` (mock 추가 + 케이스 1개 추가)

**Interfaces:**
- Consumes: Task 1의 `backfillAgentChatSessionMessages(messages: AgentChatSessionMessageInput[], user: User): Promise<AgentChatSessionMessageInput[]>`, Task 1의 repository mock 대상 `findLatestAgentChatSessionContainingMessage`
- Produces: 없음 (최종 배선 태스크 — `startAgentChatSession`의 외부 계약은 무변경)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/agent-chat/services/start-agent-chat-session.service.test.ts` 수정 3곳:

(1) repository mock factory에 조회 함수를 추가한다 (10-13행의 `vi.mock` 교체):

```typescript
vi.mock('@/features/agent-chat/repositories/agent-chat-session.payload.repository', () => ({
	createAgentChatSessionRecord: vi.fn(),
	findLatestAgentChatSessionContainingMessage: vi.fn(),
	saveAgentChatSessionRecord: vi.fn(),
}))
```

(2) mocked 참조를 추가한다 (15-16행의 `const createSession…` 아래):

```typescript
const findPrevious = vi.mocked(findLatestAgentChatSessionContainingMessage)
```

import 문(3-6행)에도 `findLatestAgentChatSessionContainingMessage`를 추가한다:

```typescript
import {
	createAgentChatSessionRecord,
	findLatestAgentChatSessionContainingMessage,
	saveAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
```

`beforeEach`에 기본값을 추가한다:

```typescript
	beforeEach(() => {
		vi.clearAllMocks()
		createSession.mockResolvedValue({ id: 41 } as never)
		findPrevious.mockResolvedValue(null)
	})
```

(3) describe 블록 끝에 새 테스트 케이스를 추가한다:

```typescript
	it('히스토리 assistant 메시지를 백필해서 세션을 생성한다', async () => {
		const historyMessages = [
			{
				id: 'user-1',
				role: 'user',
				parts: [{ type: 'text', text: '가이드라인을 찾아줘.' }],
			},
			{
				id: 'assistant-1',
				role: 'assistant',
				parts: [{ type: 'text', text: '가이드라인입니다.' }],
			},
			{
				id: 'user-2',
				role: 'user',
				parts: [{ type: 'text', text: '더 자세히.' }],
			},
		] as AgentChatMessage[]
		findPrevious.mockResolvedValue({
			id: 21,
			messages: [
				{
					messageId: 'assistant-1',
					role: 'assistant',
					text: '가이드라인입니다.',
					usedTools: [{ name: 'loadSkill', callCount: 1, id: 'row-1' }],
					aiUsage: { model: 'test-model', callCount: 1, totalTokens: 120 },
				},
			],
		} as never)

		await startAgentChatSession({ messages: historyMessages, user })

		expect(findPrevious).toHaveBeenCalledWith('assistant-1', user)
		const created = createSession.mock.calls[0][0]
		expect(created.messages?.[1]).toMatchObject({
			messageId: 'assistant-1',
			usedTools: [{ name: 'loadSkill', callCount: 1 }],
			aiUsage: { model: 'test-model', callCount: 1, totalTokens: 120 },
		})
	})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/plusx/Documents/living-brand-system/.agents/worktrees/feat-agent-chat-message-metadata-backfill && pnpm vitest run src/features/agent-chat/services/start-agent-chat-session.service.test.ts`
Expected: FAIL — 새 케이스에서 `created.messages?.[1]`에 `usedTools` 없음 (백필 미배선). 기존 5케이스는 PASS

- [ ] **Step 3: 배선 구현**

`src/features/agent-chat/services/start-agent-chat-session.service.ts` 수정 2곳:

(1) import 추가 (기존 repository import 아래):

```typescript
import { backfillAgentChatSessionMessages } from '@/features/agent-chat/services/backfill-agent-chat-session-messages.service'
```

(2) 27행의 `const requestMessages = toSessionMessages(input.messages)`를 교체:

```typescript
	const requestMessages = await backfillAgentChatSessionMessages(
		toSessionMessages(input.messages),
		input.user,
	)
```

함수 상단 주석(18-24행)의 첫 문장 뒤에 한 줄을 추가한다:

```typescript
/**
 * Agent 채팅 세션을 시작하고 스트림 실행 기록을 저장하는 유스케이스.
 * 생성 전에 히스토리 assistant 메시지의 실행 메타데이터를 직전 레코드에서 백필한다(합본 체인).
 * 전이와 스텝 누적은 AgentChatSession Aggregate가 소유하며, DB 쓰기는 생성 1회와
 * 종결(completed/failed) 후 1회만 일어난다. 저장 I/O는 agent-chat-session repository가 소유한다.
 * 종결 후 recordStep/fail 호출은 no-op이다 — 완료된 세션을 뒤집는 레이스를 막는다.
 * 스텝 상한처럼 completed 신호 없이 끝나는 턴은 finalize()가 스트림 종료 시점에 종결 저장한다.
 */
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd /Users/plusx/Documents/living-brand-system/.agents/worktrees/feat-agent-chat-message-metadata-backfill && pnpm vitest run src/features/agent-chat/services/start-agent-chat-session.service.test.ts src/features/agent-chat/domain/agent-chat-session.test.ts src/features/agent-chat/services/backfill-agent-chat-session-messages.service.test.ts`
Expected: PASS (도메인 5 + start 서비스 6 + 백필 5 = 16/16)

- [ ] **Step 5: 전체 테스트 확인**

Run: `cd /Users/plusx/Documents/living-brand-system/.agents/worktrees/feat-agent-chat-message-metadata-backfill && pnpm vitest run`
Expected: 전체 PASS (기존 265 + 신규 6 = 271). int 스위트가 보이지 않으면 워크트리에 `.env`/`.env.local`이 있는지 확인한다(이미 복사됨).

- [ ] **Step 6: biome 확인 후 커밋**

```bash
cd /Users/plusx/Documents/living-brand-system/.agents/worktrees/feat-agent-chat-message-metadata-backfill
pnpm exec biome check src/features/agent-chat/services/start-agent-chat-session.service.ts src/features/agent-chat/services/start-agent-chat-session.service.test.ts
git add src/features/agent-chat/services/start-agent-chat-session.service.ts src/features/agent-chat/services/start-agent-chat-session.service.test.ts
git commit -m "feat: 세션 생성 시 히스토리 메시지 메타데이터 백필 배선

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

biome이 포맷 차이를 지적하면 `pnpm exec biome check --write <파일들>`로 고친 뒤 테스트를 다시 돌리고 커밋한다.
