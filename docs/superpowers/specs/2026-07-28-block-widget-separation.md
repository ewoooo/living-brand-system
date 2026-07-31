# Block → Block + Widget 분리 — 리서치 & 설계

> 브랜치 `refactor/block-widget-separation` 기반 리서치. 5개 병렬 조사(블록 인벤토리 / 렌더 파이프라인 / 검수·projection / Payload 모델링·마이그레이션 / 저작 계약·파일럿) 종합.
> 목표 모델: `Chapter › Section › Page › Block › Widget`. **Widget = 인터랙티브 이미지**(Text/Image/Shape/Link와 형제). **Block = Rule 대응 레이아웃 단위.**

## 0. 한 줄 결론

**"순수 중첩(Block이 Widget을 자식으로 품는) 모델"은 개념엔 맞지만, 검수/검색/agent 파이프라인의 flat 순회 5곳을 깨뜨리고 마이그레이션이 큼.** 그래서 값(텍스트 통일 + Widget 개념 확립 + Layout Grid)을 **얇은 수직 슬라이스로 먼저** 얻고, 전면 중첩 컨테이너화는 그 슬라이스로 계약을 검증한 뒤 신중히 진행하는 2단계를 권한다.

---

## 1. 현재 구조 (사실)

### 1-1. 블록 자동 카탈로그 계약
- 블록 = `src/features/guideline/blocks/<kebab>/` 폴더. **`schema.ts`·`projection.ts`·`component.tsx` 3파일 필수**(없으면 `generate-guideline-block-catalogs.ts`가 throw). `view.tsx`는 관례(클라 뷰).
- 폴더명 → `key`(camel)·`symbol`(Pascal) 자동 파생. 생성물 3개: `catalog/{schema,projection,renderer}.generated.*`.
- `blockType` union은 **payload-types에서 역산**(`blocks/types.ts:3`). 세 카탈로그가 `satisfies …Map`으로 완전성 강제.
- 모든 블록 공유 필드는 `baseBlockFields()` = **`rules` 관계 하나뿐**(블록은 Rule을 참조만).

### 1-2. 블록 인벤토리 (19종) 분류
- **인터랙티브 시각 = Widget 후보** (서버 component + 클라 view, 상태/조작 보유): `colorPairing`, `logoViewer`, `logoGroupViewer`, `stemClearSpace`, `iconGrid`, `glyphGrid`, `typeSpecimen`, (준)`colorPalette`·`carousel`.
- **컨테이너**(텍스트+이미지 조합): `contentColumns`(대표), `doDont`, `imageGrid`.
- **텍스트 위주**: `callout`, `specList`, `signatureShowcase`, `typeScale`.
- **정적 이미지/미디어**: `mediaShowcase`, `layoutGrid`, `colorPairingRecommendation`(상태 없는 정적 시각).

