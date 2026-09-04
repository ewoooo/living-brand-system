# 11. 위젯 저작

가이드라인 페이지의 인터랙티브 콘텐츠는 **Widget**이 담당합니다. 이 문서는 새 위젯을 만들 때의 계약과 불변식을 정의합니다. 블록(Block)의 3파일 계약은 [06 §5](06-project-structure.md)에 있고, **위젯은 그 계약과 다릅니다.**

시각 토큰·프런트엔드 스택은 [09 디자인 시스템](09-design-system.md), 컴포넌트 저작 계약은 [10 컴포넌트 저작](10-component-authoring.md)을 먼저 읽습니다.

## 1. 새 위젯 만드는 순서

```
1. src/features/guideline/widgets/<kebab-name>/ 생성
2. schema.ts 작성 — 짧은 dbName 필수
3. component.tsx 작성 (서버). 인터랙션이 있으면 view.tsx 추가 (클라이언트)
4. 등록 3곳을 손으로 고친다 (§3)
5. /guideline/widgets 에서 렌더 확인
6. admin에서 섹션 안에 넣어 실제 페이지로 확인
```

자동 카탈로그(`pnpm generate:block-catalogs`)는 **`blocks/`만 스캔합니다.** 위젯은 자동 등록되지 않고, CI의 `check:block-catalogs`도 위젯 등록 누락을 잡아주지 못합니다.

## 2. 폴더 계약

| 파일 | 역할 | 필수 |
|---|---|---|
`schema.ts` | Payload 필드 정의. 짧은 `dbName` 별칭 | ✅ |
`component.tsx` | 서버 컴포넌트. 관계 해석·URL 계산 후 뷰에 넘김 | ✅ |
`view.tsx` | 클라이언트 뷰. 인터랙션이 있을 때만 | 선택 |
`manifest.ts` | 이 위젯이 여는 **컨트롤 계약** — 범위·초기값·단위·프리미티브 종류(§4.1) | 선택 |
그 외 (`compositions.ts`·`samples.ts`·`images/`) | 데이터·에셋 분리 | 선택 |

🔴 **`projection.ts`는 만들지 않습니다.** 블록 계약에는 있지만 위젯에는 없습니다. 카탈로그가 읽지 않는 파일이 됩니다.

#### 서버에서 할 일이 없으면 `component.tsx`가 곧 클라이언트입니다

`component.tsx`를 서버로 두는 이유는 **관계 해석·URL 계산**을 서버에서 끝내기 위한 것입니다. 그 일이 없는 위젯 — 정적 데이터나 형제 공유 context만 읽는 위젯 — 은 `component.tsx`에 `'use client'`를 달고 `view.tsx`를 두지 않습니다. 빈 서버 래퍼를 한 겹 더 만드는 것은 계약을 지키는 것이 아니라 껍데기를 늘리는 것입니다.

현재 그런 위젯은 `layout-grid`·`type-specimen` 둘입니다. 🔴 **이 문단이 없으면 다음 사람이 이것을 계약 위반으로 보고 빈 래퍼를 세 개 만듭니다** — 반대로, Payload 관계를 받는 위젯이 `'use client'`를 달고 있으면 그것은 진짜 위반입니다.

#### 브랜드 데이터가 비면 그리지 않습니다

브랜드 컬렉션(`brand-icons`·`brand-colors`·`brand-logos`…)을 조회하는 위젯은 결과가 비었을 때 **껍데기를 남기지 않고 `null`을 반환합니다.** 빈 그리드와 눌러도 반응 없는 컨트롤은 "규정이 없다"가 아니라 "고장났다"로 읽힙니다. 선례는 `stem-clear-space`("아무 로고나 집어 잘못된 브랜드를 보여주지 않는다")이고 `icon-grid`·`hd-color-palette`가 같은 처리를 따릅니다.

### 템플릿과 데이터를 파일로 가릅니다

`component.tsx`는 "어떻게 그리는가"만, 별 파일의 순수 데이터가 "무엇을 어디에"를 담습니다. **데이터에 JSX를 넣지 않습니다** — 넣으면 나중에 CMS로 옮길 수 없습니다. 조합이 늘어도 템플릿이 안 바뀌는 상태가 목표입니다.

에셋은 레지스트리 맵의 **키로 참조**합니다(`PHOTOS`·`CI_ART` 같은 맵). 그러면 조합이 문자열만으로 표현됩니다.

