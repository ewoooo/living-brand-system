# Essenherb 검수 룰셋 (section › page › rule)

> 출처: Essenherb Brand Identity Guidelines (Ami Cosmetic) — 110p PDF

**tier**: 🟢automated 47 · 🟡assisted 30 · 🔴manual 48 (총 125)

- 🟢 **automated**: 정적·결정론적 계산으로 자동 검수 (코드가 충족률 산출, 신뢰)
- 🟡 **assisted**: AI가 값을 내지만 신뢰 불가 → 사람 확인 게이트
- 🔴 **manual**: 산출물만으론 계산 불가 → 사람 판단/주관/외부 프로세스

---

## A. Brand Strategy (p4–9) · 8룰

### p5  ↰ A
- 🟡 assisted `voice.naming-grammar` — Canonical brand name & meaning (Essenherb = Essence + Herb)
  - 근거: A.1 The Name: 'Essenherb는 피부의 본질Essence에 집중하는 식물성Herb 비건 스킨케어 브랜드'. 브랜드명 Essenherb는 Essence+Herb 합성어로 표기·의미가 고정됨. 자산의 브랜드명 표기(철자/대소문자) 검증 가능.
  - 값: brandName: Essenherb (Essence + Herb)
- 🔴 manual `messaging.statement` — Brand essence / name philosophy statement
  - 근거: A.1 The Name: '피부의 본질에 집중하여 피부에 꼭 필요한 제품을 만듭니다 / 깨끗하고 강인한 자연의 힘으로 건강하고 아름다운 피부를 만듭니다'. 브랜드 철학·가치를 함축한 핵심 메시지(에센스/허브 정의).

### p6  ↰ A
- 🔴 manual `messaging.key-message` — Brand core keyword / concept (Energy)
  - 근거: A.2 The Core: '에너지Energy는 순수하고 강인한 자연의 에너지를 통해 피부를 보호하고 회복하는 에너지를 만드는 Essenherb의 브랜드 핵심 키워드'. 원료/제품/효능/가치를 잇는 핵심 개념 = Energy.
  - 값: coreKeyword: Energy (Pure & Resilient, Botanical Energy, Protect & Recover, Daily Skin Energy)

### p7  ↰ A
- 🔴 manual `messaging.statement` — Canonical English brand narrative
  - 근거: A.3 The Narrative (English Version): 'Essenherb is a vegan skincare brand designed and made in Korea...' 브랜드 존재 이유와 가치를 하나의 흐름으로 연결한 영문 내러티브 전문.
- 🔴 manual `messaging.statement` — Brand origin/identity (designed & made in Korea)
  - 근거: A.3: '한국에서 탄생한 브랜드로서의 정체성과 가치를 강조' / 'designed and made in Korea'. 영문 내러티브가 한국 태생 정체성을 강조해야 한다는 메시지 요건.
  - 값: identity: designed and made in Korea

### p8  ↰ A
- 🔴 manual `messaging.statement` — Canonical Korean brand narrative
  - 근거: A.3 The Narrative (Korean Version): '에센허브는 피부의 본질Essence에 집중하는 식물성Herb 비건 스킨케어 브랜드입니다...피부 본연의 활력을 깨우는 스킨케어를 만듭니다.' 영문과 일관성을 유지하는 국문 내러티브 전문.

### p9  ↰ A
- 🟡 assisted `messaging.tagline` — Brand type signatures (three approved phrases)
  - 근거: A.4 The Signature: 세 가지 타입 시그니처 '1 Essence for Energy / 2 Daily Skin Energy / 3 Essen-tial Skincare'. 브랜드 철학·태도를 압축한 서명 문구로 정확한 워딩/표기 검증 가능.
  - 값: signatures: 'Essence for Energy', 'Daily Skin Energy', 'Essen-tial Skincare'
- 🟡 assisted `messaging.signature-combination` 🆕 — Brand signature single-use rule (no combining 2+)
  - 근거: A.4 The Signature: '브랜드 시그니처는 2개 이상의 중복/조합 사용을 금합니다.' 한 자산에 둘 이상의 시그니처를 함께/중복 사용 금지. 텍스트 검출로 2개 이상 시그니처 동시 사용 여부 판정 가능.
  - 값: max 1 signature per asset; no duplicate/combined use

## B.1. Brand Logo (p11–22) · 12룰

### p12  ↰ B.1
- 🔴 manual `logo.symbol-concept` — Primary logo design concept (formal origin)
  - 근거: Primary Logo Design Concept: 자연의 본질에 집중하는 브랜드 태도와 전문적 제품성을 유려한 곡선과 단단한 직선의 조화로 표현, 좁은 자폭 기반 정밀 조형, 상단 정렬된 듯한 자유로운 배치

### p13  ↰ B.1
- 🟢 automated `logo.min-size` — Logo minimum size (primary/secondary/service per variant)
  - 근거: 프라이머리 로고 최소 사이즈는 높이 기준 20px(screen)/4mm(print); 세로형 35px/8mm(p16); 서비스 로고 Horizontal 20px/4mm, Vertical A 45px/9mm, Vertical B 60px/13mm(p19). 더 작아지면 안 됨
  - 값: primary: 20px/4mm; secondary vertical: 35px/8mm; service horizontal: 20px/4mm; service vertical A: 45px/9mm; service vertical B: 60px/13mm (height, screen/print)
- 🔴 manual `misc.governance` — Logo no-modification / escalation policy
  - 근거: 로고의 비율과 간격을 반드시 지켜야 하며 임의로 변형할 수 없다; 추가 규정이 필요하면 관련 부서에 의뢰하여 정의해야 한다 (모든 로고 페이지 반복)

### p14  ↰ B.1
- 🟢 automated `logo.clear-space` — Logo clear space / exclusion zone (stem width x3 module)
  - 근거: 로고 세로획(stem) 너비 기준 3배 규격의 정사각형 박스를 최소 영역의 모듈로 설정; 동일 규정이 세로형(p17), 서비스 로고(p20)에도 적용
  - 값: module = 3 x stem width (square box); applies to primary, secondary vertical, and service logos
- 🟢 automated `logo.clear-space.construction` — Clear-space / construction module diagram (3A / A grid)
  - 근거: Grids & Clear Space 다이어그램에 3A / A 모듈 표기; stem 너비 3배 정사각형 박스를 최소 영역 모듈로 도식화 (p14, p17, p20)
  - 값: corner module 3A, edge-mid module A; box derived from stem width x3

