# Check 정리 판정표 — 전 룰 AI(Heuristic/Advisory) 전환

날짜: 2026-07-15
상태: 사용자 리뷰 대기
전제: published 가이드라인 문서의 체크 58개 전수. deterministic 포함 전부 Heuristic 또는 Advisory로 전환(사용자 결정). Heuristic 위주, 판정 불가·중복·검수 대상 아님은 삭제.

## 분류 기준

- **Heuristic**: 이미지에서 present/absent로 관찰 가능한 명시 규칙(금지 사항, 필수 요소, 비율·구도). criteria 질문 테이블 + 필요 시 heuristicPrompt.
- **Advisory**: 판정 대신 디자이너 관점의 한 문단 조언이 유용한 정성 항목(카피 톤, 컬러 전략, 여백 체계). 체커 prompt가 조언 관점을 정의.
- **삭제**: 단일 이미지 검수로 판정 불가(피드 운영 비율), 다른 체크와 중복, 가이드 문서 표기 규칙이라 산출물 검수 항목이 아님.

## 요약

| 구분 | 개수 |
|---|---|
| Heuristic 유지/전환 | 44 |
| Advisory 전환 | 7 |
| 삭제 | 7 |
| 신규 (Heuristic) | 1 |
| 정리 후 총계 | 52 |

## 판정표

표기: 현재 → 제안. `det`=deterministic, `heu`=Heuristic, `adv`=Advisory(manual).

### 로고 (Brand Logo)

| # | 문서 | key | tier | 현재 | 제안 | 근거 |
|---|---|---|---|---|---|---|
| 1 | primary-logo | logo.size.minimum | required | det | **heu** | 절대 크기(20px/4mm)는 AI가 측정 불가 → "로고가 판독이 어려울 정도로 작지 않은가" 가독성 프록시로 전환 |
| 2 | primary-logo | logo.space.clear | required | det | **heu** | stem 3배 수치 대신 "로고 주변 최소 여백을 다른 요소가 침범하지 않는가" 관찰형으로 전환 |
| 3 | primary-logo | logo.trademark | required | manual | **heu** | ® 사용 시 뭉침·과소 크기 여부는 관찰 가능 (미사용 시 uncertain) |
| 4 | primary-logo | logo.symbol.concept | recommended | heu | **삭제** | 로고 디자인 컨셉 해설은 산출물 검수 항목이 아님. 형태 훼손은 logo.geometry가 담당 |
| 5 | incorrect-usage | logo.geometry | required | manual | **heu** | do/dont에 금지 12항 명시(간격·비례·기울기·두께·형태 변형, 윤곽선 사용 등) → absent 질문으로 정리 |
| 6 | incorrect-usage | logo.color.misuse | recommended | heu | **heu** (유지) | 그라디언트·규정 외 컬러·부분 색 변형 금지 — criteria만 채우면 됨 |
| 7 | incorrect-usage | logo.background.legibility | recommended | heu | **heu** (유지) | 가시성 해치는 배경 컬러/이미지 금지 |
| 8 | incorrect-usage | logo.misuse | recommended | heu | **삭제** | #5·6·7 세 개로 이미 분해된 포괄 체크 — 중복 |
| 9 | service-logo | logo.lockup.modifier | required | manual | **heu** | 서비스 로고(Essenherb Coffee) 규정: 과소 크기·여백 침범·® 뭉침 absent |
| 10 | (신규) secondary-logo | logo.secondary.usage | required | — | **heu 신규** | 세로형 로고 문서(최소 35px/8mm, stem 3배 여백, ® 85px/30mm 미만 금지)에 체크가 하나도 없음 — primary와 동일 체계로 신설 |

### 컬러 (Color System)

