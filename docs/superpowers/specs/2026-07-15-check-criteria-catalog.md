# Check Criteria 카탈로그 — 판정표 3단계 초안

날짜: 2026-07-15
상태: 사용자 리뷰 대기
전제: 판정표(`2026-07-15-check-triage.md`) 승인분 + criteria 계약 확장(main 병합 완료: presence/measure/N.A) 기반. 이 카탈로그가 4단계 일괄 반영 스크립트의 입력 데이터가 된다.

## 수량 정정 (판정표 요약표 오류 수정)

정확한 전수는 **기존 59개**였다 (판정표 요약표의 58/44/7 표기는 계산 착오).

| 구분 | 개수 |
|---|---|
| 기존 체크 | 59 |
| 삭제 | 8 — `logo.symbol.concept`, `logo.misuse`, `illustration.subject.taxonomy`, `application.content.mix.ratio`, `application.stationery.spec.scale`, `application.package.spec.scale`, + 사용자 결정(options-문서 모순, 추후 수동 재작성): `layout.advertisement.template`, `application.advertisement.format` |
| Heuristic 유지·전환 | 44 |
| Advisory 전환 | 7 |
| 신규 | 1 — `logo.secondary.usage` |
| **정리 후 총계** | **52** (heuristic 45 + advisory 7) |

CheckScenario 충돌 없음 (유일한 발행 시나리오 `check-model-image`는 유지 대상 `imagery.ai.consistency`만 참조).

## 표기법

- **kind**: `presence`(관찰형: 있음/없음) | `measure`(수치형: 연산·기대값·단위)
- **기준**: presence는 `present`(있어야 함)/`absent`(없어야 함), measure는 `gte/lte/between + 값(단위)`
- ⚠️**제안값**: 가이드 원문에 없는 수치를 AI 관측용으로 새로 정한 것 — 리뷰 시 조정 대상
- **hp**: 해당 Check의 heuristicPrompt (선택 입력, AI 관측 지침)
- N/A 공통 규칙: 질문 대상 요소가 이미지에 없으면 AI가 `not_applicable` 반환(전역 지침) — hp는 대상 판별이 모호한 룰에만 명시

## 체커 7종 정의

model은 전부 `claude-sonnet-5`. prompt는 체커 공통 관측 관점(2층) — Check별 세부 기준은 criteria(3층)가 담당.

| key | name | executor | prompt |
|---|---|---|---|
| `ai.logo` | 로고 검수관 | heuristic | 당신은 Essenherb 로고 사용 규정 검수관이다. 로고의 원형 유지(비례·간격·기울기·획 두께), 가독성, 최소 여백, 배치 위치를 이미지에서 관측한다. 오용 예시 참고 이미지는 오용 '유형'의 설명이며 동일한 구도를 요구하지 않는다. |
| `ai.color` | 컬러 검수관 | heuristic | 당신은 Essenherb 컬러 시스템 검수관이다. 사용된 주요 색상, 페어링 구조(Tone in Tone/Tone on Tone/Mono Tone), 명도 대비를 관측한다. 포토그래피·일러스트 내부의 자연색이 아니라 그래픽 요소·배경·텍스트 컬러를 중심으로 본다. |
| `ai.typography` | 타이포그래피 검수관 | heuristic | 당신은 Essenherb 타이포그래피 검수관이다. 서체의 시각 인상(세미 세리프/산세리프/전용 서체), 웨이트·크기 위계, 자간, 대소문자 조합을 관측한다. 픽셀만으로 폰트를 확정할 수 없으면 uncertain으로 남긴다. |
| `ai.imagery` | 이미지 검수관 | heuristic | 당신은 Essenherb 포토그래피·일러스트 검수관이다. 조명·질감·배경톤·연출의 톤앤매너와 일러스트 스타일(둥근 윤곽 처리, 단순화된 표현 수위)을 관측한다. |
| `ai.layout` | 레이아웃 검수관 | heuristic | 당신은 Essenherb 레이아웃·포맷 검수관이다. 캔버스 비율, 정렬 체계(상단 정렬 용법), 요소 배치 영역, 필수 기재 요소 유무를 관측한다. 비율은 시각적 추정으로 판단하되 확신이 없으면 uncertain으로 남긴다. |
| `advisory.copy` | 브랜드 카피라이터 | manual (Advisory) | 당신은 Essenherb의 브랜드 카피라이터다. 이미지 속 텍스트·카피를 브랜드 보이스 — 자연의 본질과 에너지, 담백하고 세련된 어조, 비건 스킨케어의 전문성 — 관점에서 살펴보고, 문구 선택·톤·정보 위계를 개선할 구체적인 조언을 준다. 카피가 없다면 이 산출물에 어떤 브랜드 언어 자산(시그니처, 내러티브)을 더할 수 있을지 제안한다. |
| `advisory.design` | 아트 디렉터 | manual (Advisory) | 당신은 Essenherb의 아트 디렉터다. 컬러 운용 전략(접점 목적에 맞는 페어링 선택 — 인지 강조는 메인 컬러+모노톤, 정보 전달은 톤온톤, 생동감은 톤인톤)과 여백·간격 체계 관점에서 산출물의 완성도를 높일 구체적인 조언을 준다. |

