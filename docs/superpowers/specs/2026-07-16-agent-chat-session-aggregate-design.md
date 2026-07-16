# AgentChatSession Aggregate 전환 설계

CheckSession Aggregate 전환(`docs/superpowers/specs/2026-07-15-check-session-aggregate-design.md`, main 병합 완료)의 후속.
AgentChatSession의 상태 전이를 클로저에서 Aggregate 객체로 옮기고, 스텝별 DB 쓰기를 종결 시 1회로 줄인다.

## 배경과 문제

AgentChatSession은 `running → completed/failed` 생명주기를 가지며, 전이 규칙이 `startAgentChatSession`이 반환하는 클로저(`recordStep`/`fail`)에 들어 있다.

1. **매 스텝 전체 재기록** — `recordStep`이 agent 스텝 종료마다 호출되고(`src/app/api/agent-chat/route.ts`의 `onStepEnd`, stopWhen 10스텝이므로 최대 10회), 매번 `payload.update`로 messages 배열 전체 + usage + status를 다시 쓴다. 채팅 1턴에 create 1회 + update 최대 10회. 상태가 실제로 바뀌는 순간은 종결 한 번뿐이다.
2. **종결 후 뒤집기 레이스** — `onError`가 `void chatSession.fail(...)`을 비동기로 던지므로 마지막 `recordStep('completed')`의 update와 순서가 보장되지 않는다. 완료된 세션이 failed로 뒤집힐 수 있다. "종결 세션 불변" 가드가 없어서 생기는 문제로, CheckSession과 동일한 불변식이다.
3. **completedAt 규칙 잔존** — `status === 'running' ? undefined : now` 판정이 `agent-chat-session.payload.repository.ts`(75행)에 남아 있다. CheckSession 전환에서 같은 규칙 2곳을 정리했고 이것이 마지막 사본이다.

## 결정 사항

- **쓰기 정책**: 종결 시에만 저장. 턴당 create 1회 + 종결(completed/failed) update 1회 = 2회.
  - 스텝 상한(stopWhen 10)처럼 completed 신호 없이 스트림이 끝나는 턴은 route의 onEnd 훅이 finalize()로 종결 저장한다 — 상한 턴의 기록 유실 방지(최종 리뷰 발견 반영).
  - 수용한 트레이드오프: 서버 프로세스 강제 종료(배포·OOM·kill) 시 그 턴의 어시스턴트 응답 DB 기록이 유실되고 세션은 running으로 남는다. 사용자 화면에는 스트림이 이미 전달된 상태다. 일반 에러는 `onError`가 `fail()`로 누적분까지 저장하므로 유실이 없다.
- **구현 형태**: 클래스 Aggregate, CheckSession 패턴(`src/features/asset-check/domain/check-session.ts`) 준용.
- **범위**: 쓰기 축소와 객체화를 한 브랜치에서 함께. 쓰기 정책이 객체 규칙("쓰기는 종결 전이에서만")으로 표현된다.

## 컴포넌트

### 신규: `src/features/agent-chat/domain/agent-chat-session.ts`

```ts
class AgentChatSession {
	// 생성 — 요청 메시지와 새 레코드 id로 running 세션을 만든다
	static start({ id, assistantMessageId, requestMessages }): AgentChatSession

	// 읽기
	get id / status / isTerminal

	// 전이 — running이 아니면 AgentChatSessionStateError throw
	recordStep({ step, text })   // 메모리 누적만, DB 쓰기 없음
	complete()                   // completedAt 기록
	fail(errorMessage)           // completedAt + errorMessage 기록

	// Repository 전용
	toUpdateData()               // status·messages·messageCount·usedTools·usedSkills·aiUsage·errorMessage·completedAt
}
```

**CheckSession 패턴과 다른 점: `fromRecord`(복원)가 없다.** CheckSession은 두 HTTP 요청에 걸쳐 살아 DB 복원이 필요했지만, 채팅 세션의 생명주기는 한 요청 안에서 끝난다(스트림 시작→종결). 복원 경로가 없으므로 만들지 않는다(YAGNI). 대화 재개 시 메시지는 클라이언트가 다시 보내고, 리액션 저장은 별도 경로다.

불변식:

1. **쓰기는 종결 전이 후 1회** — `recordStep`은 메모리 누적만 한다. 스텝 usage 집계는 기존 `createAgentChatSessionUsageCollector`를 내부 순수 헬퍼로 재사용한다. DB 쓰기는 `complete()`/`fail()` 후 저장 한 번.
2. **종결 세션 불변** — 전이 메서드는 종결 상태에서 `AgentChatSessionStateError`를 던진다.
3. **completedAt은 종결 전이가 찍는다** — repository의 중복 판정을 제거한다.
4. **Repository만 변환** — `updateAgentChatSessionRecord`는 `toUpdateData()`를 받아 저장만 한다.
5. **assistant 메시지 조건부 추가** — 어시스턴트 텍스트·usage가 전혀 없으면 assistant 메시지를 저장 목록에 추가하지 않는다(기존 `toMessagesWithAssistant` 규칙 보존).

