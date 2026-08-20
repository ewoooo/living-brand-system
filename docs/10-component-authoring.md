# 10. 컴포넌트 저작 규칙

이 문서는 Creator UI와 guideline 화면, 그리고 프로젝트가 직접 추가한 Payload Admin 확장 화면에 새 React 컴포넌트를 추가할 때 지켜야 할 저작 계약을 정리합니다(Admin에서 달라지는 항목만 §8이 따로 정의합니다). 이 계약은 `src/components/ui` 프리미티브 전용이 아니라 **화면 컴포넌트를 포함한 모든 표현 컴포넌트**에 적용됩니다. 컴포넌트는 반복해서 늘어나고, 매번 조금씩 다르게 만들면 드리프트가 쌓입니다. 여기서는 "매번 같은 계약"을 강제해 발명과 드리프트를 막습니다. 파운데이션(토큰 지도·닫힌 토큰 규칙·프레임 골격)은 `docs/09-design-system.md`가 소유하며 이 문서는 그 위에서 컴포넌트 저작만 다룹니다. 배치·네이밍·계층 경계는 `docs/06-project-structure.md`, 접근성 기준은 `docs/08-accessibility-i18n.md`, 토큰 값은 CSS 원천(`src/app/(frontend)/theme.css`·`typeset.css`)이 소유합니다. 이 문서는 그 원천을 링크만 하고 값을 다시 쓰지 않습니다.

## 1. 목적

컴포넌트는 이 저장소에서 가장 자주 추가되는 산출물이면서, 슬롭(slop) 위험이 가장 큰 지점입니다. 같은 헤딩을 새로 만들고, 같은 색을 생 hex로 다시 칠하고, `cn`을 또 구현하는 식의 중복이 컴포넌트마다 다른 모양으로 재발합니다. 이 문서의 목적은 그 재발을 규칙 하나로 차단하는 것입니다.

- 값·토큰(oklch, radius, hex 등)은 CSS 원천(`src/app/(frontend)/theme.css`·`typeset.css`)만 소유합니다. 그 토큰 지도와 닫힌 토큰 규칙은 `docs/09-design-system.md` §3~4가 소유합니다. 이 문서에 값을 복제하지 않습니다.
- 파일 배치, `use client` 경계, 네이밍은 `docs/06-project-structure.md`가 소유합니다. 여기서는 링크하고 최소한만 재서술합니다.
- 이 문서가 소유하는 것은 "컴포넌트를 만들 때 매번 따르는 계약"뿐입니다: 재사용 사다리, 템플릿, 스타일 Do/Don't, 브랜드 무관, 접근성 최소선, 자기 검증입니다.

## 2. 시작 전 재사용 사다리

코드를 쓰기 전에 Ponytail 사다리를 먼저 내려갑니다. 첫 번째로 걸리는 칸에서 멈춥니다.

1. **이 컴포넌트가 존재할 필요가 있나?** 투기적 필요면 만들지 않습니다. (YAGNI)
2. **이미 저장소에 있나?** `src/components/ui`의 프리미티브를 먼저 grep합니다. 몇 파일 옆에 있는 것을 다시 구현하는 것이 가장 흔한 슬롭입니다.
3. **조합으로 되나?** 기존 프리미티브를 조합합니다.
4. **그래도 없으면** 최소 코드로 새로 만듭니다. 🔴 이때 **스타일의 근거는 Carbon입니다** — 빈 마크업에 스타일을 처음 쓰는 순간이 준거법이 발동하는 자리이고, "추론했을 때 가장 괜찮아 보이는 것"은 금지입니다(그것이 슬롭의 정의입니다). Carbon에서 같은 컴포넌트를 **Context7로 조회해** 따르고, 기억으로 값을 부르지 않습니다. 절차와 예외는 `docs/09` §9.

기존 코드를 먼저 찾는 grep 예시:

```bash
# ui 프리미티브 목록부터 확인
ls src/components/ui

# 만들려는 것과 비슷한 이름을 저장소 전체에서 찾기
grep -rl "Badge\|Card\|Typography" src/components src/features
```

자주 쓰는 재사용 매핑입니다. 왼쪽을 새로 만들지 말고 오른쪽을 씁니다.

| 하려는 일 | 재사용할 것 |
| --- | --- |
| 헤딩·본문 텍스트 | `Typography` (`src/components/ui/typography.tsx`) |
| 제목·설명·도움말 조합 | `ContentHeading` (`src/components/shared/content-heading.tsx`) |
| 입력 label·control·도움말 조합 | `FieldGroup` + `Field` + `FieldLabel`/`FieldDescription` |
| 아이콘 | `@carbon/icons-react` |
| className 병합 | `@/lib/utils`의 `cn` |
| 색 파생(전경색·RGB) | `@/lib/color` (`hexToRgb`, `getContrastingForeground`) |
| 콘텐츠 최대 폭 | `ContentFrame` (`src/components/shared/content-frame.tsx`) |
| 블록 표면색(배경) | `GuidelineBlockFrame` |

shadcn 4.12의 공식 아이콘 목록에는 Carbon이 없어 `components.json`은 `radix-mira`가 지원하는 `hugeicons` 값을 유지합니다. 이 값은 생성기 호환용일 뿐 저장소의 아이콘 정책이 아닙니다. shadcn 컴포넌트를 추가한 같은 변경에서 생성된 아이콘을 `@carbon/icons-react`로 바꾸고, `@hugeicons/*` import가 0건인지 확인한 뒤 커밋합니다. `iconLibrary`를 임의의 `carbon` 문자열로 바꾸면 레지스트리의 `IconPlaceholder`가 변환되지 않으므로 금지합니다.

## 3. 새 컴포넌트 템플릿

새로 만들어야 한다면 저장소의 실제 파일을 복제해서 시작합니다. 발명하지 않습니다. 형태에 따라 두 원형 중 하나를 고릅니다.

### variant형 컴포넌트

시각적 변형이 여러 개면 `class-variance-authority`의 `cva`를 씁니다. 원형은 `src/components/ui/badge.tsx`입니다. `cva` + `VariantProps` + `defaultVariants` + named export 패턴입니다.

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center …', {
	variants: {
		variant: {
			outline: 'border-foreground bg-transparent text-foreground …',
			tint: 'border-primary/40 bg-primary/10 text-foreground …',
			muted: 'bg-muted text-muted-foreground …',
			highlight: 'bg-highlight text-highlight-foreground …',
			success: 'bg-success/15 text-success …',
			info: 'bg-info/15 text-info …',
			warning: 'bg-warning/15 text-warning …',
			destructive: 'bg-destructive/15 text-destructive …',
		},
		shape: {
			sharp: 'rounded-none',
			rounded: 'rounded-sm',
			pill: 'rounded-full …',
		},
	},
	defaultVariants: { variant: 'muted', shape: 'pill' },
})

function Badge({ className, variant = 'muted', shape = 'pill', asChild = false, ...props }:
	React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : 'span'
	return <Comp data-slot="badge" data-variant={variant} data-shape={shape}
		className={cn(badgeVariants({ variant, shape }), className)} {...props} />
}