### 1-3. 렌더 파이프라인 & 텍스트 엔진 (이미 대부분 통일돼 있음)
- 흐름: `renderer.generated.tsx`(디스패치) → `guideline-blocks.tsx`(세로 스택 `gap-8`) → 각 블록이 **전부** `GuidelineBlockFrame`(표면색) + `GuidelineContentFrame`(max-w 1250 + padding)로 감쌈. **폭·표면·리듬 경계는 이미 단일 소유.**
- 텍스트 엔진: `GuidelineHeader`/`GuidelineDescription`의 `variant`(onboard/chapter/section/page/**block**) — 타이포·색·richText 분기가 이미 단일화. `block` variant가 "블록 내부 통일 텍스트"의 정확한 후보.
- **깨지는 건 스타일 엔진이 아니라 (a) 자체 `h4`를 쓰는 3~5개 블록**(callout/layout-grid/spec-list + view의 topic 라벨), **(b) 정렬 래퍼 불일치**(`col-start-2` vs 왼쪽 풀블리드), **(c) 텍스트 값이 블록 스키마마다 흩어짐**(title/heading/body/description/label/caption).

### 1-4. 검수/projection/검색 파이프라인
- `BlockProjection<Evidence>` = `{ text, evidence:{type,…}, referenceAssets:[{id,role}] }`. 블록당 1 projection. evidence union은 각 블록 `evidence.type as const`에서 역산.
- **flat 순회 전제 5곳**: `build-check-source-snapshot`, `collect-guideline-check-sources`(+`collectApplicationImages`), `guideline-search-text`, agent context service — 전부 `document.blocks`만 돌고 **자식으로 안 내려감**.
- 🔴 **기존 미해소 버그**: `imageGrid`·`logoViewer`·`stemClearSpace`가 `referenceAssets`를 내보내지만 `collectApplicationImages` switch에 case가 없어 **AI 검수에 이미지가 도달 안 함**. 이 switch는 `default`/exhaustive 가드가 없어 컴파일러가 안 잡아줌.

### 1-5. 저작 계약 (Widget은 새 계층이 아님)
- "Widget"이라 부를 것 = **이미 존재하는 인터랙티브 블록의 4파일 서브패턴**(schema/projection/component/**view**, 서버 조립 + 클라 인터랙션). 발명이 아니라 명명·문서화.
- 계약 핵심: 서버 component가 `brand-*` 조회→순수 props로 클라 view에 주입(단방향), 브랜드 무관(색·로고 props), 정적 큐레이션은 폴더 내 `.ts`(예: `pairings.ts`·`colorway.ts`, 재-CMS화 금지), projection은 최소 evidence. docs/09·10의 닫힌 토큰·프레임 소유 준수.

---

## 2. 핵심 결정 포인트 ⚠️ (리서치가 드러낸 것)

**Widget을 Payload에서 "Block의 자식(중첩 blocks)"으로 둘 것인가, "flat한 최상위 블록"으로 둘 것인가?** 이게 blast radius를 완전히 가른다.

| | 중첩(Block›Widget 자식) | flat(형제/렌더 구분) |
|---|---|---|
| 개념 충실도 | 높음(결정 모델 그대로) | 중(구조가 아니라 렌더/명명 구분) |
| Payload | 중첩 blocks 필드 → 자식 종당 4테이블, 4겹 중첩 시 **63자 식별자 벽** | 테이블 추가 최소 |
| 검수/검색 파이프라인 | flat 순회 5곳 재귀화 필요, evidence 부모로 접기, `collectApplicationImages` 재귀 | **거의 무변경**(새 blockType 하나 느는 수준) |
| 마이그레이션 | expand(~24테이블)+backfill(콘텐츠 변환 seed)+contract, 큼 | 작음 |
| 렌더러 | 자식 재귀 순회 도입 | 기존 스택 그대로 |

**결정 권고**: projection/검수는 **계속 Block(최상위) 단위 1블록→1 projection으로 유지**하고(자식을 두더라도 부모 Block projector가 자식을 접어 하나로 내보냄), 순회 재귀화는 피한다. 즉 "중첩을 하더라도 파이프라인은 flat하게 본다."

---

## 3. 권고 아키텍처 — 2단계 (동시성 유지)

사용자 의도("1.Widget 정의 + 2.Block 분리는 상호검증이라 같이") 존중: **Phase 1이 곧 두 작업의 얇은 수직 슬라이스**다. Widget을 실제로 하나 만들어(정의) + 텍스트 분리를 렌더 레벨에서 시작(분리)해서 계약이 유효한지 검증하고, Phase 2에서 전면 확산한다.

### Phase 1 — 수직 슬라이스 (값 큼 · 비용 작음 · 스키마 격변 없음)
1. **통일 Text**: `GuidelineHeader`/`Description`(block variant) 재사용하는 얇은 `BlockText`(title+body, 정렬 규약 1곳) 도입 → callout/layout-grid/spec-list의 자체 `h4` 교체, `col-start-2` 중복 흡수. (렌더 레벨만, 스키마 불변)
2. **Widget 개념 확립 + 파일럿**: `layout-grid-overlay`를 **첫 Widget(인터랙티브 블록)** 으로 block 승격. docs/10에 "Widget = 4파일 인터랙티브 블록" 소절 추가.
3. **검수 gap 정리**: `collectApplicationImages`에 `imageGrid`/`logoViewer`/`stemClearSpace` case 추가(기존 버그) + `default` exhaustive 가드.
- 산출: 텍스트 시각 통일(사용자 실제 통증 해소) + Layout Grid Widget + 검수 정합. 큰 마이그레이션·파이프라인 재작성 없음.

### Phase 2 — 전면 Block 컨테이너화 (Phase 1로 계약 검증 후)
- `Block`(레이아웃 컨테이너: columns/gap/align + `children` blocks + rules) + 자식 `Text/Image/Shape/Link/Widget`. Widget은 `widgetType` 판별자(가벼운 위젯) 또는 `widgets` 컬렉션 참조(무거운 인터랙티브, 예: logoGroupViewer).
- projection은 부모 Block이 자식을 접어 1 projection(§2 결정).
- expand→backfill(seed)→contract 마이그레이션.

---

## 4. Widget 저작 계약 (초안)

`blocks/<kebab>/`에 아래를 모두 제공:
- `schema.ts`(default export): `slug`(camel·**전역 유일**)·`interfaceName`·`labels`, 인스턴스 파라미터 필드 + 이미지=`upload→application-images`, 색=`relationship→brand-colors`, enum은 `enumName` 전역 공유(63자), `...baseBlockFields()`.
- `component.tsx`(default, **서버**): `getPayload`로 `brand-*`·이미지 URL 조립(`depth:0`) → `GuidelineBlockFrame` 안에서 클라 view에 **순수 props** 주입.
- `view.tsx`(`'use client'`): 인터랙션(useState/useEffect)만, 해석된 props만, a11y(role/aria/focus-visible/키보드), 시맨틱 토큰(색 데이터 hex만 예외).
- `projection.ts`(default): `{text, evidence:{type}, referenceAssets}`. 이미지 있으면 `referenceAssets` 채움.
- 정적 큐레이션 데이터는 폴더 내 `.ts`. 비자명 로직(좌표/분기)엔 co-located `*.test.ts`.

접합면: Block→Widget 단방향 순수 props(DB 핸들·Payload 객체 금지), Widget은 자기 상태만 소유(localStorage 자족).

---

## 5. Layout Grid 파일럿 (첫 Widget) 구체 단계
- ⚠️ **네이밍 충돌**: `blocks/layout-grid`(slug `layoutGrid`)가 **이미 존재**(정적 columns/gutter/margin 시각화, 다른 물건). 파일럿 slug는 **`layoutGridOverlay`**로.
- `blocks/layout-grid-overlay/` 생성:
  - `schema.ts`: `title` + `images`(array upload→application-images) + `sections`/`padding`/`gap`/`columns`(number, essenherb default) + `accent`(relationship→brand-colors) + `...baseBlockFields()`.
  - `view.tsx`: 기존 `LayoutGridOverlay`/`GridStage`/`NumberField` 이식. **`GUIDE='#ff2d78'` 리터럴 → `accent` prop(hex)** (docs 닫힌 토큰 위반 수정). `SAMPLES`/`Demo` 제거.
  - `component.tsx`(서버): 이미지 URL·accent hex 조립 → view 주입.
  - `projection.ts`: evidence 스칼라(sections/columns/padding/gap) + 이미지 `referenceAssets`(role context).
  - `GridStage` 좌표 % 환산 수학에 `*.test.ts` 하나.
- 이미지는 `application-images`에 seed 스크립트로 프로비저닝(git/마이그레이션 아님).
- `pnpm generate:block-catalogs` → `pnpm doctor`.

---

## 6. 함정 / 리스크 (착수 전 인지)
- **63자 Postgres 식별자**: 중첩 4겹(`_guideline_docs_v_blocks_blk_children_wgt_<array>_locales`)이 62자 육박 → 컨테이너/자식/위젯 전부 짧은 `dbName`(blk/txt/img/shp/lnk/wgt) 필수. 무거운 위젯은 컬렉션 참조로 depth 축소.
- **마이그레이션 체인/스냅샷**: `migrate:create`는 최신 `.json` 스냅샷 없으면 전체 재생성. 한 대에서만 생성, `.ts`+`.json`+`index.ts` 함께 커밋. slug rename은 push가 hang → 신규 추가로.
- **flat 순회 5곳**(§1-4): 중첩 도입 시 재귀 or 부모-접기 결정 필요(§2 권고).
- **`collectApplicationImages` exhaustive 가드 부재**: 블록/위젯 추가 시 이미지 유실이 조용히 발생. `default: x satisfies never` 가드 삽입.
- **versioned 미러 + nav 4조건**: draft/published 양쪽 백필 안 하면 nav(published·ko·parent=null)에서 문서 누락.
- **네이밍 충돌**: `layoutGrid` vs `layoutGridOverlay`(§5).
- **query depth**: 중첩·관계 populate depth 명시 안 하면 과다조회/미populate.

---

## 7. 다음 액션 (제안)
1. **§2 결정 확정**: Phase 2에서 Widget을 중첩 자식으로 갈지(모델 충실) / flat 유지할지(비용 최소). Phase 1은 이 결정과 무관하게 진행 가능.
2. **Phase 1 착수**: (a) `BlockText` 통일 → (b) `layoutGridOverlay` Widget 파일럿 → (c) `collectApplicationImages` 정합.
3. Phase 1로 Widget 계약이 유효한지 확인한 뒤 Phase 2(전면 컨테이너화 + 마이그레이션) 설계 확정.

---

## 8. Rule ↔ Block provenance — 끊기면 안 되는 불변식 (추가 조사)

Block은 단순 레이아웃이 아니라 **Rule의 출처**다. 이 관계가 코드상 어디에 있고 무엇을 지켜야 하는지:

- **물리적 소재**: `blocks/shared/fields.ts`의 `guidelineRulesField()` = `{name:'rules', type:'relationship', relationTo:'rules', hasMany:true}`. 19블록 전부 `...baseBlockFields()`로 이 필드 하나만 공유. 문서 레벨에도 동일(`GuidelineDocuments.ts:122`). **방향 = block→rule 단방향.** Rule은 자기 출처를 모른다.
- **유일한 조인 지점**: `checks/collect-guideline-check-sources.ts`의 `collectGuidelineCheckSources(document)`. `document.rules` + `document.blocks[].rules`를 훑어 `{rule, blockName(=blockName||blockType), source:{documentId}, evidence(=snapshotBlock), referenceAssets}` 튜플로 재구성. **provenance는 저장이 아니라 이 정방향 순회로 런타임 재구성.**
- **소비처(모두 이 조인 통과)**: MCP 검수 카탈로그 / Review 룰셋(getRuntimeChecks) / AI 챗 컨텍스트 / CheckSession 동결(`rulesetSnapshot` json에 박제).

**🔴 리팩터 불변식:**
1. **`rules` 관계는 collector가 도는 레벨(Block/document)에 유지.** Widget(자식)으로 내리면 collector가 `block.rules`에서 못 찾아 rule 소멸 → **rules는 Block 레벨 고정**(모델의 "Block=Rule 단위"와 정합).
2. `(rule, blockName, source.documentId, evidence)` 튜플 계약 유지. **`source.documentId`가 유일한 기계적 앵커** — 절대 불변.
3. blockType discriminator 개명 시 `format-check-evidence.ts`에 구→신 매핑 추가(안 하면 기존 CheckSession 동결본 렌더 붕괴). 선례: `columnUnit→contentColumns`, `policyCallout→callout`.
4. `projection.generated`(blockType→projector)는 total. 새 블록/위젯 등록 누락 시 `snapshotBlock` throw → 문서 provenance 전멸.
5. 중첩 깊어지면 populate `depth` 재검토(미populate rule은 collector가 스킵).

**회귀 오라클(네 "챗봇으로 rule 끊겼나 확인" 아이디어의 코드화):**
- 단위: `collect-guideline-check-sources.test.ts` — 리팩터 전후 green 유지 = provenance 불변. 컨테이너/Widget 픽스처 추가가 1차 방어선.
- E2E: MCP `listPublishedMcpGuidelineChecks` 또는 `getRuntimeChecks` 출력을 전/후 덤프해 **`(rule.key → documentId, blockName, evidence)` 튜플 집합 diff**. 동일하면 "같은 rule이 여전히 그 block에서 나온다" 보장.

## 9. 치환가능성 감사 — Widget 정의 경계 (추가 조사)

19블록을 "정적 이미지와 등가인 단일 시각 덩어리인가"로 분류. **단일 판별 신호 = 블록이 `GuidelineHeader(title)`/`GuidelineDescription(body)`를 직접 렌더하는가.** 렌더하면 그 텍스트가 시각에 갇힌 것(M).

- **(W) 깨끗한 Widget 6종** (텍스트 안 엉킴 → 바로 leaf 승격): `carousel`, `glyph-grid`(title sr-only), `type-specimen`, `media-showcase`(텍스트 0, 최상), `type-scale`, `layout-grid`.
- **(M) 혼합 8종** (title/description을 Block Text로 빼면 Widget): `color-pairing`, `color-pairing-recommendation`, `color-palette`, `icon-grid`, `image-grid`(title+description), `stem-clear-space`, `logo-viewer`, `logo-group-viewer`. → 뒤 2개는 `topic.description`(탭별 가이드 산문)까지 엉켜 가장 지저분.
- **(T) Widget 아님 5종** (본질이 텍스트/다자식 컴포지션 → Block/Text 쪽): `callout`, `content-columns`, `do-dont`, `signature-showcase`, `spec-list`.

**Widget이 가질 수 있는 것**: 시각 소스(업로드/brand-* 조립/SVG·Canvas) + **시각 종속 per-item 캡션·라벨**(slide caption, variant label, cell caption, 색 hex, 아이콘 이름, 코드포인트, 메트릭 라벨) + 표시 config(ratio/columns/scale/select) + **비저장 클라 상태**(hover/tab/toggle/slider). **가질 수 없는 것**: 블록 레벨 title/heading/body/description(→ Block Text), author 규칙·산문 본체, 링크.

**핵심 결과:**
- **텍스트 갇힘의 정체 = 블록이 GuidelineHeader/Description을 내부에서 부르는 것 하나뿐.** 8개 M블록 전부 원인 동일. → 분리 레버가 단일·명확.
- **Link 필드는 19블록 어디에도 없음.** 목표 모델의 `Link` leaf는 **당장은 YAGNI** — 실제 필요 시 추가.
- 정적/인터랙티브 모두 "이미지 자리 = 단일 사각 슬롯" 등가. 등가 안 되는 예외 = T 5종(텍스트 본체 or 다자식 교차).