### p15  ↰ B.1
- 🟢 automated `logo.trademark` — Registered-trademark (R) usage & per-variant size threshold
  - 근거: R Mark는 등록 완료 상표에만 사용; 일정 높이 이하에서는 R Mark 제거 — 프라이머리 45px/15mm 이하(p15), 세로형 85px/30mm 이하(p18), 서비스 Horizontal 45px/15mm·Vertical A 95px/30mm·Vertical B 135px/45mm 이하(p21)
  - 값: R-mark removed below: primary 45px/15mm; secondary vertical 85px/30mm; service horizontal 45px/15mm; service vertical A 95px/30mm; service vertical B 135px/45mm (height)
- 🟢 automated `logo.size-steps` — Discrete logo size-step chart (min size + R-removal step)
  - 근거: 각 변형별로 최소사이즈(예: 20px/4mm)와 R Mark 제거 높이(예: 45px/15mm 이하)를 단계 차트로 규정 (p15, p18, p21)
  - 값: primary: min 20px/4mm, R-remove 45px/15mm; etc. per variant

### p19  ↰ B.1
- 🟡 assisted `logo.variants` — Approved logo variants / lockup set
  - 근거: 승인 로고 세트: Primary Logo, Secondary Logo (Vertical Type), Service Logo (Essenherb Coffee) — Horizontal / Vertical Type A / Vertical Type B
  - 값: primary; secondary vertical; service: horizontal, vertical A, vertical B

### p22  ↰ B.1
- 🟡 assisted `logo.misuse` — Logo incorrect-usage prohibitions
  - 근거: Incorrect Usage (Proportion/Space/Shape/Color/Effect/BG): 기울기·간격·비례·두께·형태 임의 변형 불가, 윤곽선만 사용 불가, 일부 요소 컬러 변형 불가, 규정 외 컬러 변형 불가, 그라디언트 적용 불가, 가시성 해치는 배경 컬러/이미지와 사용 불가
  - 값: prohibits: slant change, spacing change, proportion change, partial shape change, thickness change, shape change, outline-only, partial recolor, off-spec color, gradient effect, low-visibility bg color, low-visibility bg image
- 🟡 assisted `logo.misuse.examples` — Logo misuse visual prohibited-example tiles
  - 근거: 잘못 사용하기 쉬운 예를 카테고리별(Proportion/Space, Shape, Color, Effect/Background)로 시각 타일로 수록
  - 값: 4 example tile groups: Proportion/Space; Shape; Color; Effect/Background
- 🟡 assisted `color.misuse` — Logo color misuse: gradient / off-palette prohibition
  - 근거: 로고에 그라디언트 효과를 적용할 수 없다; 규정 외 컬러로 변형 불가; 일부 요소 컬러 변형 불가 (로고 컬러 변형/그라디언트 금지)
  - 값: no gradient on logo; no off-spec color
- 🟡 assisted `color.contrast.photo-bg` — Logo legibility on background color / image
  - 근거: 가시성을 해치는 배경 컬러와 함께 사용할 수 없다; 가시성을 해치는 배경 이미지와 함께 사용할 수 없다

## B.2. Color System (p23–31) · 11룰

### p24  ↰ B.2
- 🟢 automated `color.palette` — Brand color palette (swatch values)
  - 근거: 메인 컬러 Essenherb Red(HEX EA5343), White(FFFFFF), Black(000000)와 멀티 컬러(Red/Yellow/Green/Blue/Purple 5계열 × 5톤 + Gray)로 구성. 지정 컬러를 우선적으로 사용하며 임의 변형 불가.
  - 값: Essenherb Red EA5343(Pantone Warm Red C); White FFFFFF; Black 000000; Red1 FFF0EB,Red2 FFB4AA,Red4 871400,Red5 460500; Yellow1 FFFAC2,Y2 FFF095,Y3 FFE65F,Y4 A07D0F,Y5 503200; Green1 E6FFE6,G2 A7F5AE,G3 50AE5F,G4 195F30,G5 002B1E; Blue1 E1F0FF,B2 A5CDFF,B3 3C87CD,B4 1E508C,B5 001941; Purple1 FAEBFF,P2 EBC8E9,P3 A546BE,P4 692373,P5 3C0046; Gray1 FAFAFA,Gray2 EBEBEB,Gray3 ACACAC,Gray4 464646,Gray5 151515
- 🟢 automated `color.swatch-grid` — Visual swatch grid (hex per tonal step)
  - 근거: 멀티 컬러는 5개 Core Color Tone과 그레이 컬러 기반, Light Tone~Dark Tone 명도 스펙트럼으로 확장된 톤별 스와치 격자 형태로 제시됨.
  - 값: families: Red/Yellow/Green/Blue/Purple (5 steps each: Tone1~Tone5) + Gray (Gray1~Gray5); 각 셀 HEX/RGB/Pantone 표기
- 🟢 automated `color.scale` — Color tonal/brightness scale
  - 근거: 멀티 컬러는 Light Tone~Dark Tone의 명도 스펙트럼으로 확장된 5개 Core Color Tone(+Gray)으로 구성되어 명도 단계가 정의됨.
  - 값: stepsPerFamily: 5 (Tone1=Light ~ Tone5=Dark); chromatic families: 5; gray: 5 steps; axis: Light Tone→Dark Tone
- 🟢 automated `color.roles` — Color role assignment
  - 근거: Essenherb Red는 핵심(메인) 컬러, White/Black은 메인 컬러 사용을 보조하는 보조 컬러로 역할이 구분됨. 멀티 컬러는 변주/확장 역할.
  - 값: main: Essenherb Red(EA5343); supporting: White(FFFFFF)/Black(000000); multi: 5 families + Gray
- 🔴 manual `color.print-fidelity` — Print color fidelity / Pantone matching
  - 근거: 오프라인 구현 시 Pantone 색상 견본과 대조해 시각적 동일 여부를 판단, 인쇄 방법/잉크 농도/종이 재질에 따라 발색이 달라지므로 감리 과정을 통해 컬러 구현율을 검토해야 함.
  - 값: referenceSystem: Pantone; pantoneRefs: Warm Red C, 705C, 169C, 7620C, 188C, 600C, 602C, 7404C, 118C, 7575C, 2253C, 2255C, 2257C, 555C, 567C, 657C, 2717C, 279C, 2161C, 2768C, 531C, 529C, 258C, 260C, 7449C; requireProofReview: true (감리)
- 🟡 assisted `color.misuse` — Color incorrect-usage prohibitions
  - 근거: 본 가이드에 규정된 지정 컬러를 우선 사용하며, 규정을 엄격히 준수하고 임의의 형태로 변형할 수 없음. 추가 규정 필요 시 관련 부서에 의뢰.
  - 값: off-palette 금지, 임의 변형 금지(arbitrary modification prohibited)
