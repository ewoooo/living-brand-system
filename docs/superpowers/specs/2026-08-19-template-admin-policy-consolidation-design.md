# 템플릿 어드민 정책 소유자 통합

작성 2026-08-19 · 상태: 설계 승인됨, 구현 계획 대기

## 문제

템플릿 어드민에서 "창작자가 무엇을 만질 수 있는가"를 정하는 장치가 셋이고 커버리지가 서로 어긋난다.

| 대상 | 레이어 설정 (`overrides[nodeId]`) | Controller 제한 (`controllerRestrictions`) |
| --- | --- | --- |
| 텍스트 | access · 기본표시 · 토글허용 · 라벨 · 플레이스홀더 · 형식 · **최대 글자** · 최대 줄 · AI 지시 | **availability** · defaultValue · **maxLength** |
| 이미지 | access · visibility · 프로파일 고정 · 변형 · 색 치환 | 컨트롤 자체가 없음 |
| 벡터 | access · visibility · 색 | 컨트롤 자체가 없음 |
| 텍스트 일괄 색 | 없음 | colorValues · availability |
| 배경 | **레이어 행이 없음** | type optionValues · colorValues |

굵은 칸이 같은 값에 소유자가 둘인 지점이다. 텍스트를 읽기 전용으로 만드는 길이 둘(`creator.access: 'readonly'` → `availability: 'readonly'`), 최대 글자를 정하는 길도 둘(레이어가 기본값, 제한이 재차 좁힘)이다. 제한의 `defaultValue`는 HTML 본문 텍스트까지 덮어쓴다.

### 왜 이렇게 됐나

`controllerRestrictions`는 **코드에 고정된 런타임 매니페스트를 프로파일별로 좁히려고** 만든 장치다. 이미지·그래픽은 매니페스트가 `definition.ts`에 있고 어드민이 그것을 좁히므로 자연스럽다.

템플릿은 매니페스트가 코드에 없다. `getTemplateRuntimeManifest`가 그 템플릿의 `html` + `overrides`에서 파생한다(`src/features/template-customization/domain/template-studio-config.ts`). 즉 제한 패널은 **같은 어드민이 아래 레이어 워크스페이스에서 편집한 문서에서 나온 컨트롤을 위에서 다시 좁히는 순환**이다. 중복은 이 순환의 증상이다.

배경만 반대 방향이다. `background.type`·`background.color`는 문서에서 파생되지 않고 모든 템플릿에 무조건 합성되므로, 레이어 행이 없고 제한 패널에만 존재한다.

## 정본

Figma `HD_LBS_UI` (`4zXBMnMCPay346ohMBrMFA`), 템플릿 어드민 본문 `Container 76:295`.

- `레이어 설정` `76:737` — 캔버스 + 레이어 목록 + 선택 레이어 패널(`기본 설정` / `세부 설정`)
- `배경 설정` `77:2247`
- `출력 설정` `77:1390`

디자인에 **`Controller 제한` 패널이 없다.** 제한 패널이 하던 일이 레이어 세부 설정으로 내려가 있다(최대 글자 수 · 형식 · 사용 상태). 소유자를 파생 원천에 두는 선택이 정본이다.

🔴 정본에 남은 미완성 둘 — 구현 전 디자인에서 정리해야 한다.

- `배경 설정`이 `출력 설정`의 노드 단위 복제다. 라벨·토글·옵션·레이아웃이 동일하고 제목만 다르다.
- 세부 설정 `형식`의 표시값이 `Color`다. 이 자리 옵션은 자유·숫자·이메일·날짜다.

## 결정

1. 템플릿에서 `Controller 제한`·`Controller 표현` 패널을 없앤다. 이미지·그래픽 프로파일에는 그대로 남는다 — 거기엔 순환이 없다.
2. 창작자 정책의 소유자를 셋으로 나누고 겹치지 않게 한다. 레이어 정책은 `overrides[nodeId]`, 배경 정책은 `backgroundPolicy`, 텍스트 일괄 색은 `textPolicy`, 출력 정책은 기존 `exportPolicy`.
3. 죽어 있던 노브 둘을 UI에 연결한다. 배경의 `imageConfig.allowedConfigIds`와 이미지 슬롯의 `transform.enabled`.
4. 텍스트 기본값의 소유자는 HTML 본문 하나다. restriction `defaultValue` 경로는 템플릿에서 사라진다.