export { Badge, badgeVariants }
```

`badge.tsx`에서 그대로 가져오는 계약: 색은 `variant`, 모서리는 `shape`로 분리하고 각 정의와 기본값은 `cva`에 둡니다. 판정 상태는 `success`/`info`/`warning`/`destructive` variant를 사용하고 화면에서 색 클래스를 직접 조립하지 않습니다. 루트에 `data-slot`을 붙이고 상태는 `data-variant`와 `data-shape`로 노출합니다. 아이콘에는 위치에 따라 `data-icon="inline-start" | "inline-end"`, 아이콘 전용 Badge에는 `data-icon="only"`와 Badge의 `aria-label`을 함께 씁니다. 다형 렌더링은 `asChild` + `radix-ui`의 `Slot`으로 하고, 별도 `as` prop을 새로 만들지 않습니다.

`button.tsx`도 같은 `variant`(`outline`/`tint`/`muted`/`highlight`)와 `shape`(`sharp`/`rounded`/`pill`) 축을 공유하며, 크기만 `size`로 따로 분리합니다. `ghost`/`destructive`/`link`는 기능성 예외로 유지합니다. `muted`는 낮은 강조도의 활성 버튼이고, 비활성 상태는 별도 variant가 아니라 네이티브 `disabled` 속성으로 표현합니다.

### 크기 분기형 컴포넌트

같은 모양에서 밀도(spacing)만 달라지면 `data-*` 속성 + CSS 변수로 분기합니다. 원형은 `src/components/ui/card.tsx`입니다. Tailwind variant 클래스를 여러 벌 만들지 않고, `data-[size=sm]`로 CSS 변수 하나만 바꿉니다.

```tsx
function Card({ className, size = 'default', ...props }:
	React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
	return (
		<div data-slot="card" data-size={size}
			className={cn(
				'flex flex-col gap-(--card-spacing) py-(--card-spacing) [--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(3)]',
				className,
			)}
			{...props} />
	)
}
```

`card.tsx`의 계약: 크기별로 클래스를 곱하지 않고 `--card-spacing` 하나를 `data-[size=sm]`에서 재정의합니다.

### 두 원형 공통 규칙

| 항목 | 규칙 | 원천 |
| --- | --- | --- |
| className 병합 | `@/lib/utils`의 `cn`만 사용. 문자열 결합·템플릿 리터럴 금지 | `utils.ts`: `twMerge(clsx(inputs))` |
| 루트 식별 | 루트 요소에 `data-slot="<name>"` — **화면 컴포넌트 포함**(프리미티브 전용이 아님, §3.5) | `badge.tsx`, `card.tsx`, `studio-workspace.tsx` |
| 다형 렌더링 | `asChild` + `radix-ui` `Slot`, 별도 `as` prop 금지 | `badge.tsx` |
| 아이콘 | `@carbon/icons-react` | repo 컨벤션(저장소 24개 파일 채택) |
| 이미지 | `next/image` 기본. 생성 이미지·데이터 URL 미리보기처럼 최적화가 성립하지 않는 곳만 생 `<img>` + biome-ignore 사유 주석 | `agent-chat-generated-images.tsx` |
| 파일명 | kebab-case (`widgets/type-specimen/component.tsx`) | `docs/06` §10 |
| export | PascalCase named export, `default` export 금지 | `badge.tsx`, `card.tsx`, `typography.tsx` |
| 타입 import | `import type … from 'react'` | `card.tsx`, `typography.tsx` |
| `use client` | 자기 코드에 상태·이벤트·브라우저 API가 있거나, client 전용 의존성(radix 프리미티브, `motion`, `next-themes`)을 직접 감쌀 때만. 둘 다 아닌 순수 조합엔 금지 | `docs/06` |

`Typography`는 cva·`data-slot`·named export 계약을 따르는 참고 구현입니다. `cva('', { variants: { family, size, tone, weight } })`에 `data-slot="typography"`, `data-size`를 붙이고 named export만 합니다. 단, 다형 렌더링은 `asChild`가 아니라 `as` prop으로 처리합니다 — HTML 요소(`h1`~`p`/`span`)만 교체하고 컴포넌트 합성이 필요 없는 경우의 기존 예외이며, 새 컴포넌트는 위 표대로 `asChild` + `Slot`을 씁니다.

### 화면 컴포넌트 계약 (§3.5)

studio·global·home 같은 표면의 화면 컴포넌트도 위 계약을 그대로 따릅니다. 원형 예시가 전부 `ui/*`라고 해서 "프리미티브 전용"으로 읽지 않습니다.

- **`data-slot`**: 모든 표현 컴포넌트의 루트에 붙입니다. 테스트가 DOM을 잡는 공식 훅이고(`studio-workspace.tsx`의 슬롯을 `template-generator.test.tsx`가 검증하는 것이 원형), 내부 클래스 구조가 바뀌어도 셀렉터가 살아남습니다.
- **props 형태**: DOM 요소를 감싸는 컴포넌트는 `React.ComponentProps<'...'>` 확장이 기본입니다. 도메인 데이터를 받는 화면 컴포넌트는 인라인 익명 객체 타입 대신 **명명된 Props 타입**을 선언합니다. 외부 스타일 조정을 허용하려면 `className`을 받아 `cn`으로 병합합니다 — 받지 않는 컴포넌트에 `cn`은 필요 없지만, 받는 순간 문자열 결합이 아니라 `cn`입니다.
- **상태 소유**: 서버 데이터 fetch와 그 loading/error 3종 세트를 컴포넌트 `useState`로 복제하지 않습니다. HTTP I/O는 소유 기능의 `*.client.ts`가(`docs/06` §10), Context 값 계약은 `src/features/*/contexts`, 화면 세션 상태는 `src/features/*/providers`, 소비 API는 `src/features/*/hooks`의 `use-*` 훅이 소유합니다. 원형은 Studio Context + Provider + `use-*-studio` — Provider와 소비 훅은 서로 import하지 않고 같은 Context 계약에 의존하며, 나머지 컴포넌트는 props 또는 훅으로 값을 받는 표현 계층으로 남습니다. `src/components` 안에 도메인 상태 `createContext`를 만들지 않습니다.
- **variant 수단 단일화**: 시각 variant(색·모양·상태별 스타일)는 언제나 `cva`입니다. 완전 클래스 룩업 테이블은 §4의 동적 클래스 대책, 즉 **레이아웃 매핑**(`grid-cols` 등 구조 분기)에만 씁니다 — 상태→색 매핑을 `.ts` 룩업 테이블이나 클래스 문자열을 반환하는 헬퍼 함수로 풀면 cva 자리를 우회한 것입니다.
- **motion**: 애니메이션 라이브러리는 `motion/react` 하나만, `LazyMotion` + `motion/react-m` 조합(`side-nav.tsx` 원형)으로 씁니다. 모션 감소는 그 모션을 소유한 컴포넌트 안에서 `useReducedMotion()`으로 처리하고, `shouldReduceMotion`을 props로 내려보내지 않습니다.

### 컨트롤러 컨트롤 계약 (§3.6)

스튜디오 컨트롤러의 개별 컨트롤은 아래 계약을 따릅니다. 디자인 정본은 Figma HD_LBS_UI의 **Controller API**(node `4:5578`), 구현 원형은 `src/components/shared/controller/`의 **Controller 컴파운드 킷**입니다(Studio와 가이드라인이 함께 쓰므로 `components/shared/`에 있습니다). 패널은 `Root` → `Header`·`Content`·`Footer`, 본문은 `Group` → 개별 컨트롤로 조합합니다. `Group`은 제목과 접힘 상태를 직접 소유합니다. 기존 `Panel`은 `Root`·`Content`·`Footer`를 묶은 호환 래퍼입니다.

Runtime Manifest부터 Effective Config, Provider, Artifact, Export까지 이어지는 전체 데이터 흐름은 [Studio](features/studio.md)를 정본으로 삼습니다. 이 절은 Controller의 표현과 상호작용 계약만 설명합니다.

세 Studio는 Admin 제한 전의 원본 실행 계약을 `StudioRuntimeManifest`로 발행합니다. Runtime Manifest는 생성 가능한 Artifact와 Controller Definition만 알며 파일 형식은 알지 않습니다.

```ts
type StudioRuntimeManifest = {
	artifacts: {
		raster?: {}
		vector?: {}
		video?: { fps: readonly (24 | 30 | 60)[]; maxWidth: number; maxHeight: number; maxDurationSeconds: number }
		original?: {}
	}
	controller: { groups: readonly ControllerGroupDefinition[] }
}