- 🔴 manual `misc.governance` — Asset governance / no-modification / escalation policy
  - 근거: 다음의 규정을 엄격히 준수하며 임의의 형태로 변형할 수 없고, 추가 규정이 필요한 경우 관련된 부서에 의뢰하여 정의해야 함(컬러/페어링 모두 동일 정책).
  - 값: strictAdherence: true; modificationAllowed: false; escalationPath: 관련 부서 의뢰

### p26  ↰ B.2
- 🟢 automated `color.pairing` — Approved color pairing / background combinations
  - 근거: Tone in Tone 명도 조합 규정: 배경색(BG) 톤별 허용 전경색(FG) 톤이 명시됨. 세 가지 페어링 방식(Tone in Tone/Tone on Tone/Mono Tone) 중 선택.
  - 값: BG Tone1+FG Tone3/4/5; BG Tone2+FG Tone4/5; BG Tone3+FG Tone1/3/5; BG Tone4+FG Tone1/2/3; BG Tone5+FG Tone1/2/3; methods: Tone in Tone(cross-family), Tone on Tone(same-family), Mono Tone(Black/White+chromatic)

### p27  ↰ B.2
- 🟢 automated `color.pairing.example-matrix` — Color pairing example matrix (dot-marked)
  - 근거: Pairing Recommendation(Light) 40종, (Dark) 40종의 선별된 Tone in Tone 컬러 조합을 매트릭스로 수록, 우선 사용 권장.
  - 값: Tone in Tone (Light): 40 combos; Tone in Tone (Dark): 40 combos

### p29  ↰ B.2
- 🟢 automated `color.contrast` — Color/legibility contrast minimum
  - 근거: Tone on Tone에서 컬러 간 명도 차이를 확보(Low Contrast~High Contrast, Contrast Level 1~4) 확인. Tone in Tone에서도 최소한의 가시성을 위한 명도 대비 체크 필요.
  - 값: Contrast Level 1~4 (Low Contrast↔High Contrast); 고대비=높은 가독성, 저대비=시각적 안정감

### p31  ↰ B.2
- 🔴 manual `color.usage` — Color usage contexts & emotional mapping
  - 근거: 컬러를 제작물 특성/타깃/맥락/정보량에 따라 3단계 적용 수위(Level)로 운영. Level1=메인+모노톤(즉각 인지), Level2=전체+톤온톤(안정적 정보 전달), Level3=전체+톤인톤(생동감 있는 에너지).
  - 값: Level1: Main Color+Mono Tone (e.g. 명함/공식 서식/대표 콘텐츠); Level2: Main/Multi+Tone on Tone (e.g. 제품 설명서/온라인 배너); Level3: Main/Multi+Tone in Tone (e.g. 프로모션 KV/이벤트 패키지/시즌 굿즈)

## B.3. Typography (p32–41) · 9룰

### p33  ↰ B.3
- 🟡 assisted `typography.families` — Designated typeface families by role/script
  - 근거: 영문 지정 서체는 AgfaRotis Semi Serif, 국문 지정 서체는 Pretendard. '일관된 브랜드 아이덴티티 형성을 위해 다음의 규정을 엄격히 준수하며, 임의의 형태로 변형할 수 없습니다.'
  - 값: English: AgfaRotis Semi Serif; Korean: Pretendard; Signature/display (EN only): Essen Flux
- 🟢 automated `messaging.legal-footer` — Legal / copyright / distribution footer
  - 근거: 모든 페이지 하단에 '© Ami Cosmetic Co., Ltd. All rights reserved.' 저작권 표기.
  - 값: © Ami Cosmetic Co., Ltd. All rights reserved.
- 🔴 manual `misc.governance` — Asset governance / no-modification / escalation policy
  - 근거: '다음의 규정을 엄격히 준수하며, 임의의 형태로 변형할 수 없습니다. 추가 규정이 필요한 경우에는 관련된 부서에 의뢰하여 정의해야 합니다.' (전 페이지 반복)
  - 값: Strict adherence, no arbitrary modification, additional rules defined via responsible department

### p34  ↰ B.3
- 🟡 assisted `typography.weights` — Permitted type weights & role hierarchy
  - 근거: AgfaRotis Semi Serif의 Weight Family는 Regular, Bold 활용 권장(p34). Pretendard의 Weight Family는 영문과 병용을 위해 Regular, Medium 활용 권장(p35).
  - 값: AgfaRotis Semi Serif: Regular, Bold; Pretendard: Regular, Medium
- 🟢 automated `typography.spacing` — Letter spacing / tracking & kerning spec
  - 근거: AgfaRotis Semi Serif: Kerning Metric, -10 to 0 / Word Spacing 55% 70% 95% (p34). Pretendard: Kerning Metric, 0 (p35).
  - 값: AgfaRotis: Kerning Metric -10 to 0, Word Spacing 55%/70%/95%; Pretendard: Kerning Metric 0

### p36  ↰ B.3
- 🟡 assisted `typography.pairing` — Multilingual type pairing (KR+EN)
  - 근거: 국·영문 병용 마이크로 타이포그래피 규정: 'Kor-Medium & Eng-Bold' 및 'Kor-Regular & Eng-Regular' 조합. 균일한 회색도를 위해 정해진 세팅 값 준수.
  - 값: Combo1: Kor=Pretendard Medium / Eng=AgfaRotis Bold; Combo2: Kor=Pretendard Regular / Eng=AgfaRotis Regular. EN Scale 105% (Kerning -5 Bold / -5 Regular), KR Scale 100% (Kerning 0)

### p37  ↰ B.3
- 🟡 assisted `typography.misuse` — Typography incorrect-usage prohibitions
  - 근거: 글자 사이 간격을 지나치게 좁히거나 넓힐 수 없음, 한 문장에 다른 굵기/다른 글자 크기 적용 금지, 글자 형태 변형 금지, 지정 서체 외 다른 서체 사용 금지(Spacing / Size & Thickness / Shape & Font).
  - 값: Prohibitions: too-tight spacing, too-loose spacing, mixed weights in one sentence, mixed sizes in one sentence, glyph distortion, non-designated font

### p40  ↰ B.3
- 🔴 manual `typography.usage` — Type usage policy & context restrictions
  - 근거: Essen Flux는 디스플레이형 서체로 캠페인 타이틀, 키 비주얼, 슬로건, 그래픽 모티프 등 제한적·전략적 영역에만 활용. 장문 단락 등 정보 전달 텍스트에는 가독 효율이 낮아 부적합.
  - 값: Essen Flux restricted to display contexts (campaign titles, key visuals, slogans, graphic motifs); not for body/long-form text