**스키마 변경 없음** — 저장 필드는 동일하므로 마이그레이션이 없다.

### 변경: `src/features/agent-chat/services/start-agent-chat-session.service.ts`

외부 계약(반환 객체 `id`/`assistantMessageId`/`recordStep`/`fail`)은 유지하고 내부만 교체한다.

```text
repo.create(running, 요청 메시지)                    ← 지금과 동일 (쓰기 1)
session = AgentChatSession.start({ id, assistantMessageId, requestMessages })

recordStep({ step, text, status }):                  ← route의 onStepEnd가 매 스텝 호출
  session.recordStep({ step, text })                 — 메모리 누적만
  status === 'completed' →  session.complete()  →  repo.save(session)   (쓰기 2)

fail(message):                                       ← route의 onError·catch가 호출
  session.isTerminal이면 no-op (멱등)
  아니면 session.fail(message)  →  repo.save(session)
```

레이스 해결: 같은 요청의 같은 Aggregate 인스턴스를 공유하므로 종결 전이는 메모리에서 한 번만 일어난다 — `complete()`가 먼저면 `fail()`은 no-op, 반대도 마찬가지. 종결 update가 한 건만 발행되므로 DB 레벨 순서 경쟁이 사라진다. Aggregate의 throw 가드는 방어선으로 남는다(서비스가 `isTerminal`을 먼저 확인하므로 정상 경로에서는 나오지 않는다).

### 변경: `src/features/agent-chat/repositories/agent-chat-session.payload.repository.ts`

- `updateAgentChatSessionRecord` → `saveAgentChatSessionRecord(session, user)`: `session.toUpdateData()`를 받아 저장만. `completedAt` 판정 제거.
- `createAgentChatSessionRecord`: 유지 (초기 insert, 항상 running).
- `updateAgentChatSessionReaction`: **무변경.** 리액션은 실행 생명주기가 아니라 완료된 세션에 사용자가 나중에 붙이는 피드백 메타데이터다. "종결 세션 불변" 불변식의 대상은 실행 기록(status·messages 본문·usage)이며 리액션은 명시적 예외다.

### route: `src/app/api/agent-chat/route.ts`

onEnd 훅 1건 추가 — 스트림 종료 시 finalize() 호출(종결 안전망). onStepEnd의 finishReason 기반 status 계산과 onError/catch의 fail() 호출은 그대로.

## 에러 처리

- `AgentChatSessionStateError` — 종결 세션에 전이 시도. domain 파일에서 export.
- 프로세스 강제 종료로 running에 영원히 남는 세션: 수용한 트레이드오프. 오래된 running은 그 자체로 비정상 종료 신호이므로 정리 배치는 만들지 않는다(YAGNI).
- `fail()` 저장 실패: 지금처럼 route가 `.catch`로 로깅만 한다 — 변화 없음.

## 테스트

- **신규 단위 테스트** `src/features/agent-chat/domain/agent-chat-session.test.ts` — DB·mock 없이 순수 검증:
  1. `recordStep` 누적 후에도 running 유지, `toUpdateData()`에 completedAt 없음
  2. `complete()` 후 status·completedAt·assistant 메시지(텍스트+usedTools/usedSkills/aiUsage) 반영
  3. 어시스턴트 텍스트·usage가 전혀 없으면 assistant 메시지를 추가하지 않음
  4. 종결 세션에 `recordStep`/`complete`/`fail` → `AgentChatSessionStateError`
  5. `fail()` 후 errorMessage·completedAt 기록 + 그 시점까지 누적된 부분 텍스트 보존
- **기존 서비스 테스트 수정** `start-agent-chat-session.service.test.ts` — 새 계약으로 갱신: running 스텝에서는 update 미호출, completed 스텝에서 한 번만 호출. finalize 종결 저장·no-op 테스트 2건 추가.
- 검증: `pnpm check`, `pnpm typecheck`, `pnpm vitest run` (기존 256 + 신규, 정확한 기대 개수는 구현 계획에서 확정).

## 범위 제외

- 리액션 경로 변경 — 위 근거로 유지.
- CheckSession과의 공유 SessionAggregate 추상화 — 두 번째 구현이 완성된 뒤 실제 중복을 보고 판단.
- 스키마·마이그레이션 — 변경 없음.
- agent 실행 로직(`src/agents/agent-chat.agent.ts`) — 무변경.