🔴 **schema가 참조하는 모듈에는 react·이미지 import를 넣지 마십시오.** `payload.config`는 Node에서 로드되므로 webp/svg import나 react가 섞이면 설정 로딩이 깨집니다. 그래서 조합 키·라벨과 규칙 상수를 별 파일로 뺍니다(`layout-grid/samples.ts`·`manifest.ts`가 그 선례 — 매니페스트는 타입만 `import type`으로 가져옵니다).

## 3. 등록 — 손으로 고치는 3곳

| 파일 | 무엇을 등록하나 |
|---|---|
`leaves/registry.ts` | **`LEAVES` 배열**에 스키마 추가 (CMS 저작용). 공통 `span` 필드는 여기서 붙는다 |
`leaves/render-leaf.tsx` | 렌더 디스패치에 분기 추가 |
`components/widgets/gallery.tsx` | `/guideline/widgets` 미리보기 목록 |
`controllers/registry.ts` | (컨트롤러를 여는 위젯만) `blockType` → 매니페스트 (§4.1) |

세 곳 중 하나만 빠뜨리면 조용히 실패합니다 — 스키마만 등록하면 admin에서 고를 수 있지만 화면이 비고, 갤러리만 등록하면 미리보기에서만 보입니다.

🔴 **`dbName`은 필수입니다.** 중첩 블록의 이름이 길어지면 Postgres 식별자 63자 한계에 닿습니다. 예: `clearspaceViewerWidget` → `dbName: 'cvw'`. enum은 `enumName`으로 전역 이름을 공유합니다.

한계에 실제로 닿는 것은 **FK 제약명**입니다. 최신 드리즐 스냅샷 실측으로 66~93자 제약명이 6개 있고(최장 90자대), 인덱스명은 최장 62자로 아직 아래에 있습니다. 🔴 **여기에 개수를 적어 두지 마십시오** — 스키마가 바뀔 때마다 낡습니다. 지금 값은 `migrations/`의 최신 `.json` 스냅샷에서 세십시오.

이 한계는 `leaves/alias-length.test.ts`가 막고 있지만 **갤러리 통과 ≠ 페이지 통과**입니다 — 잘림은 조회 SQL의 별칭에서 일어납니다.

## 4. Section과 Widget의 책임

**Section이 소유하는 것** — 앵커·제목·설명(`anchor`·`title`·`description`)·`rules`, 그리고 leaf 목록(`children`). 자식에게 컨트롤 값 스코프를 제공합니다. 🔴 **폭과 면은 갖지 않습니다** — 폭은 leaf의 `span`이 말하고, 배경 설정은 2026-09-04에 전 계층에서 걷었습니다.

**leaf가 소유하는 것** — 자기 폭(`span`: 전폭·절반·삼분). 6열 격자에 얹혀 줄바꿈이 폭에서 나오므로 행(블록)이라는 층이 없습니다(`blocks/shared/rhythm.ts`).

중첩은 **한 겹**입니다: `section` > leaf. 위젯은 잎이라 다른 위젯을 품지 않습니다. 🔴 **자기 참조 블록은 만들 수 없습니다** — Payload 스키마 생성기가 무한 재귀에 빠집니다. 옛 `block`·`subBlock` 층은 쓰이지 않아 2026-09-04에 지웠습니다. 위젯 여럿을 한 판으로 묶어야 하는 요구가 생기면 그때 slug 하나로 층을 다시 세웁니다.

**Widget이 소유하는 것** — 자기 셀 안의 콘텐츠. **셀 안에서는 `w-full`과 배경색을 자유롭게 씁니다**(판형·스와치·패널의 면은 위젯 콘텐츠입니다). 금지는 섹션의 폭 결정권을 가져가는 것입니다. 인터랙션 컨트롤의 폭은 위젯이 아니라 컨트롤러 킷이 갖습니다(§4.1).

폭·세로 리듬은 프레임과 격자가 소유합니다 — 위젯은 자기 `max-width`를 갖지 않습니다([09 §7](09-design-system.md)).

### 🔴 rules는 Section에만 둡니다 (provenance 불변식)

`checks/collect-guideline-check-sources.ts`가 `document.blocks[].rules`(섹션)만 훑고 **leaf로 내려가지 않습니다.** rules를 위젯으로 내리면 rule이 조용히 소멸합니다. 위젯은 rule·projection·evidence를 갖지 않습니다(표현 전용).

### 🔴 기계가 읽는 텍스트는 Section이 소유합니다