- 🟢 automated `typography.case-policy` 🆕 — Essen Flux casing policy (Mixed Case or Lowercase only; no All Caps)
  - 근거: 타이포그래피는 대·소문자 조합(Mixed Case) 또는 소문자 조합(Lowercase Only) 방식으로만 운영 가능. 전체 대문자(All Caps) 구성은 서체 고유의 리듬감과 조형 균형을 확보하기 어려우므로 사용 금지.
  - 값: Allowed: Mixed Case, Lowercase Only. Prohibited: All Caps (Essen Flux)

## B.4. Illustration (p42–45) · 6룰

### p43  ↰ B.4
- 🔴 manual `illustration.style` 🆕 — Illustration visual-impression style consistency
  - 근거: 추가 개발 시 우측 에셋의 시각 인상(둥근 윤곽 처리, 단순화된 표현의 수위)을 참고하여 일관된 브랜드 아이덴티티를 유지해야 한다. 일관된 그래픽 스타일로 표현.
- 🟡 assisted `illustration.subject-taxonomy` 🆕 — Illustration subject/theme taxonomy
  - 근거: 1~16: 자연 원료 / 17~24: 한국 전통 문화 속 자연 / 25~28: 생동감 있는 감정 / 29~32: Essenherb 제품 제형 / 33~40: Essenherb 제품 라인업으로 주제를 분류.
  - 값: 1-16 natural ingredients; 17-24 nature in Korean tradition; 25-28 vivid emotion; 29-32 product texture; 33-40 product lineup; 40 total assets

### p44  ↰ B.4
- 🔴 manual `color.usage` — Color usage contexts & emotional mapping
  - 근거: Essenherb 컬러 팔레트를 일러스트레이션에 적용하여 생동감 있는 브랜드 메시지를 전달하고 에너제틱한 브랜드 인상을 구축. 가이드의 Color System을 참고하여 컬러를 적용해야 한다.
- 🟢 automated `color.palette` — Brand color palette (swatch values)
  - 근거: 일러스트레이션에 Essenherb 컬러 팔레트를 적용해야 하며, 가이드에 수록된 Color System을 참고하여 컬러를 적용해야 한다.
- 🟢 automated `color.pairing` — Approved color pairing / background combinations
  - 근거: 표현의 의도 및 맥락에 맞는 Color Pairing 전략을 활용하여 일관된 브랜드 아이덴티티를 유지해야 한다.

### p45  ↰ B.4
- 🔴 manual `illustration.symbol-usage` — Illustration application touchpoints & usage modes
  - 근거: 사용 예시: 1.단독 사용 2.레이아웃 포인트 요소 3.텍스트와 혼합 4.배경 그래픽 5.레이어링 6.후가공 요소. 다양한 브랜드 경험 접점에서 생동감 있는 브랜드 메시지를 전달하는 시각 요소로 활용.
  - 값: 6 usage modes: standalone, point element, mixed with text, background graphic, layering, post-processing

## B.5. Photography (p46–52) · 8룰

### p47  ↰ B.5
- 🔴 manual `imagery.classification` — Photography taxonomy & mood criteria
  - 근거: 포토그래피를 재료/제형 이미지(Ingredients & Texture), 제품 소개 연출 이미지(Brand Product), 브랜드 무드 대표 모델 이미지(Brand Model) 세 가지로 분류하고 각 무드를 정의함.
  - 값: subtypes: Ingredients & Texture, Brand Product, Brand Model

### p48  ↰ B.5
- 🟡 assisted `imagery.treatment-spec` — Image color treatment / lighting & background tone
  - 근거: High-Contrast Lighting: 피사체 고유의 질감과 입체감을 강조하기 위해 선명한 대비감의 조명 사용을 권장. 전 서브타입(재료/제형, 제품, 모델)에 공통 적용.
  - 값: high-contrast lighting (선명한 대비감의 조명)
- 🟢 automated `imagery.background-tone` 🆕 — Photography background tone (bright achromatic)
  - 근거: Background Color: 백색~연회색 계열의 밝은 무채색 배경톤 활용을 권장. Ingredients&Texture, Brand Product, Brand Model 모두 동일 규정.
  - 값: background: white ~ light gray, bright achromatic (백색~연회색 무채색)
- 🔴 manual `imagery.composition` 🆕 — Bold photographic composition (vertical/horizontal angle, weighty framing)
  - 근거: Bold Composition: 피사체 고유의 질감/형태/입체감을 강조하는 수직·수평 앵글 기반의 무게감 있는 화면 구성을 권장. 재료/제형 및 제품 포토그래피에 적용.
  - 값: vertical/horizontal angle, weighty composition (수직·수평 앵글, 무게감 있는 구성)

### p51  ↰ B.5
- 🔴 manual `imagery.model-expression` 🆕 — Brand model expression & gesture restraint
  - 근거: Bold Expression: 에센허브만의 차별화된 자신감을 위해 절제된 표정 및 제스처 연출을 권장. 자연스러운 피부 질감 연출 강조.
  - 값: restrained expression & gesture, natural skin texture
- 🔴 manual `imagery.model-diversity` 🆕 — Brand model diversity (race/age/gender)
  - 근거: 다양한 인종·연령·성별의 모델 포토그래피를 통해 글로벌 뷰티 브랜드로서의 면모를 강화.
  - 값: diverse race/age/gender models
- 🔴 manual `imagery.misuse` — Photography / imagery incorrect-usage prohibitions
  - 근거: Incorrect Example A~F: 지나친 보정(피부 질감 소실), 과도한 액세서리·소품·복장 연출, 스킨케어답지 않은 과도한 후보정, 과도한 색조 화장 연출 금지.
  - 값: prohibit: over-retouching, excessive accessories/props/wardrobe, heavy post-processing, heavy color makeup

### p52  ↰ B.5
- 🔴 manual `imagery.ai-consistency` 🆕 — AI-generated photography quality & brand consistency
  - 근거: AI 생성 이미지는 비현실적인 피부 질감 표현 금지, 실사 이미지와의 톤·대비·연출 단절 금지. Do: 자연스럽고 현실적인 피부 표현, 이미지간 일관된 톤·대비·연출.
  - 값: Do: realistic skin, consistent tone/contrast across images; Don't: unrealistic skin, tone/contrast disconnect

## B.6. Visual System (p53–58) · 9룰

### p54  ↰ B.6
- 🔴 manual `imagery.style` — Visual system usage types (Type A Message / Type B Contents)
  - 근거: 비주얼 시스템은 두 타입으로 운영: 로고·타이포그래피로 메시지 중심 비주얼을 전개하는 Type A(Message), 그래픽·포토그래피 등 비주얼 콘텐츠 중심으로 전개하는 Type B(Contents).
  - 값: Type A (Message), Type B (Contents)
