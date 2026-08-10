# 11. 위젯 저작

가이드라인 페이지의 인터랙티브 콘텐츠는 **Widget**이 담당합니다. 이 문서는 새 위젯을 만들 때의 계약과 불변식을 정의합니다. 블록(Block)의 3파일 계약은 [06 §5](06-project-structure.md)에 있고, **위젯은 그 계약과 다릅니다.**

시각 토큰·컴포넌트 원형은 [09 디자인 시스템](09-design-system.md)·[10 컴포넌트 저작](10-component-authoring.md)을 먼저 읽습니다.

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

🔴 **`projection.ts`는 만들지 않습니다.** 블록 계약에는 있지만 위젯에는 없습니다(현재 위젯 23종 전부 없음). 카탈로그가 읽지 않는 파일이 됩니다.

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

- 🔴 **`checks/collect-guideline-check-sources.ts:71`의 이미지 수집 switch에 `'block'` case가 없습니다.** 그래서 Block›children 안의 위젯·이미지 leaf가 **AI 검수에 도달하지 못합니다.** `default: x satisfies never` 가드도 없어 위젯을 추가할 때마다 이미지 유실이 조용히 일어납니다. 새 위젯이 이미지를 갖는다면 이 switch를 함께 고쳐야 합니다.
- 구 flat 블록 19종과 신규 `block` 컨테이너가 **동시에** 문서에 등록돼 있습니다. 컨테이너로의 이행은 진행 중이며 구 블록은 아직 제거되지 않았습니다.
- 닫힌 토큰 규칙 위반이 위젯 5종에 남아 있습니다(생 팔레트 클래스). 새 위젯에서 반복하지 마십시오([10 §4](10-component-authoring.md)).
