# Review

## 1. 목적

임의의 디자인(이미지)이 브랜드 가이드라인에 부합하는지 판정합니다. 단일 합/불이 아니라 **rule(항목)별 상태 + 충족도**를 돌려주며, 결정론적으로 판정 가능한 항목은 즉시, 판단이 필요한 항목은 AI로 뒤이어 채웁니다.

브랜드 규정 지능이 사는 곳이며, 다른 기능이 "규정 부합"을 확인해야 할 때 재사용하는 단위입니다.

## 2. 핵심 계약

재사용 단위는 유스케이스 서비스 **`startCheckSession`**입니다. 어떤 표면에서도 호출하도록 feature 폴더가 아닌 최상위(`src/services/start-check-session.service.ts`)에 둡니다.

- 입력: 이미지 바이트(Buffer), 시나리오 키(룰셋·콘텐츠 플래그 선택), 콘텐츠 플래그(logo/typography/illustration/photography), 호출 출처(`review-page`/`chat`/`mcp-call`), 사용자
- 출력: `{ checkSessionId, results(ruleKey→CheckResult), pendingRuleKeys }`
- `CheckResult`의 판정은 `rawResult.status`(`pass`/`ok`/`needs_review`/`fail`)와 `fulfillment`(충족도 %)로 표현됩니다.
- 2단계 계약: 결정론적 rule은 즉시 채워지고, AI(heuristic) rule은 `pendingRuleKeys`로 반환된 뒤 **`completeCheckSessionAiCheck`**로 완성합니다.
- 룰셋 조회 단위: `getCheckRules(ruleKeys?)`(코어), `getCheckRuleset()`(페이지 뷰모델).

## 3. 표면

| Surface | 상태 | 진입점 |
| --- | --- | --- |
| [Page](../surfaces/page.md) | 구현 | `/review` — 이미지 업로드 → 항목별 결과 테이블. 클라이언트가 `/api/check` → `/api/check/ai` 순으로 호출 |
| REST | 구현 | `POST /api/check`(FormData, 20MB 제한, origin·인증 게이트), `POST /api/check/ai` |
| [AI Chat](../surfaces/ai-chat.md) | 구현 | agent tool `runCheck`(+`listCheckScenarios`)이 `startCheckSession`을 호출 |
| MCP | 부분 | `mcp-call` 출처값은 정의됨, 전용 라우트는 없이 `/api/check` 재사용 |

## 4. 의존

- AI 프로바이더: Anthropic(Vercel AI SDK `generateText`+`Output.object`). 모델과 프롬프트는 BrandRule이 참조하는 RuleChecker에서 선택한다. `ANTHROPIC_API_KEY` 없으면 AI 항목은 `needs_review`로 폴백.
- 이미지 디코딩: `sharp`(128px 픽셀 그리드 추출).
- 결정론적 checker: palette-compliance / color-combination / spot-color / background-tone / clear-space / relative-size / canvas-format. RuleChecker의 `checkerKey`로 registry를 조회하며, 미등록 checker는 `implemented:false`로 표시.
- Payload 컬렉션: `rules`·`guideline-pages`(룰셋), `brand-colors`(팔레트) 읽기. 세션은 `check-sessions`에 영속(룰셋 스냅샷을 함께 저장해 AI 후속 단계가 재사용).

## 5. 크로스커팅

- 인증·업로드 제한: [07. 보안](../07-security.md)
- 결과 문구·접근성: [08. 접근성과 다국어](../08-accessibility-i18n.md)
- 도메인 위치(품질 검수): [04. 도메인 모델](../04-domain-model.md)
- 세션 데이터 생명주기: [03. 데이터 생명주기](../03-data-lifecycle.md)
