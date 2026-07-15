# Advisory 체커 설계 — manual executor의 AI 조언 진화

날짜: 2026-07-15
상태: 사용자 리뷰 대기

## 목표

1. **Advisory 체커**: 현재 manual executor는 "브랜드 담당자 확인 필요"만 찍고 사람에게 넘긴다. 이 자리를 AI가 생성한 **한 문단 디자인 조언**이 대신한다. 조언만 하고 pass/fail 판정은 내리지 않는다.
2. **체커 스케일링**: admin이 코드 변경 없이 model·prompt 조합으로 체커를 양산할 수 있게 한다. 새 메커니즘(출력 계약)은 개발자가 서비스 차원에서 추가한다.
3. **모델 선택 실작동**: 현재 `runAiCheck`는 배치 내 모든 체크가 같은 모델일 때만 동작한다(`ai-check.agent.repository.ts:32`). 모델이 섞이면 전체가 `ai_checker_invalid`로 실패한다. 모델별 배치 분리로 수리한다.

## 결정 사항 (사용자 확인 완료)

- Advisory는 **조언만, 판정 없음** — pass/fail/충족률 집계에서 제외.
- Advisory는 **Check 단위** — 기존 Check↔checker 연결 구조 유지.
- **새 executor 값을 추가하지 않는다.** 기존 `manual` 값이 advisory다. DB enum 값 `manual`은 유지하고 admin 라벨만 `Advisory (AI)`로 변경 (마이그레이션 없음).
- model이 설정된 manual 체커만 AI 조언을 실행한다. **model 미설정 manual 체커는 기존 "브랜드 담당자 확인 필요" needs_review 폴백을 유지**한다 — 기존 데이터가 깨지지 않는다.

## 변경 지점

### 1. `src/collections/RuleCheckers.ts` — admin 입력

- executor 옵션 `'manual'`의 표시 라벨을 `Advisory (AI)`로 변경 (값은 유지).
- `model` select: condition을 `heuristic || manual`로 확장. validate는 heuristic만 필수 유지 (manual은 선택 — 미설정이면 폴백).
- `prompt` textarea: condition을 `heuristic || manual`로 확장. manual용 설명: "조언 관점을 정의합니다 (예: 타이포그래피 위계 관점에서 디자이너처럼 조언)".
- DB 컬럼(model, prompt)은 이미 존재하므로 **스키마 마이그레이션 불필요**.

### 2. `src/blocks/guideline.ts` — Check 블록

- executor 옵션 라벨 `Manual` → `Advisory (AI)` (값 유지). 그 외 변경 없음 — criteria는 heuristic 전용 그대로, messages group도 그대로(폴백 문구로 계속 사용).

### 3. `src/features/asset-check/services/run-check.service.ts` — 실행 분기·모델별 배치

- `runImmediateCheck`: pending 분리 조건을 `executor === 'heuristic' || (executor === 'manual' && check.model)`로 확장. model 없는 manual은 지금처럼 즉시 needs_review 폴백.
- `runHeuristicCheck`:
  - 대상 필터를 위 조건과 동일하게 확장.
  - pending 체크를 **model별로 그룹핑**해 model당 `runAiCheck` 1회 호출. criteria 체크와 advisory 체크는 같은 모델이면 같은 배치에 섞인다 — 호출 횟수가 늘지 않는다.
  - advisory 체크 결과는 `evaluateAdvisory`로, heuristic 체크는 기존 `evaluateHeuristic`으로 평가. checker 표기는 둘 다 `{ key: 'ai', type: 'ai' }`.
  - 현재 `validChecks` 필터(criteria 없는 체크 제외, run-check.service.ts:81)는 heuristic 체크에만 적용하도록 조정 — 그대로 두면 advisory 체크가 AI 호출에서 빠진다.

### 4. `src/features/asset-check/repositories/ai-check.agent.repository.ts` — AI 호출 계약

- 단일 모델 강제 검증 제거 (호출자가 모델별로 그룹핑해서 넘김).
- criteria 필수 검증(`invalid_criteria`)을 heuristic 체크에만 적용.
- `buildAiCheckSchema`: per-check 스키마 분기 —
  - heuristic → `{ observations: { [criterionId]: observation } }` (기존)
  - manual(advisory) → `{ advice: z.string().min(1).max(600) }` (한 문단)
- 사용자 프롬프트에 advisory 지침 추가: "advice가 요구된 체크는 해당 Check 관점에서 디자이너의 개선 조언 한 문단을 한국어로 작성하라. 통과/실패 선언은 금지." 기존 시스템 프롬프트의 판정 금지 원칙은 그대로 advisory에도 적용된다.
- 반환 타입 `AiCheckRunResult`에 `advices: Record<checkKey, string>` 추가 (observations와 나란히).

### 5. `src/features/asset-check/checkers/heuristic-evaluator.ts` — advisory 평가

- `evaluateHeuristic`은 변경하지 않는다.
- `evaluateAdvisory(advice: string | undefined): AiCheckResult` 추가:
  - advice 있음 → `{ status: 'advisory', fulfillment: null, detail: advice }`
  - 없음/빈 문자열 → 기존 관례대로 `needs_review` + `ai_output_invalid`

### 6. 결과 계약 · UI

- `types.ts`: `CheckStatus`에 `'advisory'` 추가. `AiCheckResult`는 status 필드로 이미 수용된다.
- `check-status.ts`: `advisory` 엔트리 추가 — 라벨 "조언", info 계열 색 (기존 `ok`와 동일 팔레트).
- `build-check-review-view.ts`: summary에 advisory 별도 카운트. 통과율(pass/fail) 계산에서 제외.
- 결과 메시지: advisory 결과의 `message`는 조언 문단(detail) 그대로 사용. `CHECK_STATUS`가 `Record<CheckStatus, …>` 타입이라 신규 키 누락은 컴파일 에러로 잡힌다.
- 검수 결과는 세션에 JSON으로 저장되므로 status 값 추가에 따른 DB 마이그레이션은 없다 (구현 시 check-session repository에서 재확인).

## 에러 처리

- AI 호출 실패/형식 오류: 기존 reasonCode 관례 유지 (`ai_request_failed`, `ai_output_invalid` → needs_review).
- 모델 그룹 중 하나가 실패해도 다른 그룹 결과는 살린다 (그룹 단위 failure 처리).

## 테스트

- `evaluateAdvisory` 단위 테스트: 정상 advice / 빈 응답 / undefined.
- `run-check.service.test.ts`: model 있는 manual → pending 분리, model 없는 manual → 즉시 폴백, 모델 2개 혼재 → `runAiCheck` 2회 호출.
- `ai-check.agent.repository.test.ts`: heuristic+advisory 혼합 배치 스키마 조립, advisory 응답 파싱.

## 하지 않는 것 (YAGNI)

- 새 executor 값 추가, executor×outputMode 2축 분리, 세션 전체 총평 advisory, enum rename 마이그레이션.
- deterministic 경로·criteria 계약·Check 연결 구조 변경 없음.