| # | 문서 | key | tier | 현재 | 제안 | 근거 |
|---|---|---|---|---|---|---|
| 11 | color-palette | color.palette | required | det | **heu** | 주요 색상이 브랜드 팔레트(Essenherb Red EA5343 + White/Black 등) 내인지 관찰 |
| 12 | color-pairing | color.combination | required | det | **heu** | 색 조합이 3대 페어링(톤인톤/톤온톤/모노톤) 중 하나를 따르는가 |
| 13 | tone-in-tone | color.combination.examples | required | manual | **heu** | 서로 다른 색상 계열 조합 present, 고채도 충돌로 인한 시각적 피로 absent |
| 14 | tone-on-tone | color.combo.tonal.balance | recommended | heu | **heu** (유지) | 동일 색상 계열 내 명도 차이 확보 present |
| 15 | mono-tone | color.roles | required | manual | **heu** | Black/White 기준색 + 유채색 조합 구조 present |
| 16 | color-usage | color.usage | recommended | heu | **adv** | Level 1~3 접점 전략은 이미지만으로 판정 불가(접점 맥락 필요) → 컬러 운용 조언 |

### 타이포그래피 (Typography)

| # | 문서 | key | tier | 현재 | 제안 | 근거 |
|---|---|---|---|---|---|---|
| 17 | primary-typeface | typography-english | required | heu | **heu** (유지) | AgfaRotis Semi Serif Regular/Bold — 기존 criteria 1행을 보강 |
| 18 | essen-flux | typography.case | required | manual | **heu** | 전체 대문자 조판 금지 — do/dont 명시, absent 판정 가능 |
| 19 | essen-flux | typography.usage | recommended | manual | **heu** | Essen Flux는 영문 전용 서체 — 국문 적용 absent |
| 20 | micro-typography | typography.pairing | recommended | heu | **heu** (유지) | 국영문 병용 시 지정 웨이트(Kor-Medium & Eng-Bold)·균일한 회색도 |
| 21 | typography-incorrect-usage | typography.misuse | recommended | heu | **heu** (유지) | 글자 형태 변형·지정 외 서체 금지 |
| 22 | typography-incorrect-usage | typography.spacing | required | manual | **heu** | 자간 과도 좁힘/넓힘 금지 — do/dont 명시 |
| 23 | typography-incorrect-usage | typography.weight | recommended | heu | **heu** (유지) | 한 문장 내 상이한 굵기·크기 혼용 금지 |

### 포토그래피·일러스트 (Imagery)