- 기존 체커 10종(`checker.*` 8종, `model.anthropic.sonnet`, `manual.review`)은 모든 Check 재연결 후 삭제.
- 참고(계약 한계): Check 단위 `heuristicPrompt`는 현 계약상 heuristic 전용 — advisory 룰의 개별 관점은 체커 prompt + 문서 evidence로 전달된다. 룰별 조언 지침이 더 필요해지면 조건 확장(소규모)을 별도 진행.

---

## ai.logo — 11개

### 1. `logo.size.minimum` (primary-logo, required)
원 규정: 최소 높이 20px(screen)/4mm(print) — 절대값은 관측 불가, 상대 프록시로 전환.

| kind | 질문 | 기준 |
|---|---|---|
| measure | 로고 높이가 캔버스 세로 높이에서 차지하는 비율(%)은? | gte 2 (%) ⚠️제안값 |
| presence | 로고가 뭉개지거나 판독이 어려울 정도로 작게 표시되어 있는가? | absent |

### 2. `logo.space.clear` (primary-logo, required)
원 규정: 로고 세로획(stem) 너비 3배 정사각 모듈의 최소 여백.

| kind | 질문 | 기준 |
|---|---|---|
| presence | 로고 주변에 로고 세로획(stem) 너비의 약 3배 이상 여백이 확보되어 있는가? | present |
| presence | 다른 그래픽·텍스트 요소가 로고의 최소 여백 영역을 침범하는가? | absent |

### 3. `logo.trademark` (primary-logo, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | ® 기호가 뭉개지거나 판독 불가능할 정도로 작게 표시되어 있는가? | absent |

hp: `® 기호가 없는 산출물에서는 모든 기준을 not_applicable로 관측한다.`

### 4. `logo.geometry` (incorrect-usage, required)
do/dont 12항 → 3개 질문으로 압축.

| kind | 질문 | 기준 |
|---|---|---|
| presence | 로고의 글자 간격·비례·기울기가 원형에서 임의 변형되어 있는가? | absent |
| presence | 로고 일부 요소의 형태나 획 두께가 변형되어 있는가? | absent |
| presence | 로고가 윤곽선(아웃라인)만으로 표현되어 있는가? | absent |

### 5. `logo.color.misuse` (incorrect-usage, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 로고에 그라디언트 효과가 적용되어 있는가? | absent |
| presence | 로고가 규정 외 컬러로 변형되어 있는가? | absent |
| presence | 로고 내 일부 요소만 다른 컬러로 변형되어 있는가? | absent |

### 6. `logo.background.legibility` (incorrect-usage, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 로고와 배경 간 명도 대비가 충분해 로고가 명확히 식별되는가? | present |
| presence | 복잡한 배경 이미지·패턴이 로고의 가독성을 해치고 있는가? | absent |

### 7. `logo.lockup.modifier` (service-logo, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 서비스 로고(Essenherb Coffee)의 조합·비례가 원형 그대로 사용되었는가? | present |
| presence | 서비스 로고가 판독이 어려울 정도로 작게 표시되어 있는가? | absent |

hp: `Essenherb Coffee 서비스 로고가 없는 산출물은 모든 기준을 not_applicable로 관측한다.`

### 8. `logo.secondary.usage` (secondary-logo, required) — 신규
근거: 세로형 로고 문서(최소 35px/8mm, stem 3배 여백, 30mm 미만 ® 금지)에 체크 부재.

| kind | 질문 | 기준 |
|---|---|---|
| presence | 세로형 로고의 비례·간격이 원형 그대로 사용되었는가? | present |
| presence | 세로형 로고 주변에 세로획 너비의 약 3배 이상 여백이 확보되어 있는가? | present |
| presence | 세로형 로고가 판독이 어려울 정도로 작게 표시되어 있는가? | absent |

