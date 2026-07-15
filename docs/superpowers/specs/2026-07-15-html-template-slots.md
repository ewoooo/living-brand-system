# HTML 템플릿 입력 슬롯 스펙

2026-07-15. Figma HTML 임포트 템플릿(사원 카드 등)에 노드 단위 입력 슬롯을 열고,
유저(Create) 화면의 벡터 미표시 버그를 함께 해소한다.

## 배경 진단

템플릿은 두 경로로 서빙된다(`get-published-template.service.ts` — Figma HTML 우선).
슬롯·입력 스펙·AI 안내 계약은 JSON 경로(`json-template.ts`)에만 있고 HTML 경로에는 없다.

| 증상 | 원인 |
| --- | --- |
| 유저 화면에서 벡터(로고) 미표시 | `vectorColor` 오버라이드가 `<img>`를 `mask-image` div로 교체하는데, CSS mask는 CORS 모드 fetch다. 유저 미리보기가 `<iframe sandbox="">`(opaque origin)라 ACAO 헤더 없는 `/api/brand-logos/file/*` 로드가 차단되고, 실패한 mask는 전체 투명 처리된다. 어드민은 동일-문서 렌더(same-origin)라 정상. |
| 유저 인풋이 안 열림 | `html-asset-generator.tsx`에 슬롯 개념 자체가 없음(“슬롯 없음” 하드코딩) |
| 글자 제한 등 입력 스펙 미구현 | HTML 경로에 스펙 계약 없음 (JSON 경로엔 `inputFormat`/`maxLength`/`maxLines`/`placeholder` 구현됨) |
| 노드별 AI 주석 없음 | 저장 위치·전달 경로 없음. `/api/text`에는 이미 `rule?` 계약이 있음 |

## 계약 (기존 `TemplateOverrides` 확장 — 신규 계약 없음)

`overrides: Record<nodeId, TemplateOverride>`는 노드 하나에 대한 패치다.
노드의 타입은 HTML(`data-figma-type`, 태그)이 소유하므로 override에 `type` 판별자를 두지 않는다
(재임포트 시 이중 진실 + 기존 저장 데이터 백필 비용, 강제는 어차피 실요소 검사가 담당).

```ts
interface TemplateOverride {
	text?: string
	backgroundImage?: string
	input?: {
		label?: string
		placeholder?: string
		maxLength?: number
		maxLines?: number
		inputFormat?: 'free' | 'number' | 'email' | 'date' // 기본 'free'
		aiInstruction?: string // AI 생성 시 rule로 전달 ("영문 이름만" 등)
	}
	vectorAsset?: { collection: 'brand-logos' | 'application-images'; id: number; src: string }
	vectorFit?: 'fill' | 'contain'
	vectorColor?: string
}
```

### 의미 규약

1. **`input`의 존재 = 열린 슬롯 선언.** JSON 경로의 `locked: false`에 해당. 별도 플래그 없음.
2. **`input`은 저작 시점 스펙.** 유저 입력값은 로컬 state로만 들고 렌더·PNG 합성에 쓴다.
   Templates 문서는 사용 시점에 변경되지 않는다.
3. **`input`은 텍스트 노드(`<p data-node-id>`)에만 유효.** 다른 노드에 붙으면 슬롯 수집에서
   조용히 무시(고아 오버라이드 무시와 같은 결).
4. 문자셋 강제(`latin`/`hangul`)는 하지 않는다 — "영문 이름만"은 `aiInstruction`+`placeholder`의
   안내로 처리. 하드 강제가 필요해지면 그때 축을 추가한다.
5. 형식 검증 실패는 제거가 아니라 에러 표시(기존 `TextSlotInput` 이메일 검증 패턴).

## 동작 변경

### 유저 화면 (`html-asset-generator.tsx`)

- `iframe sandbox` 미리보기 → 어드민과 동일한 동일-문서 렌더(`dangerouslySetInnerHTML`)로 통일.
  origin 문제(벡터 mask CORS)가 통째로 사라지고 슬롯 값 실시간 반영이 가능해진다.
  임포트 HTML은 스크립트 없는 inline-style이며 어드민·PNG export가 이미 같은 방식으로 렌더 중.
- `overrides`에서 열린 슬롯을 수집해 인풋 렌더(JSON 경로의 `TextSlotInput` 재사용).
- 값 반영은 `composeTemplateHtml(html, { [nodeId]: { text } })` 재사용.
- PNG 내보내기는 합성된 html로 수행.

### 서비스/리포지토리

- `findPublishedTemplate` select에 `overrides` 추가, `PublishedHtmlTemplate.overrides`로 전달.

### 어드민 (`template-layers-field.tsx`)

- 텍스트 레이어 선택 시 "입력 슬롯" 편집 UI: 열기/닫기 + label/placeholder/maxLength/maxLines/
  inputFormat/aiInstruction. `commitOverride({ input })`로 기존 합성 파이프라인에 저장.
- 어드민 AI 생성(AiTextForm)도 선택 노드의 `aiInstruction`을 rule로 전달.

### AI 전달 경로

- `generateOneText(prompt, rule?)` → `generateTexts({ prompt, rule, count: 1 })` — 기존 계약 재사용.
- `GenerateTextField`에 `rule?` prop 추가, 유저 화면 슬롯의 `aiInstruction`을 넘긴다.

## 하지 않는 것

- override `type` 판별 유니언, 문자셋 검증 축, 사용자 입력값의 서버 저장,
  template-assets 공개 전환이나 ACAO 헤더 추가(동일-문서 렌더로 불필요), DB 마이그레이션(json 필드).
