# 10. 컴포넌트 저작 규칙

이 문서는 Creator UI와 guideline 화면에 새 React 컴포넌트를 추가할 때 지켜야 할 저작 계약을 정리합니다. 컴포넌트는 반복해서 늘어나고, 매번 조금씩 다르게 만들면 드리프트가 쌓입니다. 여기서는 "매번 같은 계약"을 강제해 발명과 드리프트를 막습니다. 파운데이션(토큰 지도·닫힌 토큰 규칙·프레임 골격)은 `docs/09-design-system.md`가 소유하며 이 문서는 그 위에서 컴포넌트 저작만 다룹니다. 배치·네이밍·계층 경계는 `docs/06-project-structure.md`, 접근성 기준은 `docs/08-accessibility-i18n.md`, 토큰 값은 CSS 원천(`src/app/(frontend)/theme.css`·`typeset.css`)이 소유합니다. 이 문서는 그 원천을 링크만 하고 값을 다시 쓰지 않습니다.

## 1. 목적

컴포넌트는 이 저장소에서 가장 자주 추가되는 산출물이면서, 슬롭(slop) 위험이 가장 큰 지점입니다. 같은 헤딩을 새로 만들고, 같은 색을 생 hex로 다시 칠하고, `cn`을 또 구현하는 식의 중복이 컴포넌트마다 다른 모양으로 재발합니다. 이 문서의 목적은 그 재발을 규칙 하나로 차단하는 것입니다.

- 값·토큰(oklch, radius, hex 등)은 CSS 원천(`src/app/(frontend)/theme.css`·`typeset.css`)만 소유합니다. 그 토큰 지도와 닫힌 토큰 규칙은 `docs/09-design-system.md` §3~4가 소유합니다. 이 문서에 값을 복제하지 않습니다.
- 파일 배치, `use client` 경계, 네이밍은 `docs/06-project-structure.md`가 소유합니다. 여기서는 링크하고 최소한만 재서술합니다.
- 이 문서가 소유하는 것은 "컴포넌트를 만들 때 매번 따르는 계약"뿐입니다: 재사용 사다리, 템플릿, 스타일 Do/Don't, 브랜드 무관, 접근성 최소선, 자기 검증, kit→block 승격 게이트입니다.

## 2. 시작 전 재사용 사다리

코드를 쓰기 전에 Ponytail 사다리를 먼저 내려갑니다. 첫 번째로 걸리는 칸에서 멈춥니다.

1. **이 컴포넌트가 존재할 필요가 있나?** 투기적 필요면 만들지 않습니다. (YAGNI)
2. **이미 저장소에 있나?** `src/components/ui`의 프리미티브를 먼저 grep합니다. 몇 파일 옆에 있는 것을 다시 구현하는 것이 가장 흔한 슬롭입니다.
3. **조합으로 되나?** 기존 프리미티브를 조합합니다.
4. **그래도 없으면** 최소 코드로 새로 만듭니다.

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
| 아이콘 | `@carbon/icons-react` |
| className 병합 | `@/lib/utils`의 `cn` |
| 색 파생(전경색·RGB) | `@/lib/color` (`hexToRgb`, `getContrastingForeground`) |
| 콘텐츠 최대 폭 | `GuidelineContentFrame` |
| 블록 표면색(배경) | `GuidelineBlockFrame` |
| kit 갤러리 데모 래핑 | `CollapsibleDemo` (`src/features/guideline/components/kit/collapsible-demo.tsx`) |

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
			default: 'bg-primary text-primary-foreground …',
			outline: 'border-border bg-input/20 text-foreground …',
		},
	},
	defaultVariants: { variant: 'default' },
})