hp: `세로형(Vertical Type) 로고가 없는 산출물은 모든 기준을 not_applicable로 관측한다.`

### 9. `logo.sns.placement` (communication-contents, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 로고가 콘텐츠 레이아웃 시스템이 정한 로고 영역에 배치되어 있는가? | present |
| presence | 로고가 다른 요소와 겹쳐 가독성이 저하되어 있는가? | absent |

### 10. `logo.package.placement` (primary-logo-type, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 패키지 전면에 브랜드 로고가 레이아웃 규정(Standard Ratio·Margin·Gutter 체계)에 맞게 배치되어 있는가? | present |

### 11. `logo.package.variant` (secondary-logo-type, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 패키지에 사용된 로고가 Primary 또는 Secondary Logo Type 중 하나인가? | present |
| presence | 사용된 로고 타입이 임의 변형 없이 원형대로 사용되었는가? | present |

---

## ai.color — 5개

### 12. `color.palette` (color-palette, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 화면의 주요 그래픽·배경·텍스트 색상이 브랜드 팔레트(Essenherb Red #EA5343, White, Black 및 가이드 수록 컬러) 내에 있는가? | present |
| measure | 브랜드 팔레트에 속하지 않는 색상이 그래픽 요소에서 차지하는 비율(%)은? | lte 10 (%) ⚠️제안값 |

hp: `포토그래피·일러스트 내부의 자연색은 팔레트 위반으로 세지 않는다. 그래픽 요소·배경·텍스트 컬러만 관측한다.`

### 13. `color.combination` (color-pairing, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 색 조합이 3대 페어링(Tone in Tone / Tone on Tone / Mono Tone) 중 하나를 따르는가? | present |
| measure | 본문 텍스트와 배경 간 대비비(contrast ratio)는? | gte 4.5 ⚠️구 deterministic 기준 승계 — AI 추정치임에 유의 |

### 14. `color.combination.examples` (tone-in-tone, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 서로 다른 색상 계열의 컬러가 조합되어 있는가? | present |
| presence | 고채도 컬러 간 충돌로 시각적 피로·가시성 저하가 발생하는가? | absent |

hp: `서로 다른 색상 계열 조합(Tone in Tone)이 아닌 산출물은 모든 기준을 not_applicable로 관측한다.`

### 15. `color.combo.tonal.balance` (tone-on-tone, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 동일 색상 계열 조합에서 배경-전경 간 명도 차이가 충분히 확보되어 있는가? | present |

hp: `동일 색상 계열 조합(Tone on Tone)이 아닌 산출물은 not_applicable로 관측한다.`

### 16. `color.roles` (mono-tone, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | Black 또는 White를 기준색으로 유채색을 조합하는 구조인가? | present |

hp: `Mono Tone 페어링(Black/White 기준색)이 아닌 산출물은 not_applicable로 관측한다.`

---

## ai.typography — 7개

### 17. `typography-english` (primary-typeface, required) — 기존 1행 확장

| kind | 질문 | 기준 |
|---|---|---|
| presence | 영문 텍스트가 획 끝 삐침이 절제된 세미 세리프(AgfaRotis Semi Serif) 인상인가? | present |
| presence | 영문 타이포그래피가 Regular/Bold 웨이트 범위 안에서 위계를 형성하는가? | present |

### 18. `typography.case` (essen-flux, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | Essen Flux(로고 기반 전용 서체) 텍스트가 전체 대문자로만 조판되어 있는가? | absent |

hp: `Essen Flux 서체(상단 기준선 고정 구조의 전용 영문 서체)가 쓰이지 않은 산출물은 not_applicable로 관측한다.`

### 19. `typography.usage` (essen-flux, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | Essen Flux 서체가 영문 이외의 문자(국문 등)에 적용되어 있는가? | absent |

hp: 18번과 동일.

### 20. `typography.pairing` (micro-typography, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 국문·영문 병용 텍스트가 지정 웨이트 조합(Kor-Medium & Eng-Bold)으로 균일한 회색도를 유지하는가? | present |

hp: `국문과 영문이 병용된 텍스트가 없으면 not_applicable로 관측한다.`

### 21. `typography.misuse` (typography-incorrect-usage, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 글자의 형태가 임의 변형(비틀기·기울이기·늘리기)되어 있는가? | absent |
| presence | 지정 서체(AgfaRotis Semi Serif / Pretendard / Essen Flux) 이외의 서체가 사용되어 있는가? | absent |