위젯·이미지는 **사람이 보는 표현**입니다. AI 챗·가이드라인 검색·검수가 읽는 평문은 Section의 `title`·`description`·`rules` 셋에서만 나옵니다. 그래서 위젯에 `projection.ts`를 만들지 않는 것(§2)이 누락이 아니라 계약입니다.

대신 **Section이 그 셋을 실제로 투영해야 합니다.** 옛 `blocks/block/projection.ts`가 한동안 `children` 수만 세고 `title`·`description`을 버려서, 사람이 admin에 쓴 글이 조회 계층에 도달하지 못했습니다(2026-08-10 수정, `projection.test.ts`가 지킵니다). 위젯을 늘려도 이 평문은 두꺼워지지 않으므로, 검색·챗에 걸려야 하는 설명은 Section의 본문에 씁니다.

### 값 공유는 Section이 provider

형제 위젯이 값을 공유해야 하면 **Section이 context provider가 됩니다**(`controllers/provider.tsx` + `blocks/section/component.tsx`). 한 섹션의 판형들이 슬라이더 하나를 공유합니다. 위젯이 자기 스토어를 따로 만들지 않습니다 — 공유 값은 전부 컨트롤러 계약을 탑니다(§4.1).

🔴 **모듈 스코프 스토어는 금지입니다.** 토픽 라우트가 여러 섹션을 한 화면에 렌더하므로, 섹션마다 놓인 패널이 전부 같은 값을 물어 슬라이더 하나가 판형 12개를 함께 움직입니다(실측된 사고). `set`은 `useCallback`으로 안정화해 소비자가 effect 의존에 넣을 수 있게 합니다.

Section은 특정 leaf를 격자에서 걷어내 **다른 자리에 렌더**할 수 있습니다 — 컨트롤 패널이 배치 셀을 차지하면 안 되기 때문입니다(`splitControls`). 지금 그 자리는 화면 하단의 **Floating Controller**입니다(§4.1).

### 4.1 컨트롤은 매니페스트가 정하고 하단 Floating Controller에 뜹니다

🔴 **컨트롤을 그리는 위젯을 만들지 마십시오.** 위젯은 `manifest.ts`로 **무엇을 조절할 수 있는지만 선언**하고, 그것을 화면에 그리는 일은 도메인 무지 렌더러가 합니다. 스튜디오와 같은 3단입니다.

```
manifest.ts        →  GuidelineControllerScope   →  GuidelineControllerPill
어떤 컨트롤이 있나      지금 값이 뭔가                 kind만 보고 프리미티브를 고름
범위·초기값·단위        onChange(controlId, value)
```

**세 방향이 서로를 모릅니다.** 블록 렌더러는 어떤 위젯이 컨트롤러인지 모르고(레지스트리에 물어봅니다), 컨트롤러 기계는 `marginPct`가 마진인지 모릅니다. 위젯은 값을 **읽기만** 합니다(`useGuidelineController`) — 컨트롤을 그리거나 스코프를 만들지 않습니다.

| 누가 | 무엇을 | 🔴 모르는 것 |
| --- | --- | --- |
| `widgets/<name>/manifest.ts` | 이 블록이 여는 컨트롤 계약 | 화면 어디에 그려지는지 |
| `controllers/registry.ts` | `blockType` → 매니페스트 + admin 값→제한 변환 | — (양쪽을 아는 **유일한** 자리) |
| `controllers/provider.tsx` | 블록 단위 값 스코프 | 값의 뜻 |
| `controllers/pill.tsx` | 그룹을 구분선으로 가른 한 줄 배치 | 도메인 |
| `GuidelineHelperProvider` | 관측(IntersectionObserver)과 "누가 활성인가" | **값** |
| `GuidelineHelperRegion` | 블록이 선언하는 **관측 영역** = 조작 대상이 놓인 면(제목·본문 아님) | 컨트롤이 무엇인지 |
| `GuidelineHelperSlot` | 알약이 앉는 **자리 상자**(`absolute inset-0`인 세로 flex 열). sticky는 바가 갖는다 | 무엇이 들어오는지 |

#### 🔑 한 블록에 판을 여럿 두려면 「뺀 축만 자기 값」

컨트롤러 스코프는 **블록당 하나**이고 제한은 **첫 컨트롤러 자식**에서만 나옵니다. 값도 하나이므로 같은 블록의 두 위젯이 같은 축을 읽으면 값이 공유됩니다. 그래서 규칙 하나로 가릅니다 — **`hiddenControls`로 뺀 축이면 자기 인스턴스 값, 아니면 알약 값**(`ci-lockup/view.tsx`의 `pick`).