type StudioControllerConfig = StudioRuntimeManifest & {
	studio: 'template' | 'image' | 'graphic'
	id: string | number
	version: 1
	name: string
}
```

Runtime Manifest는 정적 하드코딩을 의미하지 않습니다. Graphic은 plugin 등록값, Image는 Generation Model capability, Template은 `html`·`nodeConfigs`에서 결정적으로 Manifest를 얻습니다. Template Manifest는 실제 DOM node·ref를 담지 않는 직렬화 가능한 문서 구조 투영입니다. 같은 입력은 항상 같은 Manifest를 내야 합니다.

Template·Image·Graphic Config는 이 Manifest 구조를 그대로 쓰고, 실행에 필요한 도메인 descriptor·control id binding·Effective `output`을 확장합니다. `Runtime Manifest + Admin feature/controller restrictions + Exporter 호환성/출력 제한 → Effective StudioConfig`의 적용은 순수하고 멱등적이어야 합니다. Studio Provider는 공통화하지 않습니다. 각 Provider가 자기 도메인의 세션과 실행 결과를 소유합니다.

`output.formats`는 `Runtime Artifact 사양 → 실제 Exporter 호환성 → Admin exportPolicy` 순서로 파생합니다. 공통 변환은 Raster→PNG/JPEG/TIFF/PDF/MP4, Vector→SVG, Video→MP4입니다. 실제 Video Artifact가 있으면 시간 기반 producer를 쓰고, Raster→MP4는 정지 프레임 영상입니다. Admin은 형식뿐 아니라 PPI·FPS·크기·길이 상한도 좁힐 수만 있습니다. 저장된 `exportPolicy`와 Effective Config의 `output`은 서로 다른 계약입니다.

형식 선택은 Controller Definition에 중복하지 않습니다. 세 Studio의 Export hook은 Artifact 선택과 batch/ZIP 같은 전달 정책만 조정하고, 모든 형식 분기와 인코딩은 공통 `executeArtifactExport()`가 소유합니다. `Controller.Footer`는 그 결과인 export view model만 표시합니다. 공통 `useExport.canExport(request)`가 Effective capability·Artifact 가용성·도메인 실행 조건을 함께 판정하고, `run()`은 실행 시 같은 판정을 다시 적용합니다. `ExportRequest`는 먼저 `raster | vector | video | original` Artifact로 분기합니다. Image 원본은 파일 형식이 아니므로 `OriginalArtifact`, `output.original` boolean, format 없는 Original 요청으로 표현합니다. Runtime·Provider·Canvas는 출력 형식을 해석하지 않습니다.

직렬화 가능한 데이터 어휘의 정본은 `src/modules/studio-controller/controller-definition.ts`의 `ControllerControlDefinition`입니다. Definition에는 `kind`·`defaultValue`·선택지·레인지 같은 정적 정의만 싣습니다. 현재 값은 session values에, `error`·런타임 availability·대상 기하는 runtime bindings에 둡니다. `ControllerRenderer`는 `groups`와 이 두 런타임 입력을 결합해 `Group`과 primitive만 그립니다. 별도 배치가 필요한 footer·Template slot은 `ControllerControlRenderer`로 같은 단일 control 투영을 재사용합니다. 공통 `StudioSidebar`가 `Controller.Root`와 고정 `Header`·스크롤 `Content`·고정 `Footer` 배치를, Domain Sidebar가 내부 복합 UI와 브라우저 트리거를 소유합니다. ReactNode·콜백·DOM 참조·formatter 함수는 Definition에 넣지 않습니다.

각 Studio Config는 렌더링·실행 전의 **Canonical IR**입니다. Payload·published 원본은 도메인 projection과 strict validation을 한 번 거쳐 Config가 되고, Template 같은 host는 원본에 없는 기능을 추가하지 않고 options·availability·features를 좁힌 **Effective IR**만 만듭니다. Projection과 제한 정책은 같은 입력에 반복 적용해도 결과가 달라지지 않는 순수 함수여야 하며, Renderer는 IR이나 session values를 변경하지 않습니다. Config 정규화의 멱등성과 생성 모델·시간 기반 그래픽의 출력 재현성은 별도 계약입니다.

```tsx
<Controller.Group title="Position">...</Controller.Group>
<Controller.Group title="Transform" defaultOpen disabled={locked}>
	...
