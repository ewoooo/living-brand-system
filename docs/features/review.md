# Review

## 1. 목적

임의의 디자인(이미지)이 브랜드 가이드라인에 부합하는지 판정합니다. 단일 합/불이 아니라 **rule(항목)별 상태 + 충족도**를 돌려주며, 결정론적으로 판정 가능한 항목은 즉시, 판단이 필요한 항목은 AI로 뒤이어 채웁니다.

브랜드 규정 지능이 사는 곳이며, 다른 기능이 "규정 부합"을 확인해야 할 때 재사용하는 단위입니다.

## 2. 핵심 계약

재사용 단위는 유스케이스 서비스 **`startCheckSession`**입니다. 어떤 표면에서도 호출하도록 feature 폴더가 아닌 최상위(`src/services/start-check-session.service.ts`)에 둡니다.

- 입력: 이미지 바이트(Buffer), CheckScenario Key(Check 실행 범위 선택), 콘텐츠 플래그(logo/typography/illustration/photography), 호출 출처(`review-page`/`chat`/`mcp-call`), 사용자
- 출력: `{ checkSessionId, results(checkKey→CheckResult), pendingCheckKeys }`
- `CheckResult`의 판정은 `rawResult.status`(`pass`/`ok`/`needs_review`/`fail`)와 `fulfillment`(충족도 %)로 표현됩니다.
- 2단계 계약: 결정론적 Check는 즉시 채워지고, AI(heuristic) Check는 `pendingCheckKeys`로 반환된 뒤 **`completeCheckSessionAiCheck`**로 완성합니다.
- 기준 조회 단위: `getRuntimeChecks(checkKeys?)`(실행), `getCheckRuleset()`(페이지 뷰모델).
- 기준 소스: published `guideline-documents`의 문서 및 Block `checks[]`. 실행 시 `source.documentId`와 소유 문서 또는 Block의 타입별 구조화 evidence를 만들고, heuristicCriteria·heuristicPrompt·역할이 포함된 referenceAssets·RuleChecker 계약과 함께 `CheckSession.rulesetSnapshot`에 고정합니다. Block 식별자와 문서 제목은 evidence 계약에 복사하지 않습니다.

### 용어와 식별자

| 용어 | 책임 | 식별자 |
| --- | --- | --- |
| Check | 문서 작성자가 선언한 검수 항목과 기준값을 소유 | `Check.key` |
| Checker | 여러 Check가 재사용하는 실행 도구 계약 | `Checker.key` |
| Deterministic implementation | 코드 registry에 등록된 결정론적 구현 | 런타임 `Checker.implementationKey`·저장 모델 `RuleChecker.checkerKey` |

`RuleChecker`는 Payload collection과 저장 모델의 내부 이름으로만 유지합니다. Admin과 실행·표시 계약에서는 `Checker`를 사용하며, `Checker.key`와 구현 키를 혼용하지 않습니다.

### 결정론적 실행 계약

결정론적 검수는 아래 순서를 따릅니다.

```text
환경 입력
→ Adapter가 공통 Observation 생성
→ 필요한 경우 Extractor가 관측 대상 식별
→ Checker가 측정값 생성
→ Evaluator가 Check 기준과 비교
→ CheckResult 생성
```

| 구성 요소 | 소유하는 책임 | 소유하지 않는 책임 |
| --- | --- | --- |
| Adapter | 이미지·PDF·Figma 입력을 공통 Observation으로 변환 | 대상 추정, 기준 적용, 판정 |
| Extractor | Observation에서 색상 쌍·주요 색상·로고 영역처럼 측정 대상을 식별 | 기준 적용, `pass`/`fail` 판정 |
| Checker | 입력 Observation에서 이름과 단위가 고정된 측정값을 계산 | 브랜드·문서 기준, 사용자 메시지, 최종 판정 |
| Check | 기준값, 적용 범위, 문서 근거, 사용자 메시지를 소유 | 측정 알고리즘 |
| Evaluator | 측정값과 Check 기준을 비교해 상태와 충족도를 계산 | 이미지 디코딩, 대상 추출 |

Checker의 출력은 판정이 아니라 측정 성공 여부입니다.

```ts
type MeasurementResult =
	| {
			state: 'measured'
			measurements: Record<string, number | string | boolean>
			facts?: Record<string, number | string | boolean | string[]>
	  }
	| {
			state: 'not_measurable'
			reasonCode: string
			facts?: Record<string, number | string | boolean | string[]>
	  }
```

Check의 결정론적 설정은 측정 방식에 필요한 매개변수와 통과 기준을 구분합니다.

```ts
interface DeterministicCheckOptions {
	parameters?: Record<string, unknown>
	criteria: Array<{
		measurement: string
		operator: 'gte' | 'lte' | 'eq' | 'in' | 'within'
		expected: number | string | boolean | number[] | string[]
		tolerance?: number
	}>
}
```

- `parameters`는 색상 양자화 단위나 투명도 처리처럼 측정 방법에 영향을 줍니다.
- `criteria`는 최소 대비율이나 최대 허용 비율처럼 최종 판정에만 영향을 줍니다.
- Checker가 지원하는 입력, parameters, measurements는 구현 키로 고정합니다. 호환되지 않는 계약 변경은 기존 키를 수정하지 않고 새 구현 키로 등록합니다.
- 실행 시 사용한 options와 Checker 실행 계약은 기존 `CheckSession.rulesetSnapshot`에 함께 저장합니다.
- Admin은 Checker가 지원하지 않는 measurement·operator·expected 조합을 저장 전에 거부합니다. 기존 snapshot의 설정이 유효하지 않으면 실행하지 않고 `needs_review`와 `invalid_criteria`를 남깁니다.

