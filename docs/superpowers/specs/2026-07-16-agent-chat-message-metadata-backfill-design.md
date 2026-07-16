# AgentChatSession 메시지 메타데이터 백필 설계

- 날짜: 2026-07-16
- 상태: 승인됨 (설계 3섹션 사용자 승인 완료)
- 선행: `docs/superpowers/specs/2026-07-16-agent-chat-session-aggregate-design.md` (AgentChatSession Aggregate 전환, main 병합됨)

## 문제

Agent 채팅은 턴마다 새 세션 레코드를 만든다. 클라이언트는 매 요청에 전체 대화 히스토리를 다시 보내는데, 클라이언트가 가진 assistant 메시지는 `messageId/text/reaction`뿐이다. `toSessionMessages()`가 이것만 저장 형태로 매핑하므로 **이전 턴 assistant 메시지의 `usedTools`/`usedSkills`/`aiUsage`는 최신 레코드에서 소실**된다.

각 턴의 메타데이터 자체는 그 턴의 세션 레코드(마지막 assistant 메시지)에 온전히 저장되어 있다 — 유실이 아니라 분산이 문제다. 어드민 "대화 메시지" 테이블에서 최신 레코드를 열면 히스토리 행의 Model/Tools/Skills/Tokens가 전부 `-`로 보인다.

## 목표

새 턴 레코드를 만들 때 **직전 세션 레코드에서 messageId가 일치하는 assistant 메시지의 메타데이터를 복사(백필)**해서, 최신 레코드가 항상 대화 전체의 턴별 실행 기록 합본이 되게 한다.

**체인 원리:** 턴 N-1의 레코드는 이미 백필된 상태로 저장되므로 턴 1~N-1의 메타데이터를 전부 가진다. 따라서 매 턴 "직전 레코드 1건 조회"만으로 충분하고, 조회 비용은 대화 길이와 무관하게 고정이다.

**체인 단절 방어:** 미종결 턴(네트워크 단절 등)은 assistant 메시지가 레코드에 저장되지 않지만 클라이언트는 그 messageId를 히스토리에 계속 되돌려 보낸다. 마지막 assistant id 하나로만 조회하면 이 경우 0건이 되어 체인이 영구히 끊긴다. 그래서 조회 키는 **히스토리의 모든 assistant messageId 배열(`in`)**이고, 그중 하나라도 포함하는 본인 세션 최신 1건을 잡는다. 미저장 턴의 assistant는 소스에 없으므로 자연히 빈칸으로 남는다.

## 결정 사항

| 결정 | 선택 | 근거 |
|------|------|------|
| 소급 적용 | 앞으로 생성분만 | 기존 레코드는 테스트 데이터. 각 턴의 원본 레코드에서 여전히 확인 가능 |
| 구현 위치 | 서비스 계층 | 컬렉션 훅은 reaction 갱신 등 무관한 update에도 발동해 조건 분기가 필요하고, 도메인 로직이 컬렉션 정의로 샘. Aggregate 전환의 소유권 방향(서비스/도메인 소유)과 일치 |
| 실패 처리 | best-effort | 백필은 기록 보강이지 채팅의 전제조건이 아님. 실패 시 로그만 남기고 진행 |
| 복사 필드 | `usedTools`/`usedSkills`/`aiUsage` 세 개만 (`aiUsage.rawUsage` 제외) | `text`/`reaction`은 클라이언트 현재값이 정답 (reaction은 이후 변경 가능). rawUsage는 합본마다 복제하면 레코드가 턴 수만큼 비대해지므로 원본 턴 레코드에만 남긴다 |

## 변경 파일 (3개, 스키마 변경 없음)

| 파일 | 변경 |
|------|------|
| `src/features/agent-chat/repositories/agent-chat-session.payload.repository.ts` | 조회 함수 추가: `findLatestAgentChatSessionContainingAnyMessage(messageIds, user)` — `messages.messageId in` + `createdBy` 본인 세션 중 최신(`-createdAt`) 1건을 `depth: 0`으로 반환 |
| `src/features/agent-chat/services/backfill-agent-chat-session-messages.service.ts` (신규) | 조회 + 순수 병합을 묶은 백필 서비스 |
| `src/features/agent-chat/services/start-agent-chat-session.service.ts` | `toSessionMessages()` 직후 백필 호출 한 줄 추가 |