</Controller.Group>
```

`GroupHeader`와 `Section`은 공개 API에 두지 않습니다. `Group`이 제목·구분선·Chevron·접힘 상태를 내부에서 그립니다. `ControllerRenderer`는 첫 그룹의 상단 구분선만 제거합니다. 잠긴 동안에는 강제로 닫지만 사용자의 이전 열림 상태는 보존해, 잠금이 풀리면 원래 상태로 복귀합니다. 레이아웃 공개 API는 `Root`·`Header`·`Content`·`Group`·`Footer`입니다.

Controller 사용 구조는 다섯 책임으로 나눕니다.

| 책임 | 소유 범위 | 경계 |
| --- | --- | --- |
| Definition | Runtime Manifest가 기본값·선택지·범위·정적 availability를 소유 | 현재 값과 실행 상태를 저장하지 않음 |
| State / Context | Studio Provider가 session values·runtime bindings·정책·액션을 소유 | Studio별 Provider를 하나로 합치지 않음 |
| Rendering | `ControllerRenderer`가 `groups`를 `Group`과 primitive로 투영 | `Content`나 도메인 UI를 소유하지 않음 |
| Layout / Composition | `StudioSidebar`가 공통 패널 배치를, Domain Sidebar가 복합 UI를 구성 | 컨트롤 값을 재정의하지 않음 |
| Control / Interaction | `Row`·`Range`·`Pad` 등 프리미티브가 사용자 입력을 `onChange`로 변환 | 도메인 값을 직접 변경하거나 I/O를 수행하지 않음 |

별도 `ControllerProvider`는 두지 않습니다. 편집 계약과 세션 값은 화면의 Studio Provider가 소유하고, Controller 컴파운드는 표현 레이아웃만 소유합니다. 여러 Controller Root 사이에서 공유할 표현 상태가 실제로 생길 때만 Provider를 추가합니다.

세 Studio의 Admin UI는 Runtime Manifest를 읽기 전용으로 보여주되, Image는 Profile이 선택한 feature로 좁힌 Controller projection을 보여줍니다. Image·Graphic Admin은 `{ controlId, availability, defaultValue, maxLength, optionValues, min, max }`만 sparse JSON `controllerRestrictions`로 저장하고 `kind`·label·placeholder·display·aspectRatio·group title·collapsible·defaultOpen을 입력하지 않습니다. Template Admin은 `controllerRestrictions`를 쓰지 않고 배경(`backgroundPolicy`)·레이어별 `overrides[nodeId]`·출력(`exportPolicy`)만 저장하며, `controllerPresentation`은 계산된 기본값입니다. Draft는 작성 중인 불완전 상태를 허용하지만 publish는 공통 parser로 unknown field·중복 id·kind별 기본값과 제약을 엄격하게 검증합니다. 세 Studio는 legacy Controller/Policy 저장을 읽지 않고 Effective `config.controller.groups`만 소비합니다.

어드민은 화면 패널을 구성하지 않고 기본값·선택지·범위·availability만 `controllerRestrictions`로 저작합니다(Template은 예외 — 위 문단 참고). Image Runtime Manifest의 control 종류·그룹·표현·stable ID와 전체 supported feature는 Generation Model capability가 소유하고, Image Profile은 feature를 선택합니다. Restrictions를 여러 번 적용해도 같은 Effective Definition이 나와야 합니다. `enabled`로의 잠금 해제, select 선택지 추가, range 확장, 알 수 없는 ID는 발행 시 거부합니다. Graphic의 서버 안전 Manifest Catalog는 직렬화 가능한 Runtime Manifest만 소유하고, Artifact 생성 runtime과 파일 변환 adapter는 각각 runtime/client와 studio-export 모듈이 소유합니다. `Visibility`는 Controller 계약에 두지 않습니다. 현재 렌더러는 Effective Definition에 들어 있는 control을 모두 표시합니다.

Graphic Canvas는 `type`만 보고 공용 `P5Canvas`·`WebGLCanvas`를 선택합니다. Graphic별 직렬화 Manifest는 서버 Catalog에, 순수 SVG·binding adapter는 model Catalog에, 브라우저 P5/WebGL mount·Controller 값 변환은 client Runtime Catalog에 분리합니다. Graphic Canvas와 Template Background는 같은 Runtime adapter를 각자 화면 컨테이너에 mount하며, 파일 출력 형식으로 Template 노출 여부를 제한하지 않습니다. 세 Catalog는 같은 stable runtime ID로만 연결하며, client runtime 함수를 Config에 싣지 않습니다. Worker와 Template은 코드 Catalog 등록 여부가 아니라 published Graphic Profile에서 파생된 Effective Config만 목록으로 받습니다. 따라서 새 그래픽을 코드에 등록해도 Admin이 publish하기 전에는 노출되지 않습니다.

기존 `p5`·`shader` 엔진에 Graphic을 추가할 때는 `src/features/graphic-generation/graphic-runtimes/<id>` 아래 `definition.ts`·`model.ts`·`runtime.client.ts`를 기본 export로 추가하고 `pnpm generate:graphic-runtime-catalogs`를 실행합니다. `definition.ts`는 단일 authoring API `defineGraphicRuntime()`으로 Manifest를 정의하고, `model.ts`는 순수 계산, `runtime.client.ts`는 실제 P5/WebGL 실행을 소유합니다. 생성된 세 Catalog가 stable runtime ID로 자동 연결하므로 Provider·Sidebar·Canvas·중앙 Catalog를 수정하지 않습니다. 새로운 엔진 종류가 생길 때만 공용 Canvas host와 `GraphicStudioConfig.type`을 확장합니다.

킷 배선 규칙: `Controller.Row`/`Controller.Field`가 `{ controlId, disabled }` 표현 컨텍스트를 내리고, 안의 킷 컨트롤(`Select`·`Input`·`Textarea`·`Segmented`·`ColorRow` 스와치)이 라벨 연결 id와 disabled를 자동으로 이어받습니다 — 소비자는 htmlFor를 배선하지 않습니다. 이 컨텍스트에 도메인 값을 넣지 않습니다(§3.5 — 도메인 Provider는 features의 훅으로).

컨트롤 슬롯의 공통 상태는 조작 가능 여부와 현재 표현 상태를 섞지 않고 두 타입으로 정의합니다.

```ts
type ControllerAvailability = 'enabled' | 'readonly' | 'disabled'
type ControllerInteraction = 'idle' | 'hover' | 'focused' | 'error'
```

`ControllerAvailability`는 서로 배타적입니다. `enabled`는 조작 가능, `readonly`는 값을 정상 대비로 읽을 수 있지만 변경 불가, `disabled`는 조작·포커스가 모두 불가한 상태입니다. `ControllerInteraction`은 `enabled`일 때만 적용합니다. `idle`은 기본, `hover`는 포인터 진입, `focused`는 포커스 진입, `error`는 검증 실패가 표시된 상태입니다. 시각 상태가 겹치면 `disabled` → `readonly` → `error` → `focused` → `hover` → `idle` 순으로 우선합니다.

`hover`와 `focused`는 세션 데이터나 Context에 저장하지 않고 각각 CSS `:hover`와 `:focus-visible`/`:focus-within`으로 표현합니다. `error`만 검증 결과에서 명시적으로 전달합니다. 선택(`selected`), 펼침(`open`), 값 없음(`empty`)은 컨트롤별 값 상태이므로 이 두 공통 타입에 합치지 않습니다.

공통(`ControlBase`) — 모든 컨트롤이 공유하는 정의 상태:

- Definition의 `label`은 직렬화 가능한 `string`입니다. React primitive의 `label`은 아이콘 노드를 받을 수 있지만 접근 가능한 이름(sr-only 텍스트)을 반드시 동반합니다.
- `readonly` — 값은 유효하며 읽혀야 하는 상태. 정상 대비를 유지하고 컨트롤·chevron 없이 값만 보입니다 — `Controller.Row`의 `readonly`(라벨이 span이 되고 자동 배선이 꺼짐) + 값 텍스트 구성으로 표현합니다. opacity로 흐리지 않습니다.
- `disabled` — 조정 자체가 불가한 상태(어드민 고정 등). 행 전체 흐림(opacity-50 관례) + 포인터·포커스 차단(안의 킷 컨트롤은 컨텍스트로 함께 비활성). readonly와 절대 혼용하지 않습니다.

리프 컨트롤 8종 — 값 형태와 제약은 종류(kind)가 소유합니다:

| kind | value | 종류별 제약·부속 | 킷 대응 |
| --- | --- | --- | --- |
| text | `string \| null` | `maxLength`(카운터 `n/max`로 표시), `multiline` | `Controller.Row`+`Controller.Input` / `Controller.Field`+`Controller.Textarea` |
| toggle | `boolean` | — | `Controller.Segmented` (On/Off) |
| select | `string \| null` | `options[]` | `Controller.Row`+`Controller.Select` |
| color | `#rrggbb \| null` | — | `Controller.ColorRow` |
| range | `number` | `min`/`max`/`step`, 표기 포맷 | `Controller.Range` (채움 폭=값) |
| pad | `{ x, y }` (-1~1) | `aspectRatio`(Wide/Portrait/Square) | `Controller.Pad` |
| orbit | `{ azimuthDeg, elevationDeg }` | 스냅 스텝 | `Controller.CameraControl` + 오빗 프리뷰 |
| asset | 자산 참조 `\| null` | 소스(브랜드 이미지 등) | `Controller.AssetCard`(카드 + 열기 버튼), 패널은 `Controller.Browser` |

