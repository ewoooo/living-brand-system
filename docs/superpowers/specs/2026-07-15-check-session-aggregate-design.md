# CheckSession Aggregate 전환 설계

`docs/features/review.md` 3장(객체 모델 전환 방향)의 첫 전환을 구현하기 위한 스펙.
CheckSession의 상태 전이와 결과 병합 규칙을 Transaction Script(서비스 함수)에서 Aggregate 객체로 옮긴다.

## 배경과 문제

상태(`running → completed/failed`)를 가진 CheckSession의 전이 규칙이 지금은 서비스 함수와 repository에 흩어져 있다.

1. **완료 세션 재변경 미차단** — `completeCheckSessionAiCheck`(`src/services/start-check-session.service.ts`)는 세션 status를 확인하지 않고 무조건 `completed`로 덮어쓴다. 이미 종결된 세션에 `/api/check/ai`를 다시 호출하면 결과가 덮어써진다.
2. **completedAt 규칙 중복** — `status === 'running' ? undefined : now` 판정이 `check-session.payload.repository.ts`의 create·update 두 곳에 복사되어 있다. "종결 시각은 종결 전이가 찍는다"는 도메인 규칙이 repository로 새어 있다.
3. **pendingCheckKeys 미영속** — AI가 판정해야 할 Check 키 목록이 API 응답과 클라이언트 상태에만 존재한다. 서버는 후속 AI 검수에서 클라이언트가 보내는 `checkKeys`를 검증 없이 신뢰한다.

## 결정 사항

- **Aggregate 형태**: 클래스. 상태를 private으로 닫고 전이 메서드만 공개한다.
- **`/api/check/ai` 계약**: 클라이언트의 `checkKeys` 파라미터를 제거하고 세션에 저장된 `pendingCheckKeys`를 사용한다.
- **종결 세션 재호출**: completed면 저장된 결과를 200으로 그대로 반환(멱등, AI 재실행 없음). failed면 409.

## 컴포넌트

### 신규: `src/features/asset-check/domain/check-session.ts`

```ts
class CheckSession {
	// 복원 — Repository가 읽은 Payload 레코드에서 Aggregate를 만든다.
	// pendingCheckKeys가 null인 과거 레코드는 빈 배열로 취급한다.
	static fromRecord(record): CheckSession

	// 읽기
	get id / status / results / pendingCheckKeys / rulesetSnapshot

	// 전이 — 모두 running에서만 허용, 아니면 CheckSessionStateError throw
	applyImmediateResults({ results, pendingCheckKeys })
	applyAiResults({ results, aiUsage })   // 적용한 키를 pending에서 제거
	fail(errorMessage)

	// Repository 전용 — 저장할 필드만 뽑는다
	toUpdateData()
}
```

불변식:

1. **running에서만 변경** — 전이 메서드는 종결 상태에서 `CheckSessionStateError`를 던진다.
2. **완료는 스스로 판단** — `applyImmediateResults`/`applyAiResults` 후 `pendingCheckKeys`가 비면 내부에서 `completed`로 전환한다. public `complete()`는 두지 않는다. 호출자가 완료 조건을 다시 계산할 여지를 없앤다.
3. **completedAt은 종결 전이가 찍는다** — completed/failed 전환 순간 Aggregate가 기록한다.
4. **Repository만 변환** — Aggregate ↔ Payload 레코드 변환은 repository 경계에서만 일어난다.

에러 타입(같은 domain 파일에 둔다):

- `CheckSessionStateError` — 종결 세션에 전이 시도. 서비스가 status를 먼저 확인하므로 정상 경로에서는 나오지 않는 방어선.
- `CheckSessionTerminalError` — failed 세션에 AI 후속 검수 요청. route가 409로 변환한다.

### 생성 흐름은 유지

세션 최초 insert는 지금처럼 repository가 수행하고(레코드 ID는 DB가 발급), Aggregate는 반환된 레코드에서 `fromRecord`로 복원해 이후 전이를 소유한다. "ID 없는 Aggregate → insert 후 ID 주입"이라는 어색한 중간 상태를 피한다.

### 변경: `src/features/asset-check/repositories/check-session.payload.repository.ts`

- create는 유지(초기 insert). `completedAt` 판정 로직은 제거 — 초기 상태는 항상 running이므로 필요 없다.
- update는 개별 필드 대신 `aggregate.toUpdateData()`를 받아 저장만 담당한다.
- get은 `CheckSession.fromRecord`를 거쳐 Aggregate를 반환한다.

### 변경: `src/services/start-check-session.service.ts`