- 🔴 manual `imagery.treatment` — Top-align arrangement principle
  - 근거: Essenherb 비주얼 시스템은 상단 정렬(Top Align) 용법을 기반으로 운영된다. Usage Type Overview 페이지에 'Top Align'이 명시적 배치 원칙으로 표기됨.
  - 값: Top Align
- 🔴 manual `voice.design-principle` — Consistent Essenherb-ness across touchpoints
  - 근거: 다양한 브랜드 경험 접점에서 Essenherb다움을 일관되게 표현한다는 원칙이 Type A/Type B 설명 전반에 반복됨.
- 🟡 assisted `messaging.boilerplate` — Recurring descriptor / boilerplate copy
  - 근거: 비주얼 예시 전반에 반복 등장하는 승인 카피: 'Vegan skincare brand designed and made in Korea', 'Discover more at essenherb.global', 'Essence for Energy', 브랜드 스토리 'Essence of Herb, where nature holds the essential answers to skin health...'.
  - 값: Vegan skincare brand designed and made in Korea; Discover more at essenherb.global; Essence for Energy
- 🟡 assisted `messaging.tagline` — Brand slogan / signature line
  - 근거: 비주얼 예시에 반복되는 시그니처 라인 'Essence for Energy'와 디스크립터 'Vegan skincare brand designed and made in Korea'가 키비주얼 메시지로 사용됨.
  - 값: Essence for Energy

### p55  ↰ B.6
- 🟢 automated `layout.template` — Template canvas size / aspect-ratio variations
  - 근거: 모듈형 그리드를 바탕으로 다양한 종횡비의 판형에 유연하게 대응. 명시된 판형: 1:1(1080x1080px), 3:5/SNS(1080x1440px), A4(210x297mm), 3:1/Horizontal AD(1920x640px), 16:9/Horizontal AD,Web(1920x1080px). Type A와 Type B 모두 동일한 판형 세트를 사용.
  - 값: 1:1=1080x1080px; 3:5(SNS)=1080x1440px; A4=210x297mm; 3:1(Horizontal AD)=1920x640px; 16:9(Horizontal AD/Web)=1920x1080px
- 🟡 assisted `grid.system` — Modular grid system for visual layouts
  - 근거: 모듈형 그리드를 바탕으로 다양한 종횡비의 판형에 유연하게 대응하여 비주얼을 전개한다. Type A, Type B 모두 모듈형 그리드 기반(grids & size variation). 단, 모듈 단위·컬럼 수치는 명시되지 않음.
- 🟢 automated `application.sns` — SNS content canvas format
  - 근거: 판형 세트에 3:5 Ratio가 'SNS' 용도로 라벨링됨 (W:1080px H:1440px). 단 프로필 필드/세이프마진 등 SNS 세부 스펙은 이 섹션에 없음.
  - 값: 3:5 (SNS) = 1080x1440px
- 🟢 automated `application.web` — Web / horizontal-ad canvas format
  - 근거: 판형 세트에 16:9 Ratio가 'Horizontal AD, Web' 용도로, 3:1 Ratio가 'Horizontal AD' 용도로 라벨링됨. 단 nav/footer/responsive 등 웹 세부 스펙은 이 섹션에 없음.
  - 값: 16:9 (Web/Horizontal AD) = 1920x1080px; 3:1 (Horizontal AD) = 1920x640px

## C.1. SNS (p60–69) · 14룰

### p61  ↰ C.1
- 🟢 automated `messaging.legal-footer` — Copyright footer on SNS guideline pages
  - 근거: 모든 페이지 하단에 '© Ami Cosmetic Co., Ltd. All rights reserved.' 저작권 표기.
  - 값: © Ami Cosmetic Co., Ltd. All rights reserved.
- 🔴 manual `misc.governance` — No arbitrary modification / escalate to responsible dept
  - 근거: '일관된 브랜드 아이덴티티 형성을 위해 다음의 규정을 엄격히 준수하며, 임의의 형태로 변형할 수 없습니다. 추가 규정이 필요한 경우에는 관련된 부서에 의뢰하여 정의해야 합니다.'

### p62  ↰ C.1
- 🟢 automated `color.palette` — Consistent brand color application across SNS
  - 근거: 'SNS Contents는 로고, 컬러, 서체, 포토그래피 등의 브랜드 디자인 요소에 일관된 레이아웃을 적용하여 제작'되어야 한다.
- 🟡 assisted `typography.families` — Consistent brand typeface application across SNS
  - 근거: '로고, 컬러, 서체, 포토그래피 등의 브랜드 디자인 요소에 일관된 레이아웃을 적용'하여 SNS Contents 제작.
- 🔴 manual `imagery.classification` — Brand photography usage in SNS content (model/ingredient/product images)
  - 근거: Brand Contents는 모델 이미지, 브랜드 디자인 어플리케이션 이미지, 자연 재료(ingredient) 이미지 등 시각 자산을 활용; Product Contents는 제품 이미지(Product Photography, +Background, +Information) 활용.
- 🔴 manual `messaging.application-copy` — Approved brand story / verbal identity copy in content
  - 근거: Brand Contents는 브랜드 언어 자산(브랜드 스토리, 시그니처 등)을 콘텐츠로 활용; Brand Story 예시 'Essenherb is a vegan skincare brand designed and made in Korea...'.
  - 값: Brand Story: 'Essenherb is a vegan skincare brand designed and made in Korea. We started with a simple belief: nature holds the essential answers to skin health.'

### p65  ↰ C.1
- 🟡 assisted `layout.zones` — Content zone designation (person front, text fixed top)
  - 근거: Influencer Gifting: '인물 이미지를 전면에 배치하여... 텍스트를 상단에 고정하여 시청자의 시선을 유도'. Events: 로고/행사 제목/장소/시간 등 가변 정보에 일관된 레이아웃 적용.
  - 값: Influencer Gifting: person image front, text fixed at top
- 🟡 assisted `color.contrast.photo-bg` — Legibility on photographic background (bottom gradient for captions)
  - 근거: Interview: '하단에 그라디언트를 적용하여 자막 및 텍스트의 가독성을 확보할 수 있습니다.'
  - 값: bottom gradient overlay for caption/text legibility

### p66  ↰ C.1
- 🟡 assisted `logo.placement` — Brand & partnership logo placement in content
  - 근거: Events 콘텐츠: '브랜드 로고 및 파트너십 로고, 행사 제목, 장소, 시간 등... 일관된 레이아웃을 적용'. SNS Contents는 로고를 브랜드 디자인 요소로 일관 적용.