현재 공용 `ControllerControlDefinition`은 데이터만으로 바로 그릴 수 있는 `text`·`toggle`·`select`·`color`·`range`·`pad`를 제공합니다. `orbit`은 도메인 프리뷰 슬롯이 필요하고 `asset`은 대응 primitive가 아직 없어 화면 컴포지션에 남깁니다. 두 종류는 실제 공용 renderer가 생길 때 Definition에 합류합니다.

읽기·탐색 파츠 6종 — 값을 조작하지 않고 결과를 보여주거나 위치를 옮기는 자리입니다. 검수 화면이 첫 소비자이고(디자인 `56:2` "Review Usecase"), 리프 컨트롤과 달리 직렬화 Definition의 어휘가 아니라 **컴포지션 파츠**입니다.

| 파츠 | 무엇 | 디자인 |
| --- | --- | --- |
| `Controller.Status` | 행·섹션 끝의 상태 타일(36px). 정적 표시이며 버튼이 아닙니다 — 이름은 필수 `label`이 sr-only로 갖습니다 | `59:2885` |
| `Controller.ListRow` | 두 줄 목록 행(48px). `onClick`이 없으면 `div`로 렌더해 눌러도 아무 일 없는 버튼을 만들지 않습니다 | `59:2757` |
| `Controller.Group`의 `trailing` | 제목 행 오른끝 표시. 🔴 접히는 그룹에는 줄 수 없습니다 — 그 자리는 chevron이 씁니다 | `56:2087` |
| `Controller.Card` | 접힌 판정 하나. 채움(`bg-muted`) + 배지 | `56:3` |
| `Controller.Item` | 펼친 판정 항목. 구분선 + 색 글자 | `56:2087` |
| `Controller.Pagination` | 바 안의 위치 이동 `‹ n / N ›`. 숫자는 `aria-hidden`이고 위치는 sr-only 한 문장이 말합니다 | `56:2471` |

🔴 **`Card`와 `Item`의 시각을 통일하지 마십시오.** 같은 내용을 다른 밀도로 보여주는 짝이고, 채움(카드)과 구분선(항목)의 차이가 "접힌 것"과 "펼친 것"을 가르는 유일한 단서입니다. 상태도 카드는 배지, 항목은 색 글자입니다 — 항목이 쌓이는 자리에서 배지를 반복하면 목록이 배지 벽이 됩니다.

🔴 `Status`의 `muted`와 `ListRow`·`Card`의 hover는 `bg-muted`가 아니라 `foreground/5` **겹침**입니다. 이 파츠들이 앉는 면이 이미 `bg-muted`라 같은 토큰을 쓰면 보이지 않습니다(`ROW_ACTION`·`ROW_SELECT_TRIGGER`와 같은 규칙).

경계 규칙:

- **`isEmpty`는 파생 상태입니다.** `value === null`에서 계산하고, 별도 진실로 두지 않습니다. 비어 있으면 원본 값을 사칭하지 않고 `—`로 보입니다(`Controller.ColorRow`의 `isEmpty` 원형).
- **`error`·`busy`는 정의가 아니라 런타임 상태입니다.** `error`와 런타임 availability는 runtime binding으로 Renderer에 전달하고, `busy`는 소유 컴포넌트가 "생성 중…" 비활성으로 처리합니다. 런타임 binding은 Published `readonly`·`disabled`를 다시 활성화할 수 없습니다.
- **편집 검증과 실행 검증을 나눕니다.** Provider는 `acceptsControllerDraftValue`로 입력 kind·범위·availability를 검사하되 길이를 초과한 text는 오류 표시를 위해 보존합니다. 외부 I/O 직전에는 `acceptsControllerExecutionValue`로 길이까지 검사하고, `readonly`·`disabled` control에는 발행 기본값만 허용합니다.
- **Definition 컴포지션은 단일 단계 `groups[] → controls[]`까지만 제공합니다.** 조건 노출·탭 분기·액션은 실제 생산자가 생기기 전까지 `visibleWhen` 류의 DSL로 추측하지 않습니다. **예외는 "브라우저 열기" 하나입니다** — 자산 카드는 값을 고르는 패널 없이는 성립하지 않아 액션이 컨트롤의 일부입니다. 이 액션만 킷이 갖고(`Controller.Browser`가 여는 상태를 소유), 나머지 액션·조건 노출은 계속 보류합니다.
- **트리거는 자기 브라우저 안에서만 존재합니다.** 여는 버튼은 `Controller.Browser.Trigger`로 그 브라우저의 컴파운드 안에만 살고, 무엇을 여는지 모르는 범용 `Controller.Trigger`는 만들지 않습니다 — 그런 트리거는 브라우저 밖에서도 타입이 통과해 검증되지 않는 계약이 됩니다. 짝은 구조로 강제됩니다: `Trigger`·`Panel`은 `Browser.Root`의 Dialog 컨텍스트가 없으면 렌더에서 죽습니다.
- **`Controller.Field`의 `action`은 컴포지션 슬롯입니다.** 라벨 행 오른끝에 버튼 하나(복사 등)를 놓는 ReactNode 자리이며, 직렬화 Definition의 어휘가 아닙니다 — 위의 "액션은 보류" 규칙은 Definition에 그대로 유효합니다. 카운터 자리를 대신 쓰지 않습니다: 카운터는 `n/max` 표시부라 조작 요소가 들어가면 계약이 거짓말이 됩니다. 그 자리에 넣는 표준 버튼은 `Controller.Action`입니다 — Row/Field 면 위에서는 색을 바꾸지 않고 `foreground/5`로 **겹칩니다**(ghost 기본 hover인 `bg-muted`는 면과 같은 색이라 묻힙니다). 같은 겹침 규칙을 `ROW_SELECT_TRIGGER`가 이미 쓰고 있어, 단계를 바꿀 때는 두 상수를 함께 옮깁니다. 원형은 MCP 화면의 명령 복사 버튼(`mcp-key-issuer.tsx`, 디자인 64:1283)입니다.
- **자산 브라우저의 목록은 패널이 열릴 때 가져옵니다.** 페이지는 시작 계약 하나만 싣고, 교체 후보 전체는 Provider가 `useLazyResource`로 들고 있다가 패널 본문(picker)이 마운트될 때 `*.client.ts`로 한 번 가져옵니다 — radix가 닫힌 패널 콘텐츠를 언마운트하므로 mount가 곧 "열림"입니다. 비었을 때의 세 사연(로딩·실패·후보 없음)은 `browseEmptyMessage`가 `Controller.AssetCard`의 `empty` 자리에 씁니다. 재시도 버튼은 두지 않습니다 — 닫았다 열면 다시 가져옵니다.
- **네임스페이스 객체(`Controller`)는 client 소비 전용입니다.** RSC에서 점 접근이 필요하면 개별 named export(`ControllerRow` 등)를 씁니다.