- 알약에 남은 축 → 판들이 **함께** 움직입니다(배율·표시 전환처럼 지면 전체에 걸리는 것).
- 뺀 축 → 판마다 **자기 값**에 머뭅니다(꼴·색상 표현처럼 그 판이 무엇인지 정하는 것).

그래서 정본 지면 구성이 그대로 나옵니다: 가로형·세로형을 수평 병행, 표현 3종을 나란히. `layout-grid`는 같은 문제를 `override ?? 값`과 lock 플래그로 풉니다(`docs/11` 인스턴스 오버라이드 3형태).

🔴 **dispatch가 인스턴스 필드를 props로 넘기지 않으면 두 번째 판의 admin 값이 조용히 버려집니다.** `leaves/render-leaf.tsx`의 case마다 `leaf.<필드>`를 넘겨야 합니다 — 에러도 경고도 없이 「저장했는데 안 바뀐다」로 나타납니다.

🔴 **`select` 초기값이 options에 없으면 렌더가 던져 페이지가 죽습니다.** 선택지를 데이터에서 파생하는 위젯은 registry에서 값의 유효성을 확인하고 버려야 합니다(`ci-lockup`의 `usable`).

#### 타입 계약은 새로 만들지 않고 받아씁니다

`ControllerControlDefinition`(`modules/studio-controller/controller-definition.ts`)이 `kind`·`min`·`max`·`step`·`defaultValue`·`display.unit`을 이미 갖고, `ControllerControlRenderer`가 그것을 그립니다. 🔴 **여기서 같은 어휘를 다시 정의하면 스튜디오와 가이드라인의 컨트롤이 조용히 갈라집니다.**

#### admin은 **좁히기만** 합니다 (2단)

매니페스트가 정본 범위이고, admin 위젯의 값은 `ControllerControlRestriction`으로 접혀 그 범위를 좁힙니다 — 값이 있으면 `defaultValue`를 덮고, 조절 불허는 `readonly`가 됩니다. `applyControllerRestrictions`가 **넓히려 들면 던지므로**, admin이 브랜드 규정 밖 값을 심을 수 없습니다(`controllers/registry.test.ts`가 지킵니다).

#### 바 표면은 하나입니다

`ControllerBar`(`components/shared/controller/bar.tsx`) 하나가 스튜디오와 가이드라인의 하단 바를 모두 그립니다. 다른 것은 `placement` 하나뿐이고 **둘 다 자기 위치를 자기가 잡습니다**(`canvas`=absolute / `scroll`=sticky).

🔴 **표면을 새로 만들지 마십시오.** 한때 `Fixed`/`Sticky` 두 컴포넌트였는데, 접미사는 "붙는 방식만 다르다"고 약속해 놓고 실제로는 모서리·패딩·면·모바일·pointer-events·모션까지 6가지가 갈라져 있었습니다(2026-08-18에 합침). 이름이 거짓말을 하면 다음 사람이 둘 중 아무거나 고릅니다.

🔴 알약 안의 컨트롤에는 **최소폭**을 줍니다(`min-w-[150px]`). 없으면 값이 바뀔 때마다 컨트롤이 늘었다 줄었다 하고 이웃까지 함께 움직입니다. 고정폭이 아닌 이유는 라벨 길이가 컨트롤마다 다르기 때문입니다.

🔴 알약은 `readonly` 컨트롤을 **싣지 않습니다.** 떠 있는 바에 못 만지는 줄이 끼면 폭만 먹고, 고정된 값은 그림 자체가 보여줍니다. 값은 그대로 남으므로 판형은 고정값으로 그려집니다.

🔴 Payload checkbox의 **미설정(`undefined`)과 `false`를 가르십시오.** 저장 전 checkbox는 `undefined`로 오고 그때의 기본은 **허용**입니다. `?? true`로 접지 않으면 새 블록의 컨트롤이 전부 잠깁니다.

🔴 **바에 값을 올리지 마십시오.** 화면에 바는 하나뿐이라, 바가 값을 중계하는 순간 블록마다 다른 값이 하나로 합쳐져 슬라이더 하나가 여러 블록의 판형을 함께 움직입니다(2026-08-04에 12개가 함께 움직인 사고와 같은 형태). 컨트롤은 자기 블록의 React 트리 안에서 렌더되고 **DOM만** portal로 내려갑니다 — context는 트리를 따라가므로 스코프가 유지됩니다.