## 디자인 어휘와 컨트롤러 API의 대응

정본이 이미 보여주는 프리미티브로 전부 표현된다. 새로 만들 것은 하나뿐이다.

| 컨트롤러 `kind` | 프리미티브 | 정본 내 실례 |
| --- | --- | --- |
| `toggle` | Toggle (Label + On/Off) | 기본 표시 · 숨김 가능 · 인쇄·레스터·벡터·영상 |
| `select` (≤3) | Toggle Group | 사용 상태 · 72/150/300ppi · 24/30/60fps |
| `select` (4+) | Select Group (Label + 값 + chevron) | 형식 |
| `text` 짧음 | Text Input (Label + Tail) | 최대 글자 수 · 최대 줄 |
| `text` 김 | Text Area (Header + 입력) | AI 지시 |
| `color` | 스와치 그리드 | 정본에 없음 — 코드의 `BrandColorSwatches`가 단일 선택 형태로 갖고 있다 |
| `range` | — | 템플릿에 range 컨트롤이 없어 필요 없다 |

제한값의 표현도 같은 어휘로 끝난다.

| `ControllerControlRestriction` 필드 | 행 모양 |
| --- | --- |
| `availability` | Toggle Group — 레이어 `사용 상태`가 이미 이것 |
| `optionValues` | **옵션마다 Toggle On/Off** — `출력 설정 → 형식`이 이미 이것 |
| `maxLength` · `min` · `max` | Text Input |
| `colorValues` | 스와치 다중 선택 — 유일하게 없는 패턴 |
| `defaultValue` | 행 없음. 소유자를 하나로 몰아 없앤다 |

`출력 설정 → 형식`의 4행이 "enum 하나를 옵션별 On/Off로 좁히는" 범용 패턴이다. 배경 종류·허용 이미지 프로파일·허용 그래픽 런타임이 전부 이 행 모양으로 표현되고 목록 길이만 다르다.

## UI 구성

### 배경 설정

두 카드 구조(`형식` / `제한`)는 유지하고 내용을 배경 것으로 교체한다.

**카드 `형식`** — 창작자가 고를 수 있는 배경 종류

| 행 | 프리미티브 | 저장 |
| --- | --- | --- |
| 색 | Toggle On/Off | `backgroundPolicy.types` 에 `'color'` 포함 여부 |
| 이미지 | Toggle On/Off | `'image'` |
| 그래픽 | Toggle On/Off | `'graphic'` |

전부 Off는 거부한다. 배경 없는 템플릿은 성립하지 않는다.

**카드 `제한`**

| 행 | 프리미티브 | 저장 | 표시 조건 |
| --- | --- | --- | --- |
| 허용 색 | 스와치 다중 선택 | `backgroundPolicy.colorValues` | `types`에 `color` |
| 허용 이미지 프로파일 | 프로파일마다 Toggle On/Off | `backgroundPolicy.imageConfigIds` | `types`에 `image` |
| 허용 그래픽 | 런타임마다 Toggle On/Off | `backgroundPolicy.graphicConfigIds` | `types`에 `graphic` |

각 목록이 비어 있으면 "접근 가능한 전부 허용"이다. `exportPolicy`가 이미 쓰는 규칙과 같다.

### 레이어 설정

`캔버스 + 레이어 목록` → `공통 설정` 카드 → `선택 레이어` 패널 세 덩어리.

**`공통 설정` 카드** (신설)

| 행 | 프리미티브 | 저장 |
| --- | --- | --- |
| 텍스트 허용 색 | 스와치 다중 선택 | `textPolicy.colorValues` |

텍스트 일괄 색은 레이어 하나가 아니라 텍스트 전체에 걸리므로 레이어 패널에 두면 레이어마다 같은 값이 반복된다.

**`기본 설정` 카드** — 레이어 종류와 무관하게 동일. 정본 그대로.

| 행 | 프리미티브 | 저장 |
| --- | --- | --- |
| 사용 상태 | Toggle Group (편집 가능 · 읽기 전용 · 숨김) | `creator.access` |
| 기본 표시 | Toggle On/Off | `creator.visibility.defaultVisible` |
| 숨김 가능 | Toggle On/Off | `creator.visibility.allowToggle` |