### 22. `typography.spacing` (typography-incorrect-usage, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 글자 사이 간격이 지나치게 좁혀져 있는가? | absent |
| presence | 글자 사이 간격이 지나치게 넓혀져 있는가? | absent |

### 23. `typography.weight` (typography-incorrect-usage, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 한 문장 안에 서로 다른 굵기가 혼용되어 있는가? | absent |
| presence | 한 문장 안에 서로 다른 글자 크기가 혼용되어 있는가? | absent |

---

## ai.imagery — 8개

### 24. `imagery-misuse` (brand-model, required) — 기존 유지
criteria 4행·heuristicPrompt 완비 — 내용 변경 없음, 체커만 `ai.imagery`로 재연결.

### 25. `photography-ingredient-textures` (ingredients-texture, required) — 기존 유지 + hp 추가
criteria 3행(선명한 대비 조명 / 수직·수평 앵글 / 밝은 무채색 배경) 유지.

hp 추가: `재료·질감·제형 사진이 아닌 산출물은 모든 기준을 not_applicable로 관측한다.`

### 26. `imagery.ai.consistency` (ai-image, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 피부 표현이 자연스럽고 현실적인가? | present |
| presence | 이미지의 톤·대비·연출이 일관적인가? | present |

hp: `인물·피부가 등장하지 않는 AI 생성물은 첫 기준을 not_applicable로 관측한다.`

### 27. `imagery.sns.classification` (brand-contents, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 브랜드 자산 이미지(모델·브랜드 어플리케이션·자연 재료 이미지 등)가 콘텐츠에 활용되었는가? | present |

### 28. `imagery.advertisement.classification` (offline-ad-vertical, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 광고 내 사진(제품·모델)이 브랜드 톤앤매너(밝고 선명한 연출)에 부합하는가? | present |

### 29. `imagery.style` (visual-system-overview, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 비주얼이 상단 정렬 용법 기반의 Type A(메시지 중심) 또는 Type B(콘텐츠 중심) 체계 중 하나로 일관되게 전개되는가? | present |

### 30. `illustration.style` (illustration-usage-example, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 일러스트가 둥근 윤곽 처리와 단순화된 표현 수위를 따르는가? | present |
| presence | 일러스트에 과도한 디테일·사실적 묘사가 있는가? | absent |

hp: `일러스트레이션이 없는 산출물은 모든 기준을 not_applicable로 관측한다.`

### 31. `illustration.color.usage` (illustration-color-usage, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 일러스트에 브랜드 컬러 팔레트가 적용되어 있는가? | present |

hp: 30번과 동일.

---

## ai.layout — 14개 (+삭제 2)

### 32. `application.sns.format` (sns-contents, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 캔버스 비율이 Feed(1080×1440, 3:4) 또는 Reels(1080×1920, 9:16) 규격에 부합하는가? | present |

### 33. `layout.sns.template` (product-contents, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 캔버스가 Feed(3:4) 또는 Reels(9:16) 규격 비율인가? | present |
| presence | 제품 이미지가 콘텐츠의 중심 요소로 배치되어 있는가? | present |

### 34. `layout.sns.zones` (communication-contents, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 인물 이미지가 전면에 배치되어 있는가? | present |
| presence | 텍스트가 상단에 고정 배치되어 있는가? | present |

### 35. `application.sns.caption.legibility` (communication-contents, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 배경 위 텍스트가 충분한 대비로 명확히 판독되는가? | present |

### 36. `layout.advertisement.template` (online-ad, required) — **삭제 (사용자 결정)**
기존 options(오프라인 판형 3종)와 소속 문서(온라인 3:1)가 모순 — 삭제 후 추후 수동 재작성.

### 37. `layout.advertisement.zones` (offline-ad-horizontal, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 캔버스가 가로형 광고 판형(2400×1600 또는 8600×2100) 비율에 부합하는가? | present |
| presence | 로고가 규정 로고 영역(Logo Area)에 배치되어 있는가? | present |

### 38. `application.advertisement.format` (offline-ad-vertical, required) — **삭제 (사용자 결정)**
기존 options(8종 전부 허용)와 소속 문서(세로형 1440×2100)가 모순 — 삭제 후 추후 수동 재작성.

### 39. `layout.visual.template` (type-a-message, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 캔버스가 규정 판형(1:1 / 3:4 / A4 / 3:1 / 16:9) 중 하나의 비율인가? | present |
| presence | 로고·타이포그래피가 비주얼의 중심 요소로 상단 정렬 전개되는가? | present |