`startCheckSession` — 입출력 계약 동일, 내부만 Aggregate 사용:

```text
repo.create(running, snapshot)  →  session = CheckSession.fromRecord(record)
runImmediateCheck(...)          →  session.applyImmediateResults({ results, pendingCheckKeys })
(deferHeuristic 아니면) runHeuristicCheck(...)  →  session.applyAiResults({ results, aiUsage })
repo.save(session)              →  { checkSessionId, results, pendingCheckKeys, rulesetSnapshot } 반환
실패 시: session.fail(message)  →  repo.save(session)  →  throw
```

`completeCheckSessionAiCheck` — 입력에서 `checkKeys` 제거:

```text
입력: { buffer, checkSessionId, user }
session = repo.get(id)
completed  →  { checkSessionId, results: session.results } 반환 (멱등)
failed     →  CheckSessionTerminalError throw
running    →  runHeuristicCheck(buffer, session.pendingCheckKeys, session.rulesetSnapshot)
              session.applyAiResults(...)  →  pending 비면 자동 completed  →  repo.save
```

멱등 응답이 전체 `session.results`를 반환하는 이유: 저장된 결과에서 AI 몫만 골라낼 수 없고, 클라이언트는 check key로 병합하므로 전체를 받아도 결과가 동일하다.

### 변경: API·클라이언트

- `src/app/api/check/ai/route.ts` — `parseCheckKeys` 삭제, `CheckSessionTerminalError` → 409 응답.
- `src/features/asset-check/services/submit-check.client.ts` — `submitAiCheck`에서 `checkKeys` form 필드와 파라미터 제거. `runFullCheck`의 AI 실패 폴백은 `serverResult.pendingCheckKeys`를 그대로 쓰므로 변화 없음.
- `src/agents/agent-tools.agent.ts`(runCheck tool) — `deferHeuristic` 없이 한 번에 끝나는 경로라 무변경 예상. 구현 계획에서 재확인한다.

### 스키마: `src/collections/CheckSessions.ts`

`pendingCheckKeys` 필드 1개 추가. `results`·`rulesetSnapshot`과 같은 `json` 타입(문자열 배열 저장).

- CLAUDE.md DB 협업 규칙을 따른다: 로컬은 `PAYLOAD_DB_PUSH=true`, 작업 완료 후 한 머신에서 `pnpm migrate:create <name>` → `.ts` + drizzle 스냅샷 `.json` + `migrations/index.ts`를 함께 커밋. PR 리뷰 요청 전 완료.
- 백필 없음 — running 세션은 두 API 호출 사이 몇 초만 존재하고 배포 환경이 없다. `pendingCheckKeys`가 null인 과거 레코드는 `fromRecord`에서 `?? []`.

## 에러 처리

- `startCheckSession` 실패 경로는 현행 유지: `fail()` 저장 후 re-throw → route 500.
- AI 검수 중 예외(`runHeuristicCheck` throw)는 세션을 running에 남긴다 — pending이 영속화되므로 클라이언트 재시도가 이어받는다.
- 종결 세션 재호출: completed → 200 멱등, failed → 409.

## 테스트

- **신규 단위 테스트** `src/features/asset-check/domain/check-session.test.ts` — DB·Payload·AI 없이 순수 검증:
  1. 즉시 결과 적용 후 pending이 남으면 running 유지
  2. pending이 비면 자동 completed + completedAt 기록
  3. AI 결과 적용 시 pending 제거·결과 병합
  4. 완료/실패 세션에 전이 시도 → `CheckSessionStateError`
  5. fail 후 errorMessage·completedAt 기록
- **기존 테스트** — `run-check.service.test.ts` 등 순수 계산 테스트는 무변경. `completeCheckSessionAiCheck`의 checkKeys 계약을 쓰는 테스트가 있으면 새 계약으로 수정(구현 계획에서 확인).
- 검증 커맨드: `pnpm check`, `pnpm typecheck`, `pnpm vitest run` (기존 250개 + 신규. 워크트리에서는 `.env`·`.env.local` 복사 필수).

## 범위 제외

- AgentChatSession 객체화·recordStep 쓰기 축소 — 이 전환의 패턴 검증 후 별도 작업.
- `CheckRun`/`CheckBasis`/`CheckDecision` 분리 — 재검수 이력이 필요해질 때 (review.md 계획대로).
- Template·GuidelineDocument — Payload draft/publish 버저닝이 이미 생명주기를 소유.
- Checker/Extractor/Evaluator — 상태 없는 순수 함수 유지.