function Badge({ className, variant = 'default', asChild = false, ...props }:
	React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : 'span'
	return <Comp data-slot="badge" data-variant={variant}
		className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

`badge.tsx`에서 그대로 가져오는 계약: variant 정의는 `cva`의 `variants`에, 기본값은 `defaultVariants`에 둡니다. 루트에 `data-slot`을 붙이고, variant 상태는 `data-variant`로 노출합니다. 다형 렌더링은 `asChild` + `radix-ui`의 `Slot`으로 하고, 별도 `as` prop을 새로 만들지 않습니다.

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
| className 병합 | `@/lib/utils`의 `cn`만 사용 | `utils.ts`: `twMerge(clsx(inputs))` |
| 루트 식별 | 루트 요소에 `data-slot="<name>"` | `badge.tsx`, `card.tsx`, `typography.tsx` |
| 다형 렌더링 | `asChild` + `radix-ui` `Slot`, 별도 `as` prop 금지 | `badge.tsx` |
| 아이콘 | `@carbon/icons-react` | repo 컨벤션(저장소 24개 파일 채택) |
| 파일명 | kebab-case (`type-specimen-block.tsx`) | `docs/06` §10 |
| export | PascalCase named export, `default` export 금지 | `badge.tsx`, `card.tsx`, `typography.tsx` |
| 타입 import | `import type … from 'react'` | `card.tsx`, `typography.tsx` |
| `use client` | 상태·이벤트가 있을 때만 조건부. 순수 조합엔 붙이지 않음 | `docs/06` |

`Typography`는 cva·`data-slot`·named export 계약을 따르는 참고 구현입니다. `cva('', { variants: { family, size, tone, weight } })`에 `data-slot="typography"`, `data-size`를 붙이고 named export만 합니다. 단, 다형 렌더링은 `asChild`가 아니라 `as` prop으로 처리합니다 — HTML 요소(`h1`~`p`/`span`)만 교체하고 컴포넌트 합성이 필요 없는 경우의 기존 예외이며, 새 컴포넌트는 위 표대로 `asChild` + `Slot`을 씁니다.

## 4. 스타일 계약 Do/Don't

className과 style에는 시맨틱 토큰만 씁니다(닫힌 토큰 규칙 전문은 `docs/09-design-system.md` §4). 생 색·생 팔레트 클래스·동적 클래스는 금지입니다. 아래 ❌ 행 중 file:line이 붙은 것은 저장소에 실제로 남아 있는 위반이고, file:line이 없는 행(예: `@hugeicons/*`)은 정책 참조입니다. 새 코드는 ✅를 따릅니다.

| ✅ Do | ❌ Don't | repo 실측 |
| --- | --- | --- |
| `border-border` | `border border-neutral-200` | `callout-block.tsx:33` |
| `bg-muted` / `bg-fill-muted` | `bg-neutral-50 … dark:bg-neutral-950` | `type-specimen-block.tsx:51` |
| 조건부 완전 클래스 룩업 | `` `grid gap-4 md:grid-cols-${variant}` `` | `content-columns-block.tsx:21` |
| 심볼 + 텍스트로 상태 구분 | 색만으로 판정 구분 | `callout-block.tsx` (kind별 badge) |
| `@carbon/icons-react` | `@hugeicons/*` | repo 컨벤션(정책) |

### 생 색·생 팔레트 금지

className·style 리터럴에 생 hex(`#a1b2c3`), 생 Tailwind 팔레트(`-neutral-`/`-gray-`/`-zinc-`/`-slate-`/`-stone-` + 숫자), `oklch()`를 직접 쓰지 않습니다. `border-border`, `bg-muted`, `text-foreground` 같은 시맨틱 토큰만 씁니다. 예외는 §5의 색 데이터 컴포넌트가 props/CMS로 받는 hex뿐입니다(스타일이 아니라 데이터).

탐지 grep:

```bash
# 생 팔레트 클래스
grep -rnE '(bg|text|border|ring|fill|from|to|via)-(neutral|gray|zinc|slate|stone)-[0-9]' src

# className/style 안의 생 hex
grep -rnE 'className=.*#[0-9a-fA-F]{6}' src

# oklch 리터럴(토큰 정의 파일 밖)
grep -rn 'oklch(' src --include='*.tsx'
```

### 동적 Tailwind 클래스 금지

`grid-cols-${n}`처럼 문자열 보간으로 클래스를 만들면 Tailwind가 빌드 타임에 그 클래스를 인식하지 못해 스타일이 유실됩니다. `content-columns-block.tsx:21`이 이 위반입니다. 조건부로 완전한 클래스를 룩업합니다.

```tsx
// ❌ content-columns-block.tsx:21
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

- 개별 블록·컴포넌트가 자기 `max-width`를 갖지 않습니다. 콘텐츠 최대 폭은 `GuidelineContentFrame`에만 있습니다(`guideline-content-frame.tsx:22`의 `max-w-[1250px]`).
- 표면 배경색은 컴포넌트 안에 칠하지 않고 `GuidelineBlockFrame`의 `variant`(`normal`/`secondary`/`inverted`)로 받습니다.
- 블록 간 세로 리듬도 프레임이 소유합니다(`guideline-content-frame.tsx:21`의 `py-16`). 개별 컴포넌트가 자기 상하 여백을 다시 잡지 않습니다.

## 5. 브랜드 무관

색·폰트·로고는 props로 주입받습니다. 코드에 브랜드를 하드코딩하지 않습니다. 하드코딩은 개발용 default 값(essenherb 샘플)으로만 허용합니다.

- 컴포넌트가 받는 색은 hex string props입니다. RGB·전경색 같은 파생값은 저장하지 않고 런타임에 `@/lib/color`로 파생합니다: `hexToRgb`로 0–255 RGB를, `getContrastingForeground`로 배경 대비가 더 높은 흑/백 전경색을 얻습니다.
- 원형은 `src/features/guideline/components/kit/color-palette.tsx`입니다. Swatch는 `{ id, name, hex, pantone? }` 형태로 받고, RGB는 hex에서 파생하며, 기본값만 essenherb 팔레트입니다("브랜드 무관: 색은 props. 기본값은 essenherb. RGB는 HEX에서 파생").

```tsx
import { getContrastingForeground, hexToRgb } from '@/lib/color'

type Swatch = { id: string; name: string; hex: string; pantone?: string }

// 기본값(default)만 essenherb 샘플. 실제 값은 props/CMS로 주입.
const MAIN: Swatch[] = [
	{ id: 'main-red', name: 'Essenherb Red', hex: '#EA5343', pantone: 'Warm Red C' },
]
```

`src/features/*/essenherb-palette.ts` 같은 기존 하드코딩은 POC를 위한 **의도적 부채**이며 이 규칙과 별개입니다. 새 컴포넌트가 그 부채를 늘리지 않습니다.

## 6. 접근성

접근성은 `docs/08-accessibility-i18n.md`가 소유합니다. 컴포넌트 레벨에서 생략하면 안 되는 최소선만 여기 둡니다.

- **키보드 조작**: 커스텀 인터랙션 요소는 `role`과 `aria-*`, 화살표 키 이동을 갖춥니다. 슬라이더면 `role="slider"` + `aria-valuenow`처럼 역할에 맞는 속성을 붙입니다.
- **focus 가시성**: `focus-visible:ring` 계열로 포커스를 시각적으로 드러냅니다. `badge.tsx`의 `focus-visible:ring-[3px] focus-visible:ring-ring/50`이 참고입니다.
- **색만으로 상태 구분 금지**: 판정·상태는 심볼 + 텍스트를 함께 씁니다. `callout-block.tsx`는 kind별로 심볼(`✓`/`△`/`✕`)과 라벨(`반드시`/`권장`/`금지`)을 같이 노출합니다.
- **label 연결**: 입력 요소는 `label`/`aria-label`/`aria-labelledby`로 접근 가능한 이름을 갖습니다. `type-specimen-block.tsx`의 textarea는 `aria-label="타입 견본 입력"`을 답니다.
- **실패 상태 텍스트 설명**: 검수 실패·저장 실패 같은 조치가 필요한 상태는 텍스트로 원인과 다음 행동을 설명합니다(`docs/08` §2).

## 7. 자기 검증

비자명한 로직에는 실행 가능한 검증을 하나 남깁니다. 분기, 루프, 파서, 클립보드 조작, 색 계산이 여기 해당합니다. 검증은 컴포넌트 옆에 `*.test.ts`로 co-locate하고 vitest로 실행합니다. 프레임워크·픽스처는 추가하지 않고, 로직이 깨지면 실패하는 가장 작은 것 하나면 됩니다.

- 참고: `src/components/ui/typography.test.ts`, `src/lib/color.test.ts`(`hexToRgb('#fff')` → `{ r: 255, g: 255, b: 255 }`, `getContrastingForeground('#FFFFFF')` → `'#000000'`).
- 자명한 one-liner(단순 wrapper, 순수 조합)에는 테스트를 만들지 않습니다. YAGNI는 테스트에도 적용됩니다.

## 8. kit→block 승격 게이트

`src/features/guideline/components/kit`은 dev 전용 스크래치 공간입니다. `/guideline/kit`은 `NODE_ENV=development`에서만 로드되고 production에서는 404입니다. 여기 있는 실험물은 언제든 정리·삭제 대상이며, 제품 데이터 흐름의 일부가 아닙니다.

kit 컴포넌트를 제품 경로(`../blocks`, `../blocks/children`)로 옮기려면 **아래를 모두 만족**해야 합니다.

- Payload block renderer에 실제로 연결된다.
- default props를 데이터(props/CMS)로 전환했다(§5).
- 접근성 최소선을 통과한다(§6).
- 비자명 로직에 self-check가 존재한다(§7).
- 시맨틱 토큰만 쓴다(§4).

승격 절차:

1. 파일을 `kit`에서 `blocks/` 또는 `blocks/children`으로 이동한다.
2. 갤러리 데모 래퍼(`~Demo`, `CollapsibleDemo`)를 제거한다.
3. block renderer 맵에 등록한다.

검증되지 않은 kit 실험을 `blocks`/`children`으로 직행시키지 않습니다. 블록화 로드맵은 kit README(`src/features/guideline/components/kit/README.md`)를 따릅니다.

## 9. 복붙용 체크리스트

PR을 올리기 전 자기 점검용입니다.

- [ ] 사다리를 내려갔다. `ls src/components/ui`로 기존 프리미티브를 먼저 확인했고, 조합으로 안 될 때만 새로 만들었다.
- [ ] variant형은 `badge.tsx`(cva), 크기 분기형은 `card.tsx`(data-size + CSS 변수) 원형을 복제했다.
- [ ] 루트에 `data-slot`을 붙였고, className 병합은 `@/lib/utils`의 `cn`만 썼다.
- [ ] PascalCase named export만 있다. `default` export가 없다.
- [ ] 다형 렌더링은 `asChild` + `radix-ui` `Slot`이다. 새 `as` prop이 없다.
- [ ] `grep -rE '(bg|text|border|ring|fill)-(neutral|gray|zinc|slate|stone)-[0-9]'` 결과가 이 컴포넌트에서 0이다.
- [ ] `grep -rE 'className=.*#[0-9a-fA-F]{6}'`에 걸리는 생 hex가 없다(색 데이터 props는 예외).
- [ ] `grep -rE '(grid-cols|col-span|gap)-\$\{'`에 걸리는 동적 클래스가 없다. 조건부 완전 클래스로 바꿨다.
- [ ] 자기 `max-width`가 없다. 폭은 `GuidelineContentFrame`, 표면색은 `GuidelineBlockFrame`이 소유한다.
- [ ] 아이콘은 `@carbon/icons-react`다. `@hugeicons`가 없다.
- [ ] 색·폰트·로고를 props로 받는다. 하드코딩은 essenherb default뿐이다.
- [ ] 색·전경색은 저장하지 않고 `@/lib/color`로 런타임 파생한다.
- [ ] 상태를 색만으로 구분하지 않는다. 심볼 + 텍스트를 함께 쓴다.
- [ ] focus-visible ring, 키보드 조작, label 연결이 있다.
- [ ] 순수 조합 컴포넌트에 `use client`를 붙이지 않았다.
- [ ] 비자명 로직에 co-located `*.test.ts` 하나가 있다. one-liner엔 없다.
- [ ] (kit→제품 이동 시) §8 게이트를 모두 통과했고 `~Demo` 래퍼를 제거했다.