### p67  ↰ C.1
- 🟢 automated `application.sns` — SNS content spec (format/profile/look-and-feel)
  - 근거: Feed Layout System Format '1080 × 1440 px (W/H)' with 80px 사방 여백; Reels는 '1080 × 1920 px'. 브랜드 디자인 요소에 일관된 레이아웃을 적용하고 콘텐츠 모드(Brand/Product/Communication Contents)로 구분 운영.
  - 값: Feed 1080×1440px, Reels 1080×1920px, margin 80px; Feed thumbnail 1080×1440px, Reels thumbnail 1080×1920px

### p68  ↰ C.1
- 🟢 automated `layout.template` — Template canvas size, padding & proportional zones
  - 근거: Layout System: Feed 1080×1440px, Reels 1080×1920px, 80px 패딩. Reels Thumbnail은 상·하 320px, 중앙 1280px 영역으로 분할(상하 80px 여백).
  - 값: Feed canvas 1080×1440px; Reels canvas 1080×1920px; padding 80px; Reels thumbnail zones top/bottom 320px, middle 1280px, outer margin 80px

### p69  ↰ C.1
- 🔴 manual `application.content-mix-ratio` 🆕 — SNS feed content-type mix ratio (Communication ≤30%)
  - 근거: 'Communication Contents는 SNS 피드 전체 콘텐츠 비율의 30%를 초과하지 않는 것을 권장' 하며, 콘텐츠가 특정 유형에 편중되지 않고 적절한 비율로 번갈아 업로드되어야 함.
  - 값: Communication Contents ≤ 30% of total feed
- 🔴 manual `application.reels-profile-grid` 🆕 — Reels content removed from profile grid
  - 근거: '릴스(Reels) 콘텐츠의 경우 프로필 그리드에서 제거(remove from profile grid) 기능을 활용하여 콘텐츠의 피드 노출 비율을 조정할 수 있습니다. (릴스 탭에만 콘텐츠 표시)'
- 🔴 manual `layout.tone` — Layout tone-and-manner (consistent feed look & feel)
  - 근거: '일관된 피드 룩앤필과 브랜드 통일감이 유지되고 있는지'에 유의하여 콘텐츠를 제작·운영해야 한다. 가이드 디자인 예시를 참고해 일관된 피드 룩앤필 및 브랜드 통일감 유지.

## C.2. AD (p70–78) · 13룰

### p71  ↰ C.2
- 🟢 automated `application.format` — AD application format / size & aspect ratios per item
  - 근거: 온라인 광고는 16:9, 3:4, 3:1, 1:1, 1:2 비율로 제공; 오프라인 포스터는 1440×2100, 2400×1600, 8600×2100mm 규격.
  - 값: Online ratios: 16:9, 3:4, 3:1, 1:1, 1:2; Offline mm: 1440×2100 / 2400×1600 / 8600×2100
- 🔴 manual `application.touchpoint-catalog` — AD touchpoint types (Online / Offline; CTA vs Information)
  - 근거: 광고를 Online AD / Offline AD(Vertical/Horizontal)로, 콘텐츠 의도를 1.CTA Type(즉각 행동 유도) 2.Information Type(정보 전달/탐색 유도)으로 분류.
  - 값: Online AD, Offline AD (Vertical/Horizontal); CTA Type, Information Type
- 🔴 manual `application.design-concept` — AD consistent brand design elements & tone-and-manner
  - 근거: 광고는 로고·서체·컬러·포토그래피·일러스트레이션 등 브랜드 디자인 요소를 일관된 레이아웃에 적용하여 다양한 접점에서 일관된 톤앤매너를 유지해야 함.
- 🔴 manual `messaging.application-copy` — AD CTA / promotional copy set
  - 근거: 광고 예시 카피: 'Shop Now', 'Best Selling', 'Curator's Pick', 'Weekly Best', 'Discover more at essenherb.global' 등 승인 카피.
  - 값: Shop Now; Best Selling; Curator's Pick; Discover more at essenherb.global
- 🔴 manual `application.poster-motion` — AD motion/countdown timer element
  - 근거: 온라인 광고 예시에 카운트다운 타이머 '00:13:46:02' 표기 — 시간 기반 모션/프로모션 광고 요소.
  - 값: 00:13:46:02 (timecode)

### p73  ↰ C.2
- 🟢 automated `layout.template` — AD template canvas size / format & proportional zones
  - 근거: 오프라인 광고 포맷이 명시됨: 세로형 1440×2100mm, 가로형 2400×1600mm 및 8600×2100mm (W/H). '일관된 레이아웃을 적용'.
  - 값: Offline Vertical: 1440×2100mm; Offline Horizontal: 2400×1600mm; Offline Horizontal (long): 8600×2100mm (W/H)
- 🔴 manual `messaging.tagline` — AD verbal identity / tagline copy
  - 근거: 광고 카피 'Where nature holds essential answers to your skin.', 'Essence for Energy', 'Essence of Herb', 'Nature's essential answers to skin health' 등 Verbal Identity로 명시.
  - 값: Where nature holds essential answers to your skin.; Essence for Energy; Essence of Herb
- 🟢 automated `messaging.legal-footer` — AD copyright footer
  - 근거: 모든 페이지에 저작권 푸터 표기: '© Ami Cosmetic Co., Ltd. All rights reserved.'
  - 값: © Ami Cosmetic Co., Ltd. All rights reserved.
- 🔴 manual `imagery.classification` — AD photography usage (model / product / ingredient & texture)
  - 근거: 세로형 광고 레이아웃 다이어그램에 사용 포토그래피 유형 표기: Photography (model), Photography (product), Photography (ingredient & texture).
  - 값: Photography (model), Photography (product), Photography (ingredient & texture)

### p75  ↰ C.2
- 🟡 assisted `layout.zones` — AD layout content zones (Image/Text/Logo/Content area)
  - 근거: 가로형 광고 레이아웃이 Image Area, Text Area, Logo Area, Content Area(Image, Text), Content Area(Equal Columns) 등 명명된 영역으로 분할됨.
  - 값: Image Area, Text Area, Logo Area, Content Area (Image, Text), Content Area (Equal Columns)
- 🔴 manual `messaging.boilerplate` — AD brand descriptor / boilerplate copy
  - 근거: 광고 본문에 승인된 브랜드 디스크립터가 등장: 'Essenherb is a vegan skincare brand designed and made in Korea... Essence of Herb, where nature holds the essential answers to skin health...'
  - 값: Essenherb is a vegan skincare brand designed and made in Korea...

### p77  ↰ C.2
- 🟢 automated `layout.zone.size` — AD layout zone proportions (A-unit / 6A spacing reference)
  - 근거: 가로형(8600×2100mm) 레이아웃 다이어그램에 'A', '6A' 모듈 측정 표기와 Logo Area / Content Area (Equal Columns) 구획이 표시됨.
  - 값: module marks A, 6A on 8600×2100mm horizontal layout