아키텍처 층과 원칙 — 컨트롤러는 다섯 층으로 쌓입니다: **디자인 SSOT**(Figma Controller API) → **Published Definition** → **Renderer·킷**(`ControllerRenderer` + `controller/`) → **Domain Sidebar** → **상태·서비스**(Studio Provider가 값을 소유하고 `*.client.ts`가 I/O를 소유). 층을 지키는 원칙:

- **킷은 도메인 무지.** `controller/` 파츠는 프롬프트·transform 같은 도메인 값을 모릅니다. 도메인이 붙는 컨트롤(TransformPad 소비 등)은 화면 폴더에 삽니다.
- **값 계약은 소비 서비스가 단일 소유.** transform 범위(`IMAGE_EDIT_TRANSFORM_LIMITS`)는 compose 서비스가 정의하고 어드민·스튜디오 UI가 함께 소비합니다 — UI 층에 범위 상수를 복제하지 않습니다.
- **기하는 대상에서 파생.** 패드 종횡비=대상 박스 비율, 배경 패드=캔버스 비율처럼 크기·비율은 조작 대상에서 계산합니다. 화면 상수 하드코딩 금지(헤더 높이 토큰 사례).
- **미배선 컨트롤은 disabled로 스테이징.** UI-first로 먼저 그리되, 아직 기능이 없는 컨트롤은 잠금(disabled)으로 정직하게 표시합니다 — 조작 가능해 보이는데 무반응인 거짓 컨트롤을 만들지 않습니다.
- **사이드바와 캔버스는 서로 모릅니다.** 화면의 편집 세션 상태는 features의 Provider가 단일 소유하고, `use-*-studio` 훅은 그 Context를 소비합니다. 사이드바(컨트롤러)와 작업 공간(캔버스)은 이 훅으로만 소통하며 서로 import하거나 props를 건네지 않습니다. 상태는 병렬 Record로 찢지 않고 단위 객체(슬롯 하나 = 상태 객체 하나)로 흐릅니다.
- **무엇을 그릴지는 편집 계약이 말합니다.** 공통 컨트롤 정의는 각 `StudioConfig.controller.groups`에서 소비하고, Template slot 같은 도메인 binding과 descriptor는 각 Config의 확장에서 소비합니다. Sidebar는 원시 Payload 필드나 nodeConfigs를 다시 해석하지 않습니다. 계약에는 Definition만 싣고 세션 값은 싣지 않습니다. 그래픽의 `type: 'p5' | 'shader'`는 runtime 선택에만 사용하며 Controller Definition과 현재 값을 결정하지 않습니다.
- **Template은 Image Config를 참조합니다.** Template Image Slot은 Image Config나 Image Provider를 복제·중첩하지 않습니다. Published Image Config를 참조하고 슬롯 문맥에서 options를 좁혀 씁니다. 슬롯 ratio override도 원본 Image Config가 허용한 options 안에서만 선택합니다.
- **Template 배경은 Graphic Config도 참조합니다.** Template은 Graphic Config나 Graphic Provider를 복제·중첩하지 않고, 선택한 Config의 Controller Definition과 세션 값을 Graphic 도메인의 Preview adapter에 전달해 P5·WebGL을 그대로 재생합니다. Template Runtime은 합성 결과를 Raster Artifact로 발행하고, PNG/JPEG/TIFF/PDF/정지 프레임 MP4 변환은 공통 Export Layer가 맡습니다. runtime binding과 Controller Renderer는 같은 Config를 소비하므로 그래픽별 입력 해석은 Template에 두지 않습니다.
- **Image Profile이 이미지 기능을 소유합니다.** `ImageStudioConfig.image.features`는 `color-adjustment`·`camera-control` 같은 capability와 semantic control id 참조만 싣고, 실제 값·기본값·availability는 `controller.groups`가 계속 소유합니다. Image Studio와 Template은 같은 `ImageProfileFeatureRenderer`를 소비합니다. Template의 기존 `imageColorize`는 capability가 아니라, 선택한 Profile이 해당 feature를 지원할 때만 적용되는 값 override로만 투영합니다.
- **확장 디스패처는 도메인별로 둡니다.** 공통 `ControllerRenderer`의 primitive switch는 닫힌 데이터 어휘이고, Image feature와 Graphic runtime은 각각 자기 도메인의 단일 exhaustive dispatcher가 해석합니다. 기존 feature·runtime을 조합한 새 Profile·Config는 데이터 추가만으로 소비되며, 새로운 feature·graphic 구현만 해당 dispatcher에 한 번 등록합니다. Studio별 variant prop이나 `visibleWhen` DSL로 공용 Renderer를 늘리지 않습니다.
- **실행 정책은 서비스가 다시 강제합니다.** Route·Agent·MCP는 같은 도메인 서비스를 호출합니다. 서비스는 Published Config를 기준으로 options·최대 길이·readonly와 camera capability를 검증합니다. Sidebar의 비활성 표현만 신뢰 경계로 사용하지 않습니다.
- **계약이 화면 수명 중 교체되면 어드민 층만 갈아끼웁니다.** 이미지 스튜디오처럼 사용자가 프로파일(계약 원천)을 바꿀 수 있는 화면은, 프로파일이 정의한 것만 새 계약을 따르고 사용자가 만든 것은 남깁니다 — 프롬프트·생성 결과·선택은 유지하고, 계약이 정의한 선택은 새 선택지에 없을 때만 시작값으로 되돌립니다(원형: `use-image-studio`의 `selectProfile`). 비용이 든 산출물을 계약 교체가 조용히 버리지 않습니다. 단 **선택지가 없는 프로파일 고유 값(색 조정처럼 자유 입력)은 언제나 새 계약의 기본값으로 되돌립니다** — 유지할 근거(새 레인지에 그 값이 있다는 사실)가 없고, 앞 프로파일의 색이 남으면 다른 프로파일의 기본값을 사칭합니다.
- **잠금은 availability와 선택지에서 결정합니다.** Admin이 명시한 `readonly`·`disabled`를 Published Definition으로 유지하고, 유효한 선택지가 하나일 때도 읽기 전용으로 파생합니다. 동일한 의미의 별도 lock boolean은 두지 않습니다.

## 4. 스타일 계약 Do/Don't

className과 style에는 시맨틱 토큰만 씁니다(닫힌 토큰 규칙 전문은 `docs/09-design-system.md` §4). 생 색·생 팔레트 클래스·동적 클래스는 금지입니다. 아래 ❌ 행 중 file:line이 붙은 것은 저장소에 실제로 남아 있는 위반이고, file:line이 없는 행(예: `@hugeicons/*`)은 정책 참조입니다. 새 코드는 ✅를 따릅니다.

글자 크기는 `docs/09` §6의 고정 유틸리티 단계만 사용합니다. `clamp()`·`vw`·반응형 `text-*`·임의 글자 크기는 추가하지 않습니다. 크기 variant는 패딩과 높이를 바꿀 수 있지만, 일반 컨트롤은 `text-sm`/`size-4`, 큰 컨트롤은 `text-base`/`size-5` 조합을 유지합니다.

아래 「❌를 본 자리」는 **박제된 실측 예시**입니다 — 실제 위반을 보여 주려고 남기며, 고쳐진 뒤에도 예시로서의 값은 남습니다. 🔴 그러므로 **현재 위반 목록으로 읽지 마십시오.** 지금 남은 위반은 `docs/09` §4의 grep으로 세십시오.