**`세부 설정` 카드** — 종류에 따라 행만 바뀐다. 정본에 그려진 4행은 텍스트 레이어의 경우 하나다.

텍스트

| 행 | 프리미티브 | 저장 | 정본 |
| --- | --- | --- | --- |
| 라벨 | Text Input | `input.label` | 누락 — 추가한다 |
| 플레이스홀더 | Text Input | `input.placeholder` | 누락 — 추가한다 |
| 최대 글자 수 | Text Input | `input.maxLength` | 있음 |
| 최대 줄 | Text Input | `input.maxLines` | 있음 |
| 형식 | Select Group (자유 · 숫자 · 이메일 · 날짜) | `input.inputFormat` | 있음, 표시값 오류 |
| AI 지시 | Text Area | `input.aiInstruction` | 있음 |

라벨과 플레이스홀더는 창작자 화면의 컨트롤 이름과 빈칸 안내이므로 살린다.

이미지

| 행 | 프리미티브 | 저장 | 표시 조건 |
| --- | --- | --- | --- |
| 이미지 프로파일 | Select Group (고정 · 창작자 선택) | `imageInput.profileId` 유무 | |
| 허용 프로파일 | 프로파일마다 Toggle On/Off | `imageInput.allowedProfileIds` (신설) | 창작자 선택일 때만 |
| 이미지 변형 | Toggle On/Off | `imageInput.transform.enabled` (신설) | |
| 라인아트 선 색 | 스와치 단일 선택 | `imageColorize.line` | |
| 라인아트 배경 색 | 스와치 단일 선택 + `투명` | `imageColorize.background` | |
| 생성 프롬프트 | Text Area | 기존 저작 필드 | |

벡터

| 행 | 프리미티브 | 저장 |
| --- | --- | --- |
| 자산 | Select Group | `vectorAsset` |
| 맞춤 | Toggle Group (Fill · Contain) | `vectorFit` |
| 색 | 스와치 단일 선택 + `원본` | `vectorColor` |

프레임·사각형 등 편집할 값이 없는 종류는 `세부 설정` 카드를 렌더하지 않고 기존 문구 한 줄을 둔다.

### 출력 설정

정본 그대로, 기존 `exportPolicy` 필드 그대로. 이번 변경에서 손대지 않는다.

## 계약 변경

### Payload 필드 (`src/collections/Templates.ts`)

제거

- `studioControllerRestrictionsField({ source: 'template' })`
- `studioControllerPresentationField({ source: 'template' })`

두 팩토리 자체는 남는다 — `GraphicProfiles`·`ImageProfiles`가 계속 쓴다.

신설 — 둘 다 `type: 'json'`, 폼에서 숨기고 섹션 컴포넌트가 소유한다. `overrides`가 이미 쓰는 방식과 같다.

```ts
backgroundPolicy: {
  types: ('color' | 'image' | 'graphic')[]   // 최소 1
  colorValues?: string[]                     // #rrggbb
  imageConfigIds?: number[]
  graphicConfigIds?: number[]
}

textPolicy: {
  colorValues?: string[]
}
```

### 노드 설정 (`src/types/template.ts`)

`TemplateNodeConfig.imageInput`에 둘을 더한다.

```ts
imageInput?: {
  profileId?: number
  allowedProfileIds?: number[]
  transform?: { enabled: boolean }   // 없으면 true — 기존 동작 유지
}
```

### 파생 (`src/features/template-customization/domain/template-studio-config.ts`)

- `PublishedHtmlTemplate`에서 `controllerRestrictions`·`controllerPresentation`을 뺀다. `backgroundPolicy`·`textPolicy`를 넣는다.
- `getTemplateRuntimeManifest`가 `backgroundPolicy`·`textPolicy`를 받는다.
  - `background.type`의 `options`를 허용된 종류만으로 만든다. 옵션이 1개면 `availability: 'readonly'`를 붙인다 — 창작자가 바꿀 수 없는 select을 열어 두지 않는다.
  - `types`에 `color`가 없으면 `background.color` 컨트롤을 만들지 않는다. 있으면 `values: colorValues`.
  - `text.color`에 `values: textPolicy.colorValues`.
