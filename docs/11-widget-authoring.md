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
6. admin에서 Block 안에 넣어 실제 페이지로 확인
```

자동 카탈로그(`pnpm generate:block-catalogs`)는 **`blocks/`만 스캔합니다.** 위젯은 자동 등록되지 않고, CI의 `check:block-catalogs`도 위젯 등록 누락을 잡아주지 못합니다.

## 2. 폴더 계약

| 파일 | 역할 | 필수 |
|---|---|---|
`schema.ts` | Payload 필드 정의. 짧은 `dbName` 별칭 | ✅ |
`component.tsx` | 서버 컴포넌트. 관계 해석·URL 계산 후 뷰에 넘김 | ✅ |
`view.tsx` | 클라이언트 뷰. 인터랙션이 있을 때만 | 선택 |
`store.tsx` | 형제 위젯과 값을 공유할 때의 context | 선택 |
그 외 (`compositions.ts`·`samples.ts`·`rules.ts`·`images/`) | 데이터·규칙·에셋 분리 | 선택 |

🔴 **`projection.ts`는 만들지 않습니다.** 블록 계약에는 있지만 위젯에는 없습니다. 카탈로그가 읽지 않는 파일이 됩니다.

#### 브랜드 데이터가 비면 그리지 않습니다

브랜드 컬렉션(`brand-icons`·`brand-colors`·`brand-logos`…)을 조회하는 위젯은 결과가 비었을 때 **껍데기를 남기지 않고 `null`을 반환합니다.** 빈 그리드와 눌러도 반응 없는 컨트롤은 "규정이 없다"가 아니라 "고장났다"로 읽힙니다. 선례는 `stem-clear-space`("아무 로고나 집어 잘못된 브랜드를 보여주지 않는다")이고 `icon-grid`·`hd-color-palette`가 같은 처리를 따릅니다.

### 템플릿과 데이터를 파일로 가릅니다

`component.tsx`는 "어떻게 그리는가"만, 별 파일의 순수 데이터가 "무엇을 어디에"를 담습니다. **데이터에 JSX를 넣지 않습니다** — 넣으면 나중에 CMS로 옮길 수 없습니다. 조합이 늘어도 템플릿이 안 바뀌는 상태가 목표입니다.

에셋은 레지스트리 맵의 **키로 참조**합니다(`PHOTOS`·`CI_ART` 같은 맵). 그러면 조합이 문자열만으로 표현됩니다.

🔴 **schema가 참조하는 모듈에는 react·이미지 import를 넣지 마십시오.** `payload.config`는 Node에서 로드되므로 webp/svg import나 react가 섞이면 설정 로딩이 깨집니다. 그래서 조합 키·라벨과 규칙 상수를 별 파일로 뺍니다(`layout-grid/samples.ts`·`rules.ts`가 그 선례).

## 3. 등록 — 손으로 고치는 3곳

| 파일 | 무엇을 등록하나 |
|---|---|
`blocks/block/schema.ts` | `children` blocks 배열에 스키마 추가 (CMS 저작용) |
`blocks/block/component.tsx` | 렌더 디스패치에 분기 추가 |
`components/widgets/gallery.tsx` | `/guideline/widgets` 미리보기 목록 |

세 곳 중 하나만 빠뜨리면 조용히 실패합니다 — 스키마만 등록하면 admin에서 고를 수 있지만 화면이 비고, 갤러리만 등록하면 미리보기에서만 보입니다(`widgets/ci-lockup/`이 실제로 그 상태이며 `schema.ts`가 없어 CMS로 저작할 수 없습니다).

🔴 **`dbName`은 필수입니다.** 중첩 블록의 테이블명이 Postgres 식별자 63자 한계에 닿습니다(현재 정확히 63자인 인덱스명 11개·제약명 45개). 예: `clearspaceViewerWidget` → `dbName: 'cvw'`. enum은 `enumName`으로 전역 이름을 공유합니다.

## 4. Block과 Widget의 책임

**Block이 소유하는 것** — 전체폭 면(`background`)·배치 영역 면(`innerBackground`)·폭(`width`)·배치(`arrangement`·`columns`·`aspectRatio`)·제목·본문(`title`·`description`)·`rules`. 그리고 자식에게 값 스코프를 제공할 수 있습니다.

**Widget이 소유하는 것** — 자기 셀 안의 콘텐츠. **셀 안에서는 `w-full`과 배경색을 자유롭게 씁니다**(판형·스와치·패널의 면은 위젯 콘텐츠입니다). 금지는 Block의 전체폭 면과 폭 결정권을 가져가는 것입니다. 인터랙션 컨트롤은 유한 폭을 지키는 편이 낫습니다(`layout-grid-controls`가 `w-fit` + 슬라이더 고정폭으로 선례를 만들었습니다).

폭·표면색·세로 리듬은 프레임이 소유합니다 — 위젯은 자기 `max-width`를 갖지 않습니다([09 §7](09-design-system.md)).

### 🔴 rules는 Block에만 둡니다 (provenance 불변식)

`checks/collect-guideline-check-sources.ts`가 `document.blocks[].rules`만 훑고 **자식으로 내려가지 않습니다.** rules를 위젯으로 내리면 rule이 조용히 소멸합니다. 위젯은 rule·projection·evidence를 갖지 않습니다(표현 전용).

### 🔴 기계가 읽는 텍스트는 Block이 소유합니다

위젯·이미지는 **사람이 보는 표현**입니다. AI 챗·가이드라인 검색·검수가 읽는 평문은 Block의 `title`·`description`·`rules` 셋에서만 나옵니다. 그래서 위젯에 `projection.ts`를 만들지 않는 것(§2)이 누락이 아니라 계약입니다.

대신 **Block이 그 셋을 실제로 투영해야 합니다.** `blocks/block/projection.ts`가 한동안 `children` 수만 세고 `title`·`description`을 버려서, 사람이 admin에 쓴 글이 조회 계층에 도달하지 못했습니다(2026-08-10 수정, `projection.test.ts`가 지킵니다). 위젯을 늘려도 이 평문은 두꺼워지지 않으므로, 검색·챗에 걸려야 하는 설명은 Block의 본문에 씁니다.

### 값 공유는 Block이 provider

형제 위젯이 값을 공유해야 하면 **Block이 context provider가 됩니다**(`widgets/layout-grid/store.tsx` + `blocks/block/component.tsx`).

🔴 **모듈 스코프 스토어는 금지입니다.** 섹션 라우트가 여러 Page를 한 화면에 렌더하므로, 페이지마다 놓인 패널이 전부 같은 값을 물어 슬라이더 하나가 판형 12개를 함께 움직입니다(실측된 사고). `set`은 `useCallback`으로 안정화해 소비자가 effect 의존에 넣을 수 있게 합니다.

Block은 특정 자식을 헤더로 hoist할 수 있습니다 — 컨트롤 패널이 배치 셀을 차지하면 안 되므로 children에서 걸러 제목·설명 다음에 렌더합니다(`splitControls`).

### 인스턴스 오버라이드는 3형태 중에 고릅니다

①select(`shared|on|off`) ②boolean lock(공유 초기값에 고정) ③nullable 값(직접 입력).
우선순위는 **값 입력 > lock이면 초기값 > 공유 현재값**이고, 조절 허용 = 초기값 / 조절 불허 = 고정값입니다.

🔴 **lock 체크박스와 값 입력칸을 다른 위젯에 두지 마십시오** — 사용자가 "고정"을 켠 자리에서 그 값을 넣을 칸을 못 찾습니다.

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

- 🔴 **컨테이너 Block의 자식 위젯이 가진 이미지가 AI 검수에 도달하지 못합니다.** `checks/collect-guideline-check-sources.ts`의 이미지 수집 switch에는 `'block'` case가 생겼지만 그 맵은 조회용일 뿐이고, 실제로 어떤 이미지를 참조하는지 지목하는 `blocks/block/projection.ts`의 `projectBlock`이 아직 `referenceAssets: []`를 반환합니다(evidence도 `childCount` 자리표시자입니다). 위젯별 evidence 설계가 끝나야 그 case가 쓰입니다. 그 switch에는 `default: x satisfies never` 가드도 없어, 이미지를 갖는 위젯을 추가할 때 유실이 조용히 일어납니다.
- 구 flat 블록 18종은 2026-08-10에 삭제됐습니다. 문서에 배치할 수 있는 것은 `block` 컨테이너와 `content-columns`·`callout` 셋뿐이고, 나머지 시각 요소는 전부 컨테이너의 자식 위젯입니다.
- 닫힌 토큰 규칙 위반(생 팔레트 클래스)이 일부 위젯에 남아 있습니다. 개수를 여기 적지 않습니다 — 현재 목록은 [09 §4](09-design-system.md)의 grep으로 확인하십시오. 새 위젯에서 반복하지 마십시오([10 §4](10-component-authoring.md)).

## 8. 위젯 시각 어휘

위젯은 셀 안 콘텐츠를 자유롭게 그릴 수 있지만(§4), **반복되는 시각 요소는 발명하지 않고 공유합니다.** 같은 것을 위젯마다 다르게 만들면 한 페이지 안에서 표기가 갈립니다 — 실제로 그렇게 됐습니다.

| 어휘 | 규칙 |
| --- | --- |
| **전환 컨트롤** | 앱 프리미티브를 씁니다 — 설정 on/off는 `Switch`, 2~5개 선택은 `ToggleGroup`, 연속값은 `Slider`. 🔴 `Tabs`는 **패널 내비게이션일 때만**입니다. 같은 판을 다르게 그리는 설정 전환은 Tabs가 아닙니다.<br>하나 고르기는 `type="single"`(Radix가 `radiogroup`/`radio`로 렌더), 여러 개 고르기는 `type="multiple"`입니다 |
| **컨트롤의 이름** | 🔴 `Slider`의 이름·값 서술은 `aria-label`/`aria-labelledby`/`aria-valuetext`로 줍니다. `role="slider"`는 Root가 아니라 **손잡이**에 붙으므로 `<label>`로 감싸도 이어지지 않습니다(`Switch`도 같아서 `htmlFor`를 씁니다). 순번이 아니라 뜻이 읽혀야 하면 `aria-valuetext`로 덮습니다(예: `0·1·2` 대신 `Bold 700`) |
| **스펙 판독** | 수치를 읽어주는 줄. `font-mono` + `tabular-nums` + `text-xs` + `text-muted-foreground`. 규정이 범위인데 화면이 한 값을 그리면 **적용값을 함께 적습니다**(`행간 150–160% · 150% 적용`) |
| **캡션** | `font-body text-muted-foreground text-xs`. 상하 여백은 부모 스택의 `gap`이 소유하고 캡션이 자기 마진을 갖지 않습니다 |
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

캡션·수치처럼 판 **밖**에 있는 줄은 블록 면 위에 오므로 자기 색을 고르지 않습니다. 그 면의 스코프를 블록이 선언하고, 위젯은 공유 어휘(`WIDGET_CAPTION` 등)만 씁니다.

### Studio Controller 킷과의 관계

`src/components/studio/shared/controller/`에 도메인 무지 컨트롤 킷이 있습니다(`docs/10` §3.6). 어휘가 겹치지만 **위젯은 이 킷을 import하지 않습니다** — 판형 전제가 사이드바 패널이고, 소유가 Studio 표면이라 위젯이 그쪽 변경에 묶입니다.

그 킷은 Studio의 기능 개발을 위해 특수하게 만들어진 것이라, 재사용하면 **그쪽을 고칠 때마다 위젯이 함께 흔들립니다.**

🔴 **합칠 방향은 반대입니다.** 위젯 쪽에서 시각 어휘를 먼저 세우고, Studio의 기능 개발이 끝난 뒤 그쪽이 이 어휘로 옮겨옵니다(2026-08-12 결정). 그때까지는 **상태 어휘만 맞춰** 두 표면이 나중에 만날 수 있게 합니다(`ControllerAvailability`의 `enabled`/`readonly`/`disabled` 구분 등).