| ✅ Do | ❌ Don't | ❌를 본 자리 |
| --- | --- | --- |
| `border-border` | `border border-neutral-200` | `blocks/callout/component.tsx` |
| `bg-muted` / `bg-fill-muted` | `bg-neutral-50 … dark:bg-neutral-950` | `widgets/type-specimen/component.tsx` — ✅ 2026-08-12에 `THEME_PANEL`로 고침 |
| 조건부 완전 클래스 룩업 | `` `grid gap-4 md:grid-cols-${variant}` `` | `blocks/content-columns/component.tsx:21` |
| 심볼 + 텍스트로 상태 구분 | 색만으로 판정 구분 | `blocks/callout/component.tsx` (kind별 badge) |
| 상태 토큰 `bg-success/15 text-success` | 유채 팔레트 `bg-emerald-500/15 text-emerald-700 …` | `studio/review/result/check-status.ts` — ✅ 고쳐짐(이제 Badge variant 키만 갖는다) |
| `Typography` 재사용 | `font-body text-sm font-normal` 수기 반복 | studio 10개 파일 25회 실측 |
| `@carbon/icons-react` | `@hugeicons/*` | repo 컨벤션(정책) |

### 생 색·생 팔레트 금지

className·style 리터럴에 생 hex(`#a1b2c3`), 생 Tailwind 팔레트, `oklch()`를 직접 쓰지 않습니다. 팔레트 금지는 무채색(`neutral`/`gray`/`zinc`/`slate`/`stone`)만이 아니라 **유채색 전체**(`emerald`/`sky`/`amber`/`orange` 등)입니다. `border-border`, `bg-muted`, `text-foreground` 같은 시맨틱 토큰만 쓰고, 성공/정보/경고/실패 같은 판정·상태 표시는 상태 토큰(`success`/`info`/`warning`/`destructive`, `docs/09` §4)을 씁니다 — 상태 토큰으로 표현이 안 되면 팔레트로 우회하지 말고 `docs/09`와 `theme.css`에 토큰을 추가합니다. 예외는 §5의 색 데이터 컴포넌트가 props/CMS로 받는 hex뿐입니다(스타일이 아니라 데이터).

탐지 grep:

```bash
# 생 팔레트 클래스 (무채 + 유채 전체)
grep -rnE '(bg|text|border|ring|fill|from|to|via)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|neutral|gray|zinc|slate|stone)-[0-9]' src

# className/style 안의 생 hex
grep -rnE 'className=.*#[0-9a-fA-F]{6}' src

# oklch 리터럴(토큰 정의 파일 밖)
grep -rn 'oklch(' src --include='*.tsx'
```

### 동적 Tailwind 클래스 금지

`grid-cols-${n}`처럼 문자열 보간으로 클래스를 만들면 Tailwind가 빌드 타임에 그 클래스를 인식하지 못해 스타일이 유실됩니다. `blocks/content-columns/component.tsx:21`이 이 위반입니다. 조건부로 완전한 클래스를 룩업합니다.

```tsx
// ❌ blocks/content-columns/component.tsx:21
GRID_CLASS = `grid gap-4 md:grid-cols-${variant}`

// ✅ 완전 클래스 룩업
const GRID_BY_COLUMNS = {
	1: 'flex flex-col gap-10',
	2: 'grid gap-4 md:grid-cols-2',
	3: 'grid gap-4 md:grid-cols-3',
} as const
```

탐지 grep:

```bash
grep -rnE '(grid-cols|col-span|gap|w|h|text)-\$\{' src
```

### 폭·표면색·세로 리듬은 프레임이 소유

- 개별 블록·컴포넌트가 자기 `max-width`를 갖지 않습니다. 콘텐츠 최대 폭은 `ContentFrame`에만 있습니다(`content-frame.tsx:22`의 `max-w-[1540px]`). 예외는 프리미티브의 **내재 콘텐츠 폭**뿐입니다 — `dialog`의 `max-w-sm`, `tooltip`의 `max-w-xs`, `bubble`의 `max-w-[80%]`처럼 오버레이·말풍선이 자기 판형을 갖는 것은 페이지 폭 소유가 아닙니다. 금지 대상은 화면·블록 컴포넌트가 페이지 폭을 스스로 좁히는 것(`<Card className="max-w-2xl">` 등)입니다.
- 표면 배경색은 컴포넌트 안에 칠하지 않고 `GuidelineBlockFrame`의 `variant`(`normal`/`secondary`/`inverted`)로 받습니다.
- 블록 간 세로 리듬도 프레임이 소유합니다(`content-frame.tsx:21`의 `py-8`). 개별 컴포넌트가 자기 상하 여백을 다시 잡지 않습니다.

## 5. 브랜드 무관

색·폰트·로고는 props로 주입받습니다. 코드에 브랜드를 하드코딩하지 않습니다. 하드코딩은 개발용 default 값(HD현대 팔레트)으로만 허용합니다.

- 컴포넌트가 받는 색은 hex string props입니다. RGB·전경색 같은 파생값은 저장하지 않고 런타임에 `@/lib/color`로 파생합니다: `hexToRgb`로 0–255 RGB를, `getContrastingForeground`로 배경 대비가 더 높은 흑/백 전경색을 얻습니다.
- 원형은 `src/features/guideline/widgets/hd-color-palette/view.tsx`입니다. Swatch는 `{ id, name, hex, cmyk?, pantone? }` 형태로 받고, RGB·전경색은 hex에서 파생하며, 값은 전부 `brand-colors`에서 옵니다 — 하드코딩된 기본 팔레트가 없습니다.

```tsx
import { getContrastingForeground, hexToRgb } from '@/lib/color'

type Swatch = { id: string; name: string; hex: string; pantone?: string }

// 기본값(default)만 HD현대 샘플. 실제 값은 props/CMS로 주입.
const MAIN: Swatch[] = [
	{ id: 'heritage-green', name: 'HD HERITAGE GREEN', hex: '#00AF41' },
]
```

기존에 남아 있는 생 팔레트 클래스(위젯 5종 · `blocks/content-columns/component.tsx`의 동적 클래스 1건)는 POC를 위한 **의도적 부채**이며 이 규칙과 별개입니다. 새 컴포넌트가 그 부채를 늘리지 않습니다.

## 6. 접근성

접근성은 `docs/08-accessibility-i18n.md`가 소유합니다. 컴포넌트 레벨에서 생략하면 안 되는 최소선만 여기 둡니다.

- **키보드 조작**: 커스텀 인터랙션 요소는 `role`과 `aria-*`, 화살표 키 이동을 갖춥니다. 슬라이더면 `role="slider"` + `aria-valuenow`처럼 역할에 맞는 속성을 붙입니다.
- **focus 가시성**: `focus-visible:ring` 계열로 포커스를 시각적으로 드러냅니다. `badge.tsx`의 `focus-visible:ring-[3px] focus-visible:ring-ring/50`이 참고입니다.
- **색만으로 상태 구분 금지**: 판정·상태는 심볼 + 텍스트를 함께 씁니다. `blocks/callout/component.tsx`는 kind별로 심볼(`✓`/`△`/`✕`)과 라벨(`반드시`/`권장`/`금지`)을 같이 노출합니다.
- **label 연결**: 입력 요소는 `label`/`aria-label`/`aria-labelledby`로 접근 가능한 이름을 갖습니다. `widgets/type-specimen/component.tsx`의 textarea는 `aria-label="타입 견본 입력"`을 답니다.
- **실패 상태 텍스트 설명**: 검수 실패·저장 실패 같은 조치가 필요한 상태는 텍스트로 원인과 다음 행동을 설명합니다(`docs/08` §2).