| # | 문서 | key | tier | 현재 | 제안 | 근거 |
|---|---|---|---|---|---|---|
| 24 | brand-model | imagery-misuse | required | heu | **heu** (유지) | 유일하게 criteria 4행+prompt 완비 — 현행 유지 |
| 25 | ingredients-texture | photography-ingredient-textures | required | heu | **heu** (유지) | criteria 3행 있음 — prompt만 보강 |
| 26 | ai-image | imagery.ai.consistency | recommended | manual | **heu** | do/dont 명시: 비현실적 피부 표현 absent, 이미지 간 일관된 톤·대비 present |
| 27 | brand-contents | imagery.sns.classification | recommended | heu | **heu** (유지) | 브랜드 자산(모델·어플리케이션·자연 재료 이미지) 활용 present |
| 28 | offline-ad-vertical | imagery.advertisement.classification | recommended | heu | **heu** (유지) | 광고 내 사진의 규정 톤앤매너 준수 |
| 29 | visual-system-overview | imagery.style | recommended | heu | **heu** (유지) | 상단 정렬 용법 기반 Type A/B 체계 준수 |
| 30 | illustration-overview | illustration.subject.taxonomy | recommended | heu | **삭제** | 주제 분류는 스타일 일관성(#31)과 실질 중복이고 판정 근거가 약함 |
| 31 | illustration-usage-example | illustration.style | recommended | manual | **heu** | 둥근 윤곽 처리·단순화된 표현 수위 등 시각 인상 — 관찰 가능 |
| 32 | illustration-color-usage | illustration.color.usage | recommended | heu | **heu** (유지) | 일러스트가 브랜드 팔레트·페어링 전략 기반인가 |

### 레이아웃·포맷 (Applications)

| # | 문서 | key | tier | 현재 | 제안 | 근거 |
|---|---|---|---|---|---|---|
| 33 | sns-contents | application.sns.format | required | det | **heu** | 피드 3:4(1080×1440)·릴스 규격 → 비율 관찰로 전환 |
| 34 | product-contents | layout.sns.template | required | det | **heu** | 제품 중심 구도·규정 레이아웃 준수 |
| 35 | communication-contents | layout.sns.zones | required | heu | **heu** (유지) | 인물 전면 배치·텍스트 상단 고정 |
| 36 | communication-contents | logo.sns.placement | recommended | heu | **heu** (유지) | 콘텐츠 내 로고 규정 위치 |
| 37 | communication-contents | application.sns.caption.legibility | recommended | heu | **heu** (유지) | 배경 위 텍스트 가독성 |
| 38 | communication-contents | application.content.mix.ratio | recommended | manual | **삭제** | 피드 전체의 콘텐츠 유형 비율은 단일 이미지 검수로 판정 불가 |
| 39 | online-ad | layout.advertisement.template | required | det | **heu** | 3:1 가로 비율 + CTA 요소 배치 |
| 40 | offline-ad-horizontal | layout.advertisement.zones | required | heu | **heu** (유지) | 로고 영역 등 콘텐츠 존 준수 |
| 41 | offline-ad-horizontal | spacing.advertisement.scale | required | manual | **adv** | A-unit 간격 체계는 단위 기준을 이미지에서 측정 불가 → 여백 체계 조언 |
| 42 | offline-ad-vertical | application.advertisement.format | required | det | **heu** | 세로형 광고 비율(1440×2100) 관찰 |
| 43 | type-a-message | layout.visual.template | required | det | **heu** | Type A: 로고·타이포 중심, 상단 정렬, 모듈러 그리드 |
| 44 | type-a-message | application.web | required | det | **heu** | 웹·가로 광고 규격 비율 |
| 45 | type-b-contents | grid.visual.system | required | manual | **heu** | Type B: 비주얼 콘텐츠 중심 + 상단 정렬 위계 |
| 46 | business-card | application.stationery.format | required | det | **heu** | 명함 90×50 가로 비율 관찰 |
| 47 | business-card | application.print.spec | required | det | **heu** | 별색 1도(Pantone Warm Red C) 인쇄 가능한 단색 구성인가 |
| 48 | brand-leaflet | messaging.stationery.content.fields | recommended | heu | **heu** (유지) | 제품 정보·특징·효능 필수 항목 present |
| 49 | product-information-card | application.stationery.spec.scale | required | manual | **삭제** | "Scale 80%" 축척은 가이드 문서 표기 규칙 — 산출물 검수 항목 아님 |
| 50 | package-overview | application.package.format | required | manual | **heu** | Primary/Secondary Logo Type 적용·절제된 톤앤매너 |
| 51 | primary-logo-type | logo.package.placement | recommended | heu | **heu** (유지) | 패키지 전면 로고 배치 규정 |
| 52 | secondary-logo-type | logo.package.variant | recommended | heu | **heu** (유지) | 승인된 로고 타입 사용 |
| 53 | package-box-usage-example | application.package.spec.scale | required | manual | **삭제** | #49와 동일 — 문서 축척 표기 규칙 |
| 54 | product-usage-example | messaging.package.content.fields | recommended | heu | **heu** (유지) | 제품명·용량 등 패키지 필수 기재 present |

### 메시징·카피 (Verbal Identity)

| # | 문서 | key | tier | 현재 | 제안 | 근거 |
|---|---|---|---|---|---|---|
| 55 | the-signature | messaging.signature.combination | recommended | heu | **heu** (유지) | "시그니처 2개 이상 중복/조합 사용 금지" 명시 규칙 — absent 판정 |
| 56 | brand-contents | messaging.sns.copy | recommended | manual | **adv** | 카피 톤·브랜드 스토리 정합은 정성 판단 → 카피라이팅 조언 |
| 57 | online-ad | messaging.advertisement.copy | recommended | manual | **adv** | 동일 — 광고 카피 조언 |
| 58 | offline-ad-horizontal | messaging.advertisement.boilerplate | recommended | manual | **adv** | 반복 서술 정돈은 조언 영역 |
| 59 | offline-ad-vertical | messaging.advertisement.tagline | recommended | manual | **adv** | 시그니처 문구 활용 제안은 조언 영역 (중복·조합 금지 판정은 #55가 담당) |
| 60 | english-version | messaging.narrative.statement | recommended | manual | **adv** | 브랜드 내러티브 정합은 정성 판단 → 브랜드 보이스 조언 |

## Heuristic Criteria 계약 확장

현재 criterion은 `{question, expected: present|absent}`뿐이라 수치 기준을 표현할 수 없다. 아래로 확장한다 (criteria 배열 컬럼 추가 — 스키마 마이그레이션 필요).

```
kind: 'presence'(기본값, 기존 데이터 호환) | 'measure'
공통: question / AI 응답: 관측값 | uncertain | not_applicable
presence: expected present|absent
measure:  operator gte|lte|between, expected(+max), unit
```

- **판정 파이프라인은 단일**: `satisfied = compare(criterion, actual)` — presence는 enum 도메인 위의 `eq`, measure는 숫자 연산. comparisons 기록·fulfillment·status 집계는 기존 heuristic evaluator를 그대로 공유하며, deterministic의 `measurement/operator/expected/actual/satisfied` 기록 형식과 동일한 모양을 유지한다.
- **not_applicable (해당 없음)**: uncertain(불확실 → needs_review)과 구분되는 확신 있는 관측. fulfillment 분모에서 제외한다. 모든 criteria가 N/A인 체크는 `pass` + "관측 대상 없음" detail로 처리해 담당자 검토함 오염을 막는다. 대상 룰: `logo.trademark`(® 없음), 타이포 룰 5개(텍스트 없음), essen-flux 룰(영문 없음) 등 ~15개.
- **measure 사용 룰 (~8개)**: `logo.size.minimum`(점유 비율 하한), `logo.space.clear`(여백 비율), `application.sns.format`(종횡비 3:4), `layout.advertisement.template`(3:1), `application.advertisement.format`(1440:2100), `application.stationery.format`(90:50), `application.web`, `logo.trademark`(® 상대 크기). 나머지는 presence.
- **operator에 `eq`는 두지 않는다**: AI 비전 수치 추정은 ±5~10%p 수준이므로 점 판정 대신 `gte/lte/between` 범위 판정만 허용한다.
- **choice(선택형)는 도입하지 않는다**: "승인된 집합 중 하나인가"는 presence 질문으로 표현 가능("이 색 조합이 톤인톤/톤온톤/모노톤 중 하나에 해당하는가?"). 모든 선택지가 허용값인 질문은 분류이지 검수가 아니다. 유형 라벨 기록이 필요해지면 그때 추가한다.
- **scale(정도 점수)은 도입하지 않는다**: AI 점수는 재현성이 낮다. 정성 품질은 Advisory가 담당한다.

## 설계 원칙 — 기존 계약 재사용, 신규 계약 최소화

**원칙: 기존 계약을 쓰되 개선한다. 새 계약은 최소화한다.**

재사용하는 기존 계약 (변경 없음):

- executor 3값(`deterministic|heuristic|manual`) 그대로 — advisory는 이미 manual이 담당, 신규 enum 값 없음.
- Checker의 `model`·`prompt` 필드 그대로 — 체커 양산은 이 두 필드 조합으로만 이룬다.
- 3층 프롬프트 구조(시스템 프롬프트 / 체커 prompt / Check heuristicPrompt) 그대로.
- CheckResult 계약(`status`/`fulfillment`/`detail`, comparisons 기록) 그대로 — deterministic이 이미 쓰는 `measurement/operator/expected/actual/satisfied` 기록 형식을 heuristic measure가 그대로 따른다.
- CheckSession rulesetSnapshot·JSON 결과 저장 방식 그대로 — 결과 저장에 마이그레이션 없음.
- 모델별 배치·`runAiCheck` 호출 계약(advisory-checker 스펙에서 확립) 그대로.

신규로 추가되는 계약 (이것뿐):

1. criterion 컬럼: `kind`(기본 presence) + measure용 `operator/expected/max/unit` — criteria 배열 확장 마이그레이션 1건.
2. AI 관측값에 `not_applicable` 추가 (기존 present/absent/uncertain 확장).

하지 않는 것 (과엔지니어링 방지):

- criterion kind별 evaluator 분리 금지 — `compare()` 연산 분기 하나로 통합, 파이프라인은 단일 유지.
- 새 컬렉션·새 executor·새 CheckStatus·criterion 전용 admin 컴포넌트 신설 금지 (기존 array field UI로 표현).
- choice/scale/개수 전용 kind, criterion 간 조건부 의존(A가 present일 때만 B 평가), 체커별 커스텀 출력 스키마 금지 — 필요가 증명될 때 추가한다.

역할과 책임 분리 (검수 스펙 `docs/features/review.md`의 소유권 경계 유지):

| 단위 | 소유하는 책임 | 소유하지 않는 책임 |
|---|---|---|
| Check (문서 작성자) | criteria 질문·기대값·연산·단위, heuristicPrompt, tier, 문서 근거 | 관측 방법, 판정 로직 |
| Checker (admin) | 실행 방식(executor)·model·관점 prompt — 여러 Check가 재사용 | 개별 기준값, 판정 |
| AI repository | 프롬프트 조립·API 호출·응답 스키마 검증 — 관측값만 반환 | 판정(pass/fail 선언 금지), 기준 소유 |
| Evaluator (service) | 관측값 vs 기대값 비교(`compare`), fulfillment·status 집계, N/A 처리 | 이미지 해석, 기준 소유 |
| Advisory 경로 | 조언 문단 생성(판정 없음) — 집계에서 제외 | pass/fail·fulfillment |

## 체커 라인업 재편

기존 10개(det 8 + heu 1 + manual 1) → **7개 AI 체커**. 도메인별 체커 prompt(공통 관점) + Check별 criteria/heuristicPrompt의 3층 구조로, 이후 admin이 model·prompt 조합만으로 체커를 양산하는 기반.

| key | executor | model | prompt 관점 |
|---|---|---|---|
| ai.logo | heuristic | claude-sonnet-5 | 로고 사용 규정 검수관 — 형태 훼손·가독성·여백 관찰 |
| ai.color | heuristic | claude-sonnet-5 | 컬러 시스템 검수관 — 팔레트·페어링 구조 관찰 |
| ai.typography | heuristic | claude-sonnet-5 | 타이포그래피 검수관 — 서체·조판 규정 관찰 |
| ai.imagery | heuristic | claude-sonnet-5 | 포토·일러스트 검수관 — 톤앤매너·스타일 관찰 |
| ai.layout | heuristic | claude-sonnet-5 | 레이아웃·포맷 검수관 — 비율·구도·영역 관찰 |
| advisory.copy | manual | claude-sonnet-5 | 브랜드 카피라이터 — 메시징·보이스 개선 조언 한 문단 |
| advisory.design | manual | claude-sonnet-5 | 아트 디렉터 — 컬러 운용·여백 체계 개선 조언 한 문단 |

- 기존 `model.anthropic.sonnet`·`manual.review`·deterministic 체커 8개는 모든 Check 재연결 후 삭제(또는 draft 강등).
- Advisory 배정: adv 7개 중 카피 계열 5개 → `advisory.copy`, color.usage·spacing.advertisement.scale → `advisory.design`.

## 진행 순서

1. **이 판정표 승인** ← 지금 단계
2. Criteria 계약 확장 구현 (kind/measure/N.A — 스키마 + AI 응답 스키마 + evaluator 비교 통합)
3. 승인된 룰별로 criteria 질문 테이블·heuristicPrompt·advisory 프롬프트 초안 작성 (도메인 배치로 나눠 리뷰)
4. Payload Local API 스크립트로 일괄 반영: 체커 7개 생성 → Check 필드 갱신(checker 재연결, executor, criteria, prompt) → 삭제 7건 → 신규 1건 → 구 체커 정리
5. `/review` 및 챗 runCheck로 샘플 이미지 검수 스모크 테스트

## 유의 사항

- 사용자의 문서 본문 정리(1번 작업)와 독립적으로 진행 가능 — criteria는 원본 PDF 규정 기준으로 작성하므로 본문이 나중에 고쳐져도 유효.
- tier(required/recommended)는 현행 유지. 변경 제안 없음.
- CheckScenario가 참조하는 checkKeys에 삭제 대상이 있으면 시나리오에서도 제거 필요 (반영 스크립트에 포함).