Aggregate(`agent-chat-session.ts`), 컬렉션 스키마(`AgentChatSessions.ts`), 어드민 UI(`AgentChatMessagesTable.tsx`)는 변경하지 않는다.

## 데이터 흐름

```
POST /api/agent-chat (턴 N)
  │
  ├─ toSessionMessages()            클라이언트 히스토리 → 저장 형태 (메타데이터 없음)
  │
  ├─ backfillSessionMessages()      ← 신규
  │    ① 히스토리의 모든 assistant messageId 수집 (없으면 즉시 반환 — 첫 턴)
  │    ② repository: 그중 하나라도 포함하는 본인 세션 최신 1건 조회 (in)
  │    ③ messageId 매칭으로 usedTools/usedSkills/aiUsage 복사
  │
  ├─ createAgentChatSessionRecord(병합본)     running 레코드부터 완비
  └─ AgentChatSession.start(병합본)           종결 저장(toUpdateData)에도 자동 반영
```

백필은 생성 전에 한 번 실행된다. Aggregate가 병합본 `requestMessages`를 들고 있으므로 종결 저장에는 추가 작업이 필요 없다.

## 병합 규칙

- 대상: 히스토리 중 `role: 'assistant'`이고 `usedTools`/`usedSkills`/`aiUsage`가 모두 빈 메시지만. user/system 메시지는 건드리지 않는다.
- 복사: 이전 레코드에서 같은 `messageId`를 찾아 `usedTools`/`usedSkills`/`aiUsage`를 복사한다.
- 유지: `text`/`reaction`은 클라이언트 현재값을 유지한다 — 이전 레코드의 낡은 reaction으로 덮지 않는다.
- no-op: 이전 레코드에 없는 messageId, 이전 레코드 쪽도 빈 메시지(백필 도입 전 레코드)는 그대로 빈칸으로 둔다. 있는 것만 복사하고 없는 것을 만들어내지 않는다.
- 현재 턴의 assistant 메시지는 백필과 무관 — 기존대로 Aggregate의 `toMessages()`가 합성한다.

## 에러 처리

- 조회 실패(DB 오류 등): 백필만 건너뛰고 입력을 그대로 반환한다. `payload.logger.warn` 한 줄. 채팅은 정상 진행.
- 조회 결과 0건: 에러가 아닌 정상 no-op (첫 턴, 또는 이전 레코드 삭제됨).
- 접근 제어: 컬렉션 read 접근이 `managerOrAdmin`이라 사용자 컨텍스트(`overrideAccess: false`)로는 본인 기록도 읽을 수 없다. 따라서 같은 repository의 `updateAgentChatSessionReaction`과 동일한 패턴으로 `overrideAccess: true` + `createdBy: { equals: user.id }` 명시 필터를 사용한다 — 본인 세션 한정은 이 필터가 보장하며, 다른 사용자의 세션이 백필 소스로 섞일 수 없다.

## 보안

클라이언트가 보내는 값은 여전히 `messageId/text/reaction`뿐이고, 메타데이터의 출처는 항상 서버가 과거에 저장한 레코드다. 클라이언트가 가짜 messageId를 보내도 본인 세션에서 매칭되지 않으면 빈칸으로 남는다.

## 테스트

**신규 `backfill-agent-chat-session-messages.service.test.ts`** (조회는 mock):

1. 히스토리 assistant 메시지에 이전 레코드의 usedTools/usedSkills/aiUsage가 복사된다
2. text·reaction은 클라이언트 값이 유지된다 (이전 레코드 값으로 덮이지 않음)
3. 첫 턴(assistant 없음)은 조회 없이 입력 그대로 반환한다
4. 이전 레코드에 없는 messageId는 빈칸 그대로 둔다
5. 조회가 throw해도 입력 그대로 반환하고 채팅을 막지 않는다

**갱신 `start-agent-chat-session.service.test.ts`**: "백필된 메시지가 create와 Aggregate에 전달된다" 케이스 1개 추가. 기존 도메인 5 + 서비스 5 테스트는 무변경 통과.

**수동 검증:** dev 서버에서 3턴 대화 후 최신 세션 레코드의 어드민 대화 메시지 테이블에서 이전 턴 assistant 행에 Model/Tools/Skills/Tokens가 채워지는지 확인. 기존 세션(로컬 15~22)은 소급하지 않으므로 여전히 빈칸 — 정상.