관측 root는 뷰포트가 아니라 `[data-slot="section-scroll-container"]`입니다. 본문이 중첩 스크롤 안에 있어 root를 비우면 교차 판정이 어긋납니다. 활성은 **보이는 면적이 가장 큰** 영역이고(비율이 아닙니다 — 비율로 재면 화면에 꽉 찬 큰 판형이 구석에 다 보이는 작은 판형에게 집니다), 동률이면 문서 순서가 앞선 쪽입니다. 규칙은 `guideline-active-region.ts`가 소유하고 그 옆 테스트가 지킵니다.

### 인스턴스 오버라이드는 2형태 중에 고릅니다

①select(`shared|on|off`) — boolean처럼 값이 유한할 때. ②nullable 값(직접 입력) — 연속값일 때.
우선순위는 **값 입력 > 공유 현재값**이고, 조절 허용 = 초기값 / 조절 불허 = 고정값입니다.

🔴 **세 번째 형태(boolean lock — "값은 안 적고 공유 초기값에 붙어 있어라")를 다시 만들지 마십시오.**
2026-08-04에 `layout-grid`에 넣었고 2026-08-19에 걷어냈습니다. 지운 이유는 취향이 아니라 **실측**입니다 —
lock을 켠 12행 중 6건이 전부 같은 행에 값 입력까지 갖고 있어서, `override ?? …`가 먼저 끝나 lock이
유효하게 동작한 행이 **0건**이었습니다. admin에서 값 칸과 체크박스가 나란히 보이면 사람은 둘 다 켭니다.

lock의 유일한 값어치는 "admin이 패널 초기값을 나중에 바꾸면 따라온다"인데, 그것이 필요하면 값 칸을
비워 공유 현재값을 따르게 하면 됩니다. 그래서 `provider.tsx`는 `defaults`를 **컨텍스트로 내보내지
않습니다** — 소비자가 매니페스트 초기값에 머물 이유가 없어졌습니다.

## 5. 크기와 스타일

크기 단위는 컨테이너 기준(`cqw`·`cqh`·`cqmax`)을 씁니다. 판형 크기와 무관하게 같은 그림이 나옵니다. 축을 안 가리려면 `cqmax`(긴 축의 1%)를 쓰십시오 — `%`는 축마다 기준이 달라(padding·width는 폭, top/bottom은 높이) 마진이 갈라집니다. 컨테이너에 `containerType: 'size'`가 필요합니다.

규칙 수치는 상수 한 곳에 두고 슬라이더 min/max와 admin 검증이 같은 상수를 읽게 합니다. **브랜드 규정 수치는 눈대중으로 고치지 마십시오** — 어디서 온 규정인지(문서·구두)를 주석에 함께 적습니다.

## 6. 🔴 함정 (전부 실제로 밟은 것)

| 함정 | 증상 | 해법 |
|---|---|---|
svg static import | `src="[object Object]"` | import 결과는 `StaticImageData` 객체입니다. `.src`를 쓰십시오 |
무손실 webp | `unable to decode image data` | Turbopack이 VP8L을 못 읽습니다. 손실(VP8)로 저장하거나 `public/`에 두고 URL로 참조 |
`Nfr` 트랙 | 1:2:3 비율이 깨짐 | `Nfr`은 `minmax(auto, Nfr)`입니다. **`minmax(0, Nfr)`** 로 쓰십시오 |
preflight `img{max-width:100%}` | `width:320%`가 셀 폭으로 되돌아감 | 이미지에 `max-w-none` |
`outline` | 이웃 셀 경계선이 두꺼워짐 | outline은 박스 밖에 그려집니다. `outline-offset: -0.5px` |
cap height 가정 | 큰 글자 아래가 잘림 | 둥근 대문자는 베이스라인 아래로 넘칩니다. canvas `actualBoundingBox*`로 실제 잉크 경계를 재십시오 |
알파 누적 | 겹치는 부분만 진해짐 | 밴드에 알파를 주지 말고 **그룹째로** 투명하게 |
중첩 블록 행 | 블록을 지웠는데 위젯 행이 남음 | 중첩 행은 cascade 삭제되지 않습니다. 부모 행 유무로 고아를 확인하십시오 |
`.next` 타입 생성물 | 없는 라우트를 참조하며 typecheck 실패 | `.next/dev/types/validator.ts`만 지우십시오(전체 삭제는 dev를 망칩니다) |

## 7. 알려진 결함