## 7. 자기 검증

비자명한 로직에는 실행 가능한 검증을 하나 남깁니다. 분기, 루프, 파서, 클립보드 조작, 색 계산이 여기 해당합니다. 검증은 컴포넌트 옆에 `*.test.ts`로 co-locate하고 vitest로 실행합니다. 프레임워크·픽스처는 추가하지 않고, 로직이 깨지면 실패하는 가장 작은 것 하나면 됩니다.

- 참고: `src/components/ui/typography.test.ts`, `src/lib/color.test.ts`(`hexToRgb('#fff')` → `{ r: 255, g: 255, b: 255 }`, `getContrastingForeground('#FFFFFF')` → `'#000000'`).
- 자명한 one-liner(단순 wrapper, 순수 조합)에는 테스트를 만들지 않습니다. YAGNI는 테스트에도 적용됩니다.

## 8. Payload Admin 표면 예외

`src/components/admin`은 Payload Admin 런타임 위에서 돌므로 아래 항목만 계약과 다릅니다. 여기 명시되지 않은 나머지(재사용 사다리, 시맨틱 토큰, `cn`, named export, kebab-case, carbon 아이콘, 자기 검증)는 그대로 적용합니다. 원형은 `src/components/admin/template/`(shadcn 재구축 그룹)입니다.

- **`use client`**: Payload form 컨텍스트(`useField`/`useForm`/`useFormFields`)에 접속하는 필드 컴포넌트는 무조건 client입니다. "조건부" 규칙의 예외가 아니라 client 의존성 기준을 충족하는 경우입니다. RSC로 남길 수 있는 것은 폼 밖 조회 화면(`DashboardSummary` 등)뿐입니다.
- **`@payloadcms/ui` 유지 목록**: 동작을 소유한 컴포넌트는 shadcn으로 갈아끼우지 않습니다 — `RelationshipField`(관계 검색·페이지네이션), `PublishButton`(저장 파이프라인), `Gutter`(admin 폭), `Popup`(admin 포털·z-index), `toast`. 그 밖의 표현은 `src/components/ui` 프리미티브를 씁니다(`template-layer-editors.tsx` 원형).
- **토큰 원천**: admin의 라이트/다크는 Payload가 `--theme-*`로 소유하고, `src/app/(payload)/admin-tailwind.css`의 `@theme inline`이 시맨틱 토큰을 `--theme-*`에 재매핑합니다. 따라서 admin 컴포넌트도 `bg-muted`/`border-border` 같은 **시맨틱 토큰 클래스를 그대로** 씁니다. 새 코드가 `--theme-elevation-*`를 인라인으로 직접 참조하지 않습니다.
- **`data-slot` 미부여**: admin 컴포넌트 루트에는 자체 `data-slot`을 붙이지 않습니다. `custom.scss`가 `[data-slot=…]` 셀렉터를 프리미티브 외부 스타일링 훅으로 쓰고 있어, 화면 컴포넌트까지 부여하면 SCSS 축소 방향과 상충합니다.
- **프레임 계약 미적용**: 폭·표면색은 Payload 레이아웃이 소유하므로 `ContentFrame`/`GuidelineBlockFrame`을 쓰지 않습니다.
- **cva·`asChild` 해당 없음**: admin 에디터는 시각 variant가 없는 일회성 화면이라 적용 대상이 없습니다. 억지로 만들지 않습니다.
- **기하 계산 inline style 허용**: iframe scale, 오버레이 핸들 좌표, depth 인덴트, CSS mask처럼 런타임 계산값은 inline `style`이 정당합니다. 색·간격 상수는 여기 넣지 않습니다.
- **dialkit**: 레이아웃 수치 튜닝 노브는 `useDialKit` + `admin-dialkit-provider`로 admin에만 둡니다. Creator UI에 들이지 않습니다.

## 9. 복붙용 체크리스트

PR을 올리기 전 자기 점검용입니다.

- [ ] 사다리를 내려갔다. `ls src/components/ui`로 기존 프리미티브를 먼저 확인했고, 조합으로 안 될 때만 새로 만들었다.
- [ ] variant형은 `badge.tsx`(cva), 크기 분기형은 `card.tsx`(data-size + CSS 변수) 원형을 복제했다.
- [ ] 루트에 `data-slot`을 붙였고(화면 컴포넌트 포함, admin 표면 제외 — §8), className 병합은 `@/lib/utils`의 `cn`만 썼다. 문자열 결합이 없다.
- [ ] 도메인 데이터를 받는 화면 컴포넌트는 명명된 Props 타입이고, DOM 래퍼는 `React.ComponentProps` 확장이다.
- [ ] PascalCase named export만 있다. `default` export가 없다.
- [ ] 다형 렌더링은 `asChild` + `radix-ui` `Slot`이다. 새 `as` prop이 없다.
- [ ] §4의 팔레트 탐지 grep(무채 + 유채 전체) 결과가 이 컴포넌트에서 0이다. 판정·상태 색은 상태 토큰(`success`/`info`/`warning`/`destructive`)이다.
- [ ] `grep -rE 'className=.*#[0-9a-fA-F]{6}'`에 걸리는 생 hex가 없다(색 데이터 props는 예외).
- [ ] `grep -rE '(grid-cols|col-span|gap)-\$\{'`에 걸리는 동적 클래스가 없다. 조건부 완전 클래스로 바꿨다.
- [ ] 자기 `max-width`가 없다. 폭은 `ContentFrame`, 표면색은 `GuidelineBlockFrame`이 소유한다.
- [ ] 아이콘은 `@carbon/icons-react`다. `@hugeicons`가 없다.
- [ ] 색·폰트·로고를 props로 받는다. 하드코딩은 개발용 default 값뿐이다.
- [ ] 색·전경색은 저장하지 않고 `@/lib/color`로 런타임 파생한다.
- [ ] 상태를 색만으로 구분하지 않는다. 심볼 + 텍스트를 함께 쓴다.
- [ ] 글자 크기는 `docs/09` §6의 고정 유틸리티 단계만 사용한다.
- [ ] focus-visible ring, 키보드 조작, label 연결이 있다.
- [ ] 순수 조합 컴포넌트에 `use client`를 붙이지 않았다.
- [ ] fetch·loading·error를 컴포넌트 `useState`로 복제하지 않았다 — HTTP I/O는 `*.client.ts`, 화면 상태 묶음은 feature 훅이 소유한다. `src/components` 안에 도메인 Context를 만들지 않았다.
- [ ] 시각 variant는 cva다. 상태→색 룩업 테이블이나 클래스 반환 헬퍼 함수가 없다.
- [ ] motion은 `motion/react`의 `LazyMotion` + `m`이고, `shouldReduceMotion`을 props로 내리지 않았다.
- [ ] 비자명 로직에 co-located `*.test.ts` 하나가 있다. one-liner엔 없다.