- 🟢 automated `spacing.scale` — AD modular A-unit spacing system
  - 근거: 가로형 레이아웃 다이어그램에 'A', '6A' 모듈 단위 표기 — A 단위 기반 모듈러 스페이싱.
  - 값: base unit A; multiple 6A

## C.3. Stationery (p79–84) · 18룰

### p80  ↰ C.3
- 🟢 automated `application.format` — Application format / trim size (per item)
  - 근거: 명함 Format 90×50(W/H), 리플렛 A4/210×297mm, 제품 정보 카드 A5/148×210mm 으로 항목별 트림 사이즈가 명시됨.
  - 값: Business Card 90×50mm; Brand Leaflet A4 210×297mm; Product Information Card A5 148×210mm
- 🟢 automated `application.print-spec` — Print method / spot color / ink spec (per item)
  - 근거: 명함 2. Print: 옵셋 인쇄 / 별색 1도 (Pantone Warm Red C).
  - 값: Business Card: offset print, spot color 1, Pantone Warm Red C
- 🔴 manual `color.print-fidelity` — Print color fidelity / Pantone matching
  - 근거: 별색 1도 (Pantone Warm Red C) 지정 — 인쇄 시 Pantone 색 일치 여부는 실물 교정 단계에서만 확인 가능.
  - 값: Pantone Warm Red C
- 🟢 automated `color.mode` — Color mode / spot-color by medium
  - 근거: 옵셋 인쇄 / 별색 1도 — 인쇄 매체에 별색(Spot/PMS) 색 모드 사용 명시.
  - 값: Offset print = spot color (Pantone Warm Red C)
- 🟢 automated `application.spec-scale` — Specification display-scale convention
  - 근거: 명함/리플렛은 'Specification (Scale 100%)', 제품 정보 카드는 'Specification (Scale 80%)'로 도면 표시 스케일을 명기.
  - 값: Business Card/Leaflet: 100%; Product Information Card: 80%
- 🟢 automated `messaging.contact-block` — Standard contact / company-info block
  - 근거: 명함에 이름/팀·직책/이메일/전화/인스타그램 핸들/주소 및 저작권(© Ami Cosmetic Co., Ltd.) 정보 블록이 구성됨.
  - 값: Name: Seonha Lee 이선하; Brand Design Team | Designer; mail s***@***.co.kr; phone +82 10 ****-5678; Instagram @essenherb_global; 3F, SR63-1 B/D, 17, Eonju-ro 149-gil, Gangnam-gu, Seoul
- 🟡 assisted `messaging.content-fields` — Required content fields on collateral/forms
  - 근거: 명함에 필수 정보 필드(성명, 부서/직책, 이메일, 전화, SNS 핸들, 주소)가 채워져야 함.
- 🟢 automated `messaging.legal-footer` — Legal / copyright / distribution footer
  - 근거: 모든 페이지 하단에 © Ami Cosmetic Co., Ltd. All rights reserved. 저작권 표기.
  - 값: © Ami Cosmetic Co., Ltd. All rights reserved.
- 🔴 manual `layout.tone` — Layout tone-and-manner (restraint/boldness)
  - 근거: 명함은 절제된 톤앤매너의 레이아웃으로 전문적 브랜드 인상을 각인력 높게 전달; 제품 카드는 정제된 레이아웃으로 신뢰감 있게 전달.
- 🟢 automated `color.roles` — Color role assignment
  - 근거: 명함에 브랜드 메인 컬러를 적용; 제품 정보 카드는 로고, 컬러 등 브랜드 디자인 요소를 적용.
  - 값: brand main color (Pantone Warm Red C)
- 🟡 assisted `typography.families` — Designated typeface families by role/script
  - 근거: 명함은 브랜드 메인 컬러와 '지정 서체'를 적용하도록 규정.
- 🔴 manual `application.material` — Substrate / paper stock / material (per item)
  - 근거: 옵셋 인쇄가 명시되어 종이 스톡/지질이 전제되나 본문에 구체 용지 사양은 미기재 — 실물/사양서 확인 필요.

### p81  ↰ C.3
- 🟢 automated `grid.system` — Layout grid / module system
  - 근거: 리플렛 Specification에 외곽 여백 5mm와 내부 영역 치수(200mm, 287mm)가 표시되어 레이아웃 모듈/여백을 규정.
  - 값: Leaflet: margins 5mm, inner 200×287mm; Product card margins 8mm
- 🔴 manual `imagery.classification` — Photography taxonomy & mood criteria
  - 근거: 리플렛은 일관된 톤앤매너의 포토그래피 및 일러스트를 활용하여 제품 정보·특징·효능을 직관적으로 전달.
- 🔴 manual `messaging.application-copy` — Application / merch printed copy
  - 근거: 리플렛/제품 카드에 브랜드 스토리, 슬로건('Essence for Energy'), 사인오프 카피, 제품 효능 설명 등이 인쇄됨.
  - 값: Essence for Energy; Nature's Wisdom Through K-Wild Herb Formulas; essenherb.global
- 🔴 manual `messaging.boilerplate` — Approved descriptor / boilerplate copy
  - 근거: 리플렛 본문에 브랜드 설명(boilerplate) 'Essenherb is a skincare brand inspired by the powerful vitality of wild herbs...' 및 비건 인증 문구가 인쇄됨.

### p82  ↰ C.3
- 🟡 assisted `layout.zones` — Content zone / area designation
  - 근거: 리플렛은 'Outside [Containing Cover] - Brand Identity Section', 'Inside - Product Introduction Section'으로 영역을 지정하고 상단 정렬 기반으로 정보 위계를 정돈.
  - 값: Outside = Brand Identity Section; Inside = Product Introduction Section

### p84  ↰ C.3
- 🔴 manual `application.merch-spec` — Merchandise / collateral design spec
  - 근거: 제품 정보 카드는 로고/컬러 등 핵심 브랜드 디자인 요소에 정제된 레이아웃을 적용해 제품 정보·특징·효능을 명확·신뢰감 있게 전달.

## C.4. Package (p85–101) · 16룰

### p86  ↰ C.4
- 🔴 manual `misc.governance` — Strict adherence / no arbitrary modification / dept escalation
  - 근거: 일관된 브랜드 아이덴티티 형성을 위해 다음의 규정을 엄격히 준수하며, 임의의 형태로 변형할 수 없습니다. 추가 규정이 필요한 경우에는 관련된 부서에 의뢰하여 정의해야 합니다.