- ✅ **섹션의 자식 위젯 이미지는 AI 검수에 넣지 않습니다 — 결함이 아니라 결정입니다**(2026-08-12). 기계(AI 챗·검색·검수)가 읽는 것은 섹션이 소유한 title·description·rule 셋뿐이고, 자식 위젯과 그 이미지는 사람이 보는 표현입니다(§4). 그래서 `blocks/section/projection.ts`는 `referenceAssets: []`를 돌려주고, `checks/collect-guideline-check-sources.ts`도 leaf 이미지를 모으지 않습니다. 🔴 **위젯별 projection을 만들어 이 경로를 "복구"하지 마십시오.**
- 구 flat 블록 18종은 2026-08-10에, 한 번도 쓰이지 않은 `content-columns`·`callout`·`subBlock`은 2026-09-04에 삭제됐습니다. 같은 날 블록 층(`block`) 자체도 걷어 **섹션이 leaf(이미지·위젯)를 직접 품습니다.** 토픽에 배치할 수 있는 것은 `section` 하나이고, 나머지 시각 요소는 전부 섹션의 자식 leaf입니다. 동결된 CheckSession 스냅샷에 남은 옛 근거는 `checks/format-check-evidence.ts`가 읽기만 합니다.
- 🔴 **CI 락업 도판의 치수 라벨이 H를 따라오지 않습니다.** 라벨 글자는 고정 크기(`text-xs`)라 좁은 간격 트랙에서 서로를 지우고(해외지사 가로형A에서 기본 H=100에도 인접 라벨이 겹칩니다), 게이지 라벨의 오프셋도 고정 px이라 H를 낮추면 치수선에 붙고 높이면 멀어집니다. 라벨을 H 배수로 조판하거나 겹칠 때 자리를 옮기는 규칙이 필요합니다(`ci-lockup/diagram.tsx`).
- 🔴 **CI 락업의 치수 도판에서, 셀 안에 가운데 정렬된 글자·심볼이 셀 폭이 바뀔 때 그 절반만큼 순간이동합니다.** 세로형에서 드러납니다. 도판은 요소의 이동을 FLIP으로 잇는데 기준이 **셀 상자**이고, 상자 안의 내용은 상자 폭에서 파생된 자리에 놓이므로 상자만 되돌려서는 내용이 제자리에 오지 않습니다. 고치려면 잉크를 기준으로 재야 하고, 그러려면 셀을 꽉 채우는 래퍼를 없애 상자가 곧 잉크가 되게 해야 합니다(`ci-lockup/diagram.tsx`).
- 🔴 **CI 락업의 치수 도판을 키보드로 열 수 없습니다.** hover(pointer)로만 열립니다. focus로 열면 도판이 내보내기 버튼을 판에서 밀어내는데, 그 버튼이 곧 포커스를 쥔 요소라 포커스가 body로 튑니다. 여는 길과 내보내기 자리를 겹치지 않게 다시 잡아야 풀립니다(`ci-lockup/view.tsx`).
- 🔴 **치수를 가진 판에서는 SVG 내보내기를 할 수 없습니다.** hover가 도판을 부르는 순간 락업이 판에서 빠지므로 버튼이 뜰 창이 없습니다. 로고를 받는 자리는 치수 없는 판(색상 변형)입니다.
- 닫힌 토큰 규칙 위반(생 팔레트 클래스)이 일부 위젯에 남아 있습니다. 개수를 여기 적지 않습니다 — 현재 목록은 [09 §4](09-design-system.md)의 grep으로 확인하십시오. 새 위젯에서 반복하지 마십시오([10 §4](10-component-authoring.md)).

## 8. 위젯 시각 어휘

위젯은 셀 안 콘텐츠를 자유롭게 그릴 수 있지만(§4), **반복되는 시각 요소는 발명하지 않고 공유합니다.** 같은 것을 위젯마다 다르게 만들면 한 페이지 안에서 표기가 갈립니다 — 실제로 그렇게 됐습니다.