### 40. `application.web` (type-a-message, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 캔버스가 웹 규격(16:9 또는 3:1) 비율인가? | present |

### 41. `grid.visual.system` (type-b-contents, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 그래픽·포토그래피 등 비주얼 콘텐츠가 중심 요소로 전개되는가? | present |
| presence | 상단 정렬 기반의 정돈된 정보 위계가 유지되는가? | present |

### 42. `application.stationery.format` (business-card, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 캔버스가 스테이셔너리 규격(명함 90×50 / 리플렛 A4 210×297 / 정보 카드 A5 148×210) 중 하나의 비율(방향 무관)에 부합하는가? | present |

### 43. `application.print.spec` (business-card, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 명함의 색 구성이 레드 계열 별색 1도(Pantone Warm Red C)로 표현 가능한 단색 구성인가? | present |

### 44. `messaging.stationery.content.fields` (brand-leaflet, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 제품의 정보·특징·효능 등 필수 전달 요소가 포함되어 있는가? | present |

### 45. `application.package.format` (package-overview, required)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 패키지에 Primary 또는 Secondary Logo Type이 적용되어 있는가? | present |
| presence | 브랜드 컬러·지정 서체가 절제된 톤앤매너로 적용되어 있는가? | present |

### 46. `messaging.package.content.fields` (product-usage-example, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| presence | 제품명·제품 설명 등 패키지 필수 기재 요소가 포함되어 있는가? | present |

### 47. `messaging.signature.combination` (the-signature, recommended)

| kind | 질문 | 기준 |
|---|---|---|
| measure | 화면에 사용된 브랜드 시그니처 문구의 개수는? | lte 1 (개) |

hp: `문서에 수록된 브랜드 시그니처 3종 문구만 센다. 하나도 없으면 0으로 관측한다.`

---

## Advisory — 7개

criteria 없음. 체커 prompt(조언 관점) + Check의 문서 evidence로 조언 생성. tier는 전부 recommended 유지 (advisory는 집계 제외라 tier 영향 없음).

| # | key | 문서 | 체커 | 조언이 다루는 것 (evidence가 전달) |
|---|---|---|---|---|
| 48 | `messaging.sns.copy` | brand-contents | advisory.copy | 브랜드 스토리 기반 SNS 카피의 톤·세련도 |
| 49 | `messaging.advertisement.copy` | online-ad | advisory.copy | 온라인 광고 카피·CTA 문구 |
| 50 | `messaging.advertisement.boilerplate` | offline-ad-horizontal | advisory.copy | 반복 서술 정돈, 보일러플레이트 최소화 |
| 51 | `messaging.advertisement.tagline` | offline-ad-vertical | advisory.copy | 시그니처 문구 활용 제안 (중복 금지 판정은 #47이 담당) |
| 52 | `messaging.narrative.statement` | english-version | advisory.copy | 브랜드 내러티브(피부의 본질×자연 에너지)와의 정합 |
| 53 | `color.usage` | color-usage | advisory.design | 접점 목적별 컬러 전략(Level 1~3 페어링 선택) |
| 54 | `spacing.advertisement.scale` | offline-ad-horizontal | advisory.design | A-unit 기반 간격 체계·여백 완성도 |

---

## 리뷰 포인트 (사용자 확인 요청)

1. ~~⚠️제안값 2곳~~ → 확정: 수치 유지 (로고 점유 `gte 2%`, 팔레트 외 `lte 10%`)
2. ~~contrast ratio `gte 4.5`~~ → 확정: 유지
3. ~~options-문서 모순 2곳~~ → 확정: `layout.advertisement.template`·`application.advertisement.format` 삭제, 추후 사용자가 수동 재작성
4. 페어링 계열 룰(#14~16)의 N/A 처리 — "해당 페어링이 아니면 N/A" (색조합 성립 여부 자체는 #13이 문지기)
5. ~~체커 프롬프트 7종 문구~~ → 확정
6. ~~삭제 목록~~ → 확정: 8건

## 다음 단계 (4단계)

승인 후 Payload Local API 스크립트로 일괄 반영: 체커 7종 생성 → 전 Check의 checker 재연결·criteria/hp 기록 → 신규 1건 생성 → 삭제 6건 → 구 체커 10종 삭제 → published 재발행. 스크립트는 이 카탈로그를 데이터 소스로 사용.