- 🔴 manual `layout.tone` — Restrained tone-and-manner of package layout
  - 근거: 브랜드 컬러, 지정 서체 및 전용 서체를 절제된 톤앤매너로 적용하여 정제된 브랜드 인상을 전달. 일관된 레이아웃으로 완성도 높고 신뢰감 있는 브랜드 경험 전달.
- 🟢 automated `color.palette` — Brand color applied to package
  - 근거: 브랜드 컬러... 를 절제된 톤앤매너로 적용 — 패키지에 브랜드 지정 컬러를 사용해야 함(구체 hex는 본 섹션에 없음, 컬러 섹션 참조).
- 🟡 assisted `typography.families` — Designated & exclusive typefaces on package
  - 근거: 지정 서체 및 전용 서체를 절제된 톤앤매너로 적용 — 패키지 카피에 브랜드 지정/전용 서체만 사용.

### p87  ↰ C.4
- 🟢 automated `spacing.scale` — Package standard ratio / A-unit modular system (20A wide face)
  - 근거: 패키지 디자인은 넓은 면의 비율을 20A로 설정하는 것을 원칙으로 하며, 레이아웃을 마진/거터 모두 A 단위 배수(0.8A, 1.5A, 2A 등)로 구성한다.
  - 값: wide-face=20A; layout units in A multiples (0.8A, 0.75A, A, 1.5A, 2A, 2.5A, 3.5A, 7A)
- 🟢 automated `grid.system` — Package front/side layout grid (margin + gutter module)
  - 근거: Standard Ratio·Margin·Gutter로 구성된 레이아웃 그리드를 Vertical/Horizontal/Square 판형별로 정의하고, 각 면의 마진을 A 단위 배수로 표기.
  - 값: Vertical: margins 0.8A; Horizontal: 2A/1.5A/0.75A; Square: 2A; layouts=Vertical/Horizontal/Square
- 🟢 automated `layout.zones` — Package gutter between product name and logo (50%-100% of margin)
  - 근거: 제품명과 로고 사이의 권장 거터값은 마진값의 50% - 100%입니다.
  - 값: gutter = 50%-100% of margin; margin is variable by format
- 🟡 assisted `logo.variants` — Primary / Secondary Logo Type per package layout
  - 근거: Primary Logo Type 및 Secondary Logo Type으로 구분하여 일관된 브랜드 아이덴티티를 구축. 각 판형(Vertical/Horizontal/Square)별로 Primary/Secondary 로고 타입 적용 예시를 규정.
  - 값: Primary Logo Type, Secondary Logo Type

### p89  ↰ C.4
- 🟡 assisted `logo.placement` — Logo placement on package faces (front/side view layout)
  - 근거: Package Box Front View Layout / Side View 에서 브랜드 로고를 다양한 판형에 적극적으로 활용하여 지정된 위치에 배치하도록 설계.
  - 값: surfaces: Front View, Side View; layouts: Vertical/Horizontal/Square

### p93  ↰ C.4
- 🟢 automated `application.format` — Package trim/format dimensions per product (W/D/H mm)
  - 근거: Format 60×40.5×176mm (W/D/H) 등 제품별 패키지 실측 치수와 H=20A 환산을 명시.
  - 값: Deep Core Hydra Cream 60×40.5×176mm (H=176mm=20A); Tea Tree Cotton Mask 142×25×182mm (H=182mm=20A); Black Snail Cream 61×61×62mm (H=62mm=20A); DCHC product 63×146mm (20A=136mm); Cotton Mask product 141×180mm (180mm=20A); Black Snail product 188.5×37mm (37mm=20A)
- 🟢 automated `application.spec-scale` — Specification display-scale convention (1:1, 1:1.2, 1:0.8)
  - 근거: Usage Example 도면에 (1:1 Scale), (1:1.2 Scale), (1:0.8 Scale) 등 표기 축척을 명시.
  - 값: 1:1 Scale; 1:1.2 Scale; 1:0.8 Scale
- 🔴 manual `application.finishing` — Emboss post-processing (양각 후가공) area & print position
  - 근거: 도면에 '2A / 양각 후가공 영역', '1A / 양각 후가공 영역', '7A / 양각 후가공 영역' 등 양각(emboss) 후가공 영역을 지정. p101 '인쇄위치 바닥부터 6mm 높이'.
  - 값: emboss areas: 2A (p93), 1A (p95), 7A (p97); print position 6mm from bottom (p101)
- 🔴 manual `color.print-fidelity` — Prototyping data — manufacturer must adjust valid color before production
  - 근거: 해당 디자인 데이터는 Prototyping이므로 반드시 제작업체에서 유효한 컬러 및 크기로 조정 후 적용해야 합니다.

### p99  ↰ C.4
- 🟢 automated `messaging.contact-block` — Standard company / responsible-seller info block (back panel)
  - 근거: 화장품책임판매업자:(주)아미코스메틱, 화장품제조업자:주식회사 정코스, 소비자상담실:010-****-3885, Manufactured for AMI Cosmetics Co.,LTD, US RP: DIST.BY CDRI USA INC #221 3003 North First Street San JOSE CA 95134, Email: c***@***.pro 정보를 후면에 표기.
  - 값: consumer line 080.***.**85; US addr #221, 3003 North First Street, San Jose, CA 95134; email c***@***.pro (masked)
- 🟢 automated `messaging.legal-footer` — Copyright / made-in / distributor footer on package
  - 근거: © Ami Cosmetic Co., Ltd. All rights reserved. / Made in Korea, Discover more at essenherb.co.kr / essenherb.us / LOT & EXP: On the product 등 법적·저작권 표기.
  - 값: © Ami Cosmetic Co., Ltd. All rights reserved.; Made in Korea; essenherb.co.kr / essenherb.us; LOT & EXP: On the product
- 🟡 assisted `messaging.content-fields` — Required product content fields (net weight/volume, ingredients, usage, caution)
  - 근거: 제품명, 용량(100 ml 3.38 fl. oz., Net Wt. 23g x 5 sheets), Key Ingredients, How To Use, Caution In Use, 기능성 표시(미백·주름개선 2중 기능성), Dermatologically Tested 등 필수 표기 필드.
  - 값: fields: product name, net wt/volume, key ingredients, how to use, caution in use, functional-cosmetic notice, dermatologically tested

## C.5. Etc. (p102–109) · 1룰

### p102  ↰ C.5
- 🟢 automated `messaging.legal-footer` — Legal / copyright / distribution footer
  - 근거: 페이지 하단 저작권 표기 '© Ami Cosmetic Co., Ltd. All rights reserved.' 만 존재. 본문 규칙은 없고 섹션 표지(반복되는 'Applications / Etc. / C.5' 헤더)뿐임.
  - 값: © Ami Cosmetic Co., Ltd. All rights reserved.
