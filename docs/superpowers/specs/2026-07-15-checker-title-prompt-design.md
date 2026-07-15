# Checker 타이틀·내장 프롬프트 설계

날짜: 2026-07-15
상태: 승인됨
브랜치: `feat/checker-title-prompt`

## 배경과 문제

Checkers(`rule-checkers`) 컬렉션은 현재 기술 키(`model.anthropic.sonnet`)를 표시 이름으로 쓴다.
가이드라인 Check가 checker를 relationship으로 선택할 때 드롭다운에 이 키가 그대로 노출되어
비개발자가 고르기 어렵다. 또한 휴리스틱 검수 프롬프트는 코드가 소유하고 checker의
`promptKey`는 코드 프롬프트의 버전 핀 역할만 해서, 매니저가 검수 지침을 조정할 방법이 없다.

## 결정

### 1. `title` 필드 추가 (비개발자용 표시 이름)

- `rule-checkers`에 `title`(text, required) 추가.
- `admin.useAsTitle: 'title'` — Check의 checker 드롭다운·목록에 타이틀 표시.
- `key`는 안정 식별자로 유지(unique, 스냅샷·런타임 사용 중).
- 목록 컬럼: `['title', 'key', 'executor', '_status', 'updatedAt']`.
- `listSearchableFields`: `title` 추가, `promptKey` 제거.

### 2. `promptKey` 삭제 → `prompt` 삽입란 도입

프롬프트 계층과 경계:

| 층위 | 소유 | 내용 |
| --- | --- | --- |
| 역할 규정(system) | 코드 | 관찰자 역할, 판정 금지, 메타데이터 주장 금지 |
| 출력 계약 | 코드 | criterion별 `{present\|absent\|uncertain, reason}` Zod 스키마 |
| 계약 강제 지시문 | 코드 | JSON 반환 강제, pass/fail 금지 문장 |
| 관찰 컨텍스트 | **DB** | Check의 `heuristicPrompt` + **신규: checker의 `prompt`** |

- `prompt`(textarea, heuristic 조건부, 선택)는 관찰 컨텍스트 층위에만 삽입된다.
  매니저가 무엇을 쓰든 출력 계약과 판정 금지 규칙은 코드가 강제하므로 검수 파이프라인이 깨지지 않는다.
- 삽입 방식: `formatCheck`의 per-check 블록에 `checkerPrompt:` 라인 추가(기존 `heuristicPrompt`와 동일 패턴).
  같은 체커를 쓰는 체크가 많으면 텍스트가 반복되지만 관찰 지침은 짧아 실질 영향이 작다.
  토큰이 실측으로 문제 되면 배치 상단 dedupe 삽입으로 최적화한다.
- `AI_CHECK_PROMPT_KEY` 상수와 promptKey 일치 검증은 삭제한다. 배치의 모델 단일성 검증은 유지한다.

### 3. 런타임 변경

- `get-check-ruleset.service.ts`: `RuntimeCheck.promptKey` → `prompt`.
  heuristic `implemented` 판정: `Boolean(model && promptKey)` → `Boolean(model)` (프롬프트는 선택).
- `ai-check.agent.repository.ts`: promptKey 검증 삭제, `formatCheck`에 `checkerPrompt:` 라인,
  지시문에 "checkerPrompt를 관찰 컨텍스트로만 적용" 한 줄 추가.

### 4. 마이그레이션

- 단일 마이그레이션: `title` 추가(기존 행은 `key` 값으로 백필) + `prompt` 추가(nullable) +
  `prompt_key` 삭제. 버전 테이블(`_rule_checkers_v`)도 동일 처리.
- 배포 전 제품이므로 expand/contract를 한 파일에 담는다. 빈 DB에서 `pnpm migrate` 통과를 CI가 검증한다.
- `pnpm generate:types`로 `payload-types.ts` 재생성, 소스와 같은 커밋에 포함.

### 5. 테스트

- promptKey를 참조하는 기존 테스트(RuleCheckers, ruleset, ai-check) 갱신.
- 신규 검증: checker `prompt`가 AI 메시지의 check 블록에 삽입되는지 1건.

## 검토한 대안

- **promptKey 유지 + prompt 병행**: 삽입란 도입 후 promptKey의 존재 이유가 사라져 죽은 필드가 됨. 기각.
- **프롬프트 전체 DB 이관**: 출력 계약·판정 금지 문장이 편집자에게 노출되어, 잘못 수정하면
  해당 체커를 쓰는 검수 전체가 실패. 기각.
- **배치 상단 dedupe 삽입**: 여러 체커 혼합 배치에서 지시-체크 매핑이 모호. 토큰 문제 실측 전까지 보류.

## 작업 환경 제약

- main이 작업 중이므로 전용 워크트리에서 진행.
- 스키마 변경 브랜치이므로 dev 서버 확인에는 워크트리 전용 DB가 필요
  (공유 DB + `PAYLOAD_DB_PUSH=true` 금지 — CLAUDE.md Local Machine Database Rules).
  코드·마이그레이션·테스트는 DB 없이 완결 가능.

## 후속 과제 (이번 범위 제외)

- checker ↔ `agent-skills` relationship: 스킬 본문을 휴리스틱 관찰 컨텍스트로 첨부.
  스킬 본문이 길어 토큰·컨텍스트 예산 설계가 선행되어야 함.