| 어휘 | 규칙 |
| --- | --- |
| **전환 컨트롤** | 앱 프리미티브를 씁니다 — 설정 on/off는 `Switch`, 2~5개 선택은 `ToggleGroup`, 연속값은 `Slider`.<br>🔴 **예외: 하단 Floating Controller 안(§4.1)에서는 Controller 킷이 이깁니다** — 연속값은 `ControllerRange`, on/off는 `ControllerSegmented`입니다. 알약은 폭이 좁고 라벨이 한 번만 쓰이는 자리라 `Switch`의 "무엇이 켜졌나"를 글로 다시 적을 여백이 없고, 세그먼트는 두 상태를 라벨로 직접 보여줍니다(Figma HD_LBS_UI 61:4693). 알약 밖에서는 앱 프리미티브가 그대로입니다. 🔴 `Tabs`는 **패널 내비게이션일 때만**입니다. 같은 판을 다르게 그리는 설정 전환은 Tabs가 아닙니다.<br>하나 고르기는 `type="single"`(Radix가 `radiogroup`/`radio`로 렌더), 여러 개 고르기는 `type="multiple"`입니다.<br>**모양도 그 구분을 따릅니다** — 하나 고르기는 `spacing={0}`으로 **붙은 한 덩어리**(바깥 두 끝만 둥글고 안쪽 이음새는 각짐), 여러 개 고르는 필터는 **낱개로 띄웁니다**. 같은 판을 전환하는 것과 조건을 켜고 끄는 것은 다른 일이고, 그 차이가 눈에 보여야 합니다 |
| **컨트롤의 이름** | 🔴 `Slider`의 이름·값 서술은 `aria-label`/`aria-labelledby`/`aria-valuetext`로 줍니다. `role="slider"`는 Root가 아니라 **손잡이**에 붙으므로 `<label>`로 감싸도 이어지지 않습니다(`Switch`도 같아서 `htmlFor`를 씁니다). 순번이 아니라 뜻이 읽혀야 하면 `aria-valuetext`로 덮습니다(예: `0·1·2` 대신 `Bold 700`) |
| **스펙 판독** | 수치를 읽어주는 줄. `font-mono` + `tabular-nums` + `text-xs` + `text-muted-foreground`. 규정이 범위인데 화면이 한 값을 그리면 **적용값을 함께 적습니다**(`행간 150–160% · 150% 적용`).<br>🔴 **판 안에서만 씁니다** — 아래 「위젯은 판만 그립니다」를 보십시오 |
| **캡션** | 🔴 **쓰지 않습니다.** 아래 「위젯은 판만 그립니다」가 이 자리를 대신합니다. `WIDGET_CAPTION`은 아직 지우지 않은 예외 하나(`layout-grid`의 admin `caption` 필드)를 위해 남아 있습니다 |
| **판정 표식** | 상태 토큰만(`text-destructive` 등, `docs/09` §4). 생 팔레트로 위반을 칠하지 않습니다 |
| **hairline 격자** | `widgets/hairline.ts`의 `HAIRLINE_GRID`/`HAIRLINE_CELL` |

### 표본 면은 두 종류이고, 어느 쪽인지 **선언**합니다

로고·서체가 얹히는 면은 목적에 따라 테마를 따르기도 하고 따르지 않기도 합니다. 위젯마다 다르게 구현돼 있었고, 한 위젯 안에서 둘을 섞은 사례도 있었습니다.

| 종류 | 언제 | 다크 모드 |
| --- | --- | --- |
| **테마 면** | 위젯 UI의 배경·패널 | 따라갑니다. 시맨틱 토큰(`bg-background`·`bg-muted`) |
| **브랜드 면** | 로고·서체 **표본이 얹히는 판** | **고정합니다.** 흰 배경/검은 배경은 규정의 일부라 앱 테마를 따르면 표본이 거짓이 됩니다 |

🔴 브랜드 면은 `docs/09` §4의 "색을 데이터로 다루는 컴포넌트" 예외에 해당합니다. 다만 **예외라는 사실을 코드에 남깁니다** — 어느 쪽인지 이름 붙이지 않으면 다음 사람이 토큰 위반으로 보고 "고칩니다".

그 이름이 사는 자리는 `widgets/surface.ts` 하나입니다(`hairline.ts`·`readout.ts`와 같은 형태). 위젯은 생 팔레트를 직접 쓰지 않고 거기서 가져옵니다. `widgets/visual-vocabulary.test.ts`가 그 파일만 예외로 두고 나머지를 막으며, 위젯에서 `dark:` 분기도 함께 막습니다 — 블록 면이 토큰 스코프를 다시 선언하는 것과 `dark:`가 어긋나기 때문입니다(`docs/09` §5).

### 규정을 겹쳐 보이는 두 방식 — 얹기와 갈아치우기

같은 「규정을 보여준다」라도 **판을 어떻게 건드리는지**가 다르고, 그 차이가 곧 컨트롤의 자리를 정합니다. CI 락업이 그 사례입니다(사용자 지정 2026-08-20).