- `deriveTemplateStudioConfig`에서 `projectPayloadControllerRestrictions`·`applyControllerRestrictions` 호출을 뺀다.
- `controllerPresentation`은 계약에 남기고 `resolveControllerPresentation(groups, undefined)`의 기본값(모두 접기 가능·열림)을 계산해 내보낸다. 창작자 화면이 이 값을 읽으므로 계약까지 지우면 범위가 번진다.
- 배경 슬롯의 `imageConfig.allowedConfigIds`를 `backgroundPolicy.imageConfigIds`로 채운다. `graphicConfigIds`를 `TemplateBackgroundSlot`에 더한다.
- 이미지 슬롯의 `imageConfig.allowedConfigIds`를 `imageInput.allowedProfileIds`로, `transform.enabled`를 `imageInput.transform?.enabled ?? true`로 채운다.

### 어드민 컴포넌트

신설

- `src/components/admin/templates/template-background-policy-field.tsx` — `배경 설정` 섹션. `형식`/`제한` 두 카드.
- `BrandColorSwatches`의 다중 선택 형제. 기존 컴포넌트는 `value`/`onPick` 단일 선택이라 허용 색 좁히기에 쓸 수 없다. `values: string[]` + `onToggle`을 받는 형태로 같은 파일에 둔다.

수정

- `template-layers-field.tsx` — `공통 설정` 카드 추가.
- `template-layer-editors.tsx` — 이미지 세부 설정에 `허용 프로파일`·`이미지 변형` 행 추가.

`use-studio-runtime-manifest.ts`의 template 분기는 남는다 — `출력 설정`의 형식·제한 UI가 `artifacts`를 읽는 데 계속 쓴다.

## 데이터와 마이그레이션

공유 DB 조회 결과(2026-08-19, 읽기 전용):

- `templates` 4행(id 9·10·12·13, 전부 published) 모두 `controller_restrictions`·`controller_presentation`이 NULL이다.
- `_templates_v`에 두 컬럼이 NULL 아닌 행은 0이다.

따라서 **백필이 필요 없다.** expand→backfill→contract로 쪼개지 않고 한 마이그레이션에서 두 컬럼을 drop하고 `background_policy`·`text_policy`를 add한다.

기존 4개 템플릿은 두 정책이 비어 있는 상태로 시작한다. 빈 값 = 전부 허용이므로 창작자 화면 동작은 지금과 같다.

## 검증

- `template-studio-config.test.ts` — 배경 종류 좁힘, 색 좁힘, 프로파일 좁힘, 종류 전부 Off 거부, 옵션 1개일 때 `readonly`, `types`에 `color`가 없으면 `background.color` 컨트롤 부재, 정책이 비면 지금과 동일한 매니페스트.
- `studio-controller-field.test.ts` — `Templates`에 `controllerRestrictions`·`controllerPresentation` 필드가 없음을 고정. 두 프로파일 컬렉션에는 여전히 있음도 함께 고정.
- 이미지 슬롯 파생 — `allowedProfileIds`가 `imageConfig.allowedConfigIds`로, `transform.enabled`가 슬롯으로 이어지는지.
- 마이그레이션 — 새 빈 DB에 `PAYLOAD_DB_PUSH=false pnpm payload migrate`.
- 어드민 화면 — 템플릿 4개가 published 상태로 스튜디오에 뜨는지, 정책 카드가 저장·복원되는지.

## 범위 밖

- 창작자 화면(Template Studio). 컨트롤러 정의가 좁아지는 것만으로 반영되므로 이번에 손대지 않는다.
- `출력 설정`과 `exportPolicy`.
- 이미지·그래픽 프로파일의 `Controller 제한` 패널.
- `listGraphicStudioConfigs`가 프로파일별 guard 없이 `map`을 돌아 낡은 제한 하나가 목록 전체를 죽이는 문제. 별건으로 남긴다.

## 알려진 충돌 위험

다른 세션이 `src/components/shared/controller/*`와 검수 화면을 동시에 손보고 있다(`feat/controller-review-extension`). 이 작업은 `src/components/admin/templates/*`와 템플릿 도메인에 머물지만, 컨트롤러 킷의 프리미티브가 바뀌면 스와치 다중 선택 구현이 그쪽 결과를 따라야 한다.