### Observation과 추출 실패

첫 공통 Observation은 기존 `PixelGrid`가 담당하던 Raster 데이터입니다. Adapter는 원본을 sRGB RGBA 픽셀과 실제 너비·높이로 정규화하고, 픽셀 배열은 실행 중에만 유지합니다. CheckSession에는 원본 픽셀을 저장하지 않고 측정값과 작은 facts만 저장합니다.

Extractor는 필요한 경우에만 둡니다. Raster만으로 측정 가능한 밝기·캔버스 크기는 직접 Checker로 전달하고, 대비·팔레트·로고 기하는 각각 색상 쌍·주요 색상·로고 영역 Observation을 먼저 만듭니다. 같은 실행에서 동일한 Observation은 한 번만 추출해 재사용합니다.

초기 구현에서는 Observation 종류마다 fallback Extractor를 하나만 등록합니다. Adapter가 Figma 노드 경계처럼 더 정확한 Observation을 제공하면 그 값을 우선 사용합니다. 실제로 같은 Observation을 만드는 추출 방식이 둘 이상 필요해질 때까지 Check에 Extractor 선택 필드를 추가하지 않습니다.

```text
not_extractable
→ not_measurable
→ needs_review
```

입력이나 관측 대상이 없다는 이유로 브랜드 규정 위반을 뜻하는 `fail`을 반환하지 않습니다.

### Evaluator 상태 규칙

- 모든 criteria를 만족하면 `pass`입니다.
- 하나 이상의 측정된 criteria를 위반하면 `fail`입니다.
- 지원하지 않거나 손상된 입력은 Adapter 단계에서 요청 오류로 종료하며 CheckResult를 만들지 않습니다.
- 정상 입력에서 대상 추출 실패 또는 필수 측정값 누락이 발생하면 `needs_review`입니다.
- Deterministic 실행은 의미가 불명확한 `ok`를 생성하지 않습니다.
- 각 criteria 비교에는 `measurement`, `operator`, `expected`, `actual`, `satisfied`를 남깁니다.
- `fulfillment`는 평가한 criteria 중 충족한 항목의 비율입니다. 평가한 criteria가 없으면 `null`입니다.

### 첫 적용 범위

첫 구현은 Contrast Checker 한 경로로 제한합니다.

```text
Raster Observation
→ Color Pair Extractor
→ Contrast Checker: contrastRatio 측정
→ Evaluator: contrastRatio >= Check 기준값
→ CheckResult
```

색상 쌍을 찾지 못하면 `needs_review`로 끝냅니다. 이 경로가 검증되기 전에는 범용 Extractor DAG, 새 의존성, 전체 Checker 일괄 변환을 도입하지 않습니다.

## 3. 표면

| Surface | 상태 | 진입점 |
| --- | --- | --- |
| [Page](../surfaces/page.md) | 구현 | `/review` — 이미지 업로드 → 항목별 결과 테이블. `/review/rules` — 블록 타입별 구조화 evidence 카탈로그(제목·키·근거 검색, 판정 방식 필터, 결과 개수 표시). 클라이언트가 `/api/check` → `/api/check/ai` 순으로 호출 |
| REST | 구현 | `POST /api/check`(FormData, 20MB 제한, origin·인증 게이트), `POST /api/check/ai` |
| [AI Chat](../surfaces/ai-chat.md) | 구현 | agent tool `runCheck`(+`listCheckScenarios`)이 `startCheckSession`을 호출 |
| MCP | 부분 | `mcp-call` 출처값은 정의됨, 전용 라우트는 없이 `/api/check` 재사용 |

## 4. 의존

- AI 프로바이더: Anthropic(Vercel AI SDK `generateText`+`Output.object`). 모델과 기본 프롬프트는 Check가 참조하는 RuleChecker에서 선택하고, Check의 source·구조화 evidence·heuristicCriteria·heuristicPrompt를 JSON text part로, 검수 대상과 referenceAssets를 file part로 전달한다. 모델은 기준별 `present`/`absent`/`uncertain` 관찰값만 반환하며 최종 `pass`/`fail`/`needs_review`는 검수 Service의 Evaluator가 결정한다. 한 세션의 heuristic Check는 한 번의 AI 호출로 평가하고, 설정·호출·출력 검증 실패는 `needs_review`로 처리한다.
- 이미지 디코딩: `sharp`(128px 픽셀 그리드 추출).
- 결정론적 checker: palette-compliance / color-combination / spot-color / background-tone / clear-space / relative-size / canvas-format. RuleChecker의 `checkerKey`로 registry를 조회하며, 미등록 checker는 `implemented:false`로 표시.
- Payload 컬렉션: `guideline-documents`(Check 기준), `brand-colors`(팔레트) 읽기. 세션은 `check-sessions`에 영속(CheckRulesetSnapshot을 함께 저장해 AI 후속 단계가 재사용).

## 5. 크로스커팅

- 인증·업로드 제한: [07. 보안](../07-security.md)
- 결과 문구·접근성: [08. 접근성과 다국어](../08-accessibility-i18n.md)
- 도메인 위치(품질 검수): [04. 도메인 모델](../04-domain-model.md)
- 세션 데이터 생명주기: [03. 데이터 생명주기](../03-data-lifecycle.md)