| | 클리어스페이스(여백) | 치수(간격) |
| --- | --- | --- |
| 판에 하는 일 | 락업 **위에 얹힙니다** | 판을 **갈아치웁니다**(도판으로 재조판) |
| 모드 | 셋 — 없음·기본·예외 | 0/1 |
| 자리 | 하단 Floating Controller | **hover** |

🔴 **판을 갈아치우는 표시는 컨트롤로 두지 않습니다.** 알약 토글은 아무도 누르지 않고 자리만 먹고, 늘 켜 두면 그 판이 로고가 아니라 계측기로 읽힙니다. hover가 소유하고, admin 값은 「hover하면 낼 판인가」라는 저작 결정만 남깁니다.

🔴 **얹히는 표시는 hover로 두지 않습니다.** 모드가 여럿이면 hover가 어느 모드를 뜻하는지 표현할 수 없습니다.

🔴 hover는 CSS로 못 합니다 — 보이고 숨는 것이 아니라 **다른 트리로 교체**되므로 pointer 이벤트 + state입니다.

### 위젯은 판만 그립니다

🔴 **위젯이 렌더하는 것은 판(canvas) 하나뿐입니다.** 판 **밖**에 붙는 줄 — 사용법 안내("끌어 보세요"), 지금 보고 있는 것의 이름, 규격 나열, 출처, 경고 — 을 **위젯이 그리지 않습니다.**

사용자 지정(2026-08-20): 「위젯은 이미지와 같아서 해당 판 = canvas만 보이면 끝이야.」

- 판 **안**의 글자는 이 규칙이 아닙니다 — 표본 셀의 머리글, 도판의 치수 라벨처럼 **그림의 일부**인 것은 그대로 그립니다.
- 컨트롤의 라벨·현재값도 아닙니다 — 그것은 컨트롤이 소유하고, 자리는 하단 Floating Controller입니다(§4.1).
- 설명이 필요하면 **블록이 씁니다.** 위젯 위아래의 산문은 admin이 넣는 블록 콘텐츠이지 위젯 코드가 아닙니다.
- 조작 방법을 글로 적어야 이해되는 위젯이면, 고칠 것은 캡션이 아니라 **어포던스**입니다.

남은 예외 둘(둘 다 값 결정이 필요해 손대지 않았습니다):
- `layout-grid`의 `caption` — admin 필드라 지우려면 스키마 변경 + 마이그레이션이 따라옵니다.
- `stem-clear-space`의 실측 A 판독과 `type-language`의 서체 폴백 경고 — 캡션이 아니라 위젯의 출력·경고입니다. 판 안으로 옮길지 지울지가 남아 있습니다.

### Studio Controller 킷을 씁니다

`src/components/shared/controller/`의 도메인 무지 컨트롤 킷(`docs/10` §3.6)을 **위젯도 그대로 import합니다.** 하단 Floating Controller(§4.1)에 놓이는 컨트롤은 킷의 프리미티브가 그립니다.

| Figma 부품 | 킷 |
| --- | --- |
| `Value Range` | `ControllerRange` |
| `Toggle`의 라벨 + 판 | `ControllerRow` |
| `Toggle Group` | `ControllerSegmented` |

🔴 **여기서 같은 것을 다시 만들지 마십시오.** Figma에서 가이드라인의 `Helper`와 스튜디오의 `Controller API`(4:5578)는 부품 이름이 같은 **한 계열**입니다 — 코드에서 갈라 두면 한쪽만 고쳐지고 한 화면 안에서 표기가 갈립니다. 2026-08-18에 실제로 `ControllerRange`와 거의 같은 것을 위젯 쪽에 새로 만들었다가 되돌렸습니다(그쪽에만 있던 것: 드래그 중 `scaleX` 채움, 클릭 시 스프링 이동, 조작 중에만 나타나는 핸들, `useReducedMotion`).

**2026-08-12의 반대 방향 결정은 폐기했습니다.** 그 근거는 "킷의 판형 전제가 사이드바 패널"이었는데, 지금은 두 표면 모두 하단에 떠 있는 바라 전제가 성립하지 않습니다.

🔴 **킷을 고칠 때는 두 소비자(Studio·가이드라인)를 함께 봅니다.** `components/studio/` 밑에 있던 것을 `components/shared/`로 옮긴 이유가 그것입니다 — 자리가 소유자를 말합니다.

킷에 없는 것만 앱 프리미티브에서 가져옵니다(구분선은 `components/ui/separator`).
