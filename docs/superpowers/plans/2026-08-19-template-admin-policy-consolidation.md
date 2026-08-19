# 템플릿 어드민 정책 소유자 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 템플릿 어드민에서 창작자 정책의 소유자를 레이어·배경·출력 셋으로 나누고, 같은 값을 두 곳에서 정하던 `Controller 제한`·`Controller 표현` 패널을 없앤다.

**Architecture:** 템플릿의 컨트롤러 매니페스트는 코드에 없고 `getTemplateRuntimeManifest`가 `html`+`overrides`에서 파생한다. 그래서 파생 결과를 다시 좁히는 `controllerRestrictions`는 순환이었다. 정책 입력을 파생 함수의 인자로 끌어올려 `backgroundPolicy`·`textPolicy`가 매니페스트를 만들 때 직접 반영되게 하고, 레이어 정책은 이미 소유자인 `overrides[nodeId]`에 남긴다.

**Tech Stack:** Next.js App Router · Payload CMS · TypeScript · zod 아님(도메인 수제 assert) · vitest · Biome(탭 들여쓰기) · Node 22 · pnpm

**Spec:** `docs/superpowers/specs/2026-08-19-template-admin-policy-consolidation-design.md`

## Global Constraints

- 테스트·빌드·마이그레이션은 Node 22로 돌린다. `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22`
- 브랜치는 `refactor/template-admin-policy-consolidation` 하나를 쓴다. 새 브랜치·worktree를 만들지 않는다.
- 커밋은 `<type>: <한국어 요약>` Conventional Commits. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- 스키마를 바꾸는 커밋은 Task 7의 마이그레이션 하나로 모은다. 중간 Task에서 `pnpm migrate:create`를 돌리지 않는다.
- 들여쓰기는 탭. 주석은 한국어. `pnpm check`가 포맷 정본이다.
- 정책 목록이 비어 있음(`undefined`)은 "전부 허용"이다. `exportPolicy`가 이미 쓰는 규칙과 같게 맞춘다.
- 🔴 `.env`의 `DATABASE_URL`은 공유 Supabase다. 어떤 Task에서도 이 DB에 쓰지 않는다. 마이그레이션 검증은 새 로컬 DB에서만 한다.

## 스펙에서 바뀐 결정 하나

스펙은 "`types`에 `color`가 없으면 `background.color` 컨트롤을 만들지 않는다"고 적었다. **컨트롤은 항상 만들고 `values`로만 좁힌다**로 바꾼다.

이유: `TemplateBackgroundSlot.colorControlId`가 필수 필드고 `parseTemplateStudioConfig`가 그 id의 color 컨트롤 존재를 검증한다. 컨트롤을 없애면 필드를 optional로 바꿔야 하고 `background-section.tsx`·`template-studio-provider.tsx`까지 optional 처리가 번진다. 컨트롤을 남겨도 창작자는 `type === 'color'`일 때만 그 자리에 닿으므로 도달 불가한 컨트롤이 될 뿐이다. Task 1에서 스펙 문서도 같이 고친다.

## File Structure

| 파일 | 책임 | 상태 |
| --- | --- | --- |
| `src/features/template-customization/domain/template-studio-config.ts` | 정책 타입, 매니페스트 파생, 슬롯 파생, strict 검증 | 수정 |
| `src/features/template-customization/domain/template-studio-config.test.ts` | 위의 단위 테스트 | 수정 |
| `src/lib/color.ts` | 색 유틸. 허용 색 토글 순수 함수를 여기 둔다 | 수정 |
| `src/lib/color.test.ts` | 위의 단위 테스트 | 수정 |
| `src/components/admin/templates/brand-color-swatches.tsx` | 브랜드 색 스와치. 단일 선택 옆에 다중 선택 형제를 둔다 | 수정 |
| `src/collections/fields/template-policy-field.ts` | `배경 설정` 섹션 Payload 필드 정의 | 신설 |
| `src/components/admin/templates/template-background-policy-field.tsx` | `배경 설정` 섹션 UI (형식·제한 두 카드) | 신설 |
| `src/components/admin/templates/template-layers-field.tsx` | 레이어 워크스페이스. `공통 설정` 카드를 더한다 | 수정 |
| `src/components/admin/templates/template-layer-editors.tsx` | 레이어 세부 설정. 이미지에 허용 프로파일·창작자 변형 허용을 더한다 | 수정 |
| `src/collections/Templates.ts` | 필드 배열. 제한·표현 제거, 정책 둘 신설 | 수정 |
| `src/features/template-core/repositories/published-template.payload.repository.ts` | published 조회 select | 수정 |
| `src/features/template-customization/services/get-published-template.service.ts` | published 투영 | 수정 |
| `src/features/agent-chat/repositories/agent-template.payload.repository.ts` | agent 조회 select | 수정 |
| `src/features/agent-chat/services/agent-template-request.service.ts` | agent 투영 | 수정 |
| `src/features/template-import/services/prepare-template-save.service.ts` | 저장 전 검증 게이트 | 수정 |
| `src/collections/fields/studio-controller-field.test.ts` | 어드민 필드 존재 계약 | 수정 |
| `migrations/<timestamp>_template_policy_fields.ts` + `.json` | 컬럼 교체 | 생성 |

---

### Task 1: 배경·텍스트 정책이 매니페스트를 좁힌다

**Files:**
- Modify: `src/features/template-customization/domain/template-studio-config.ts`
- Modify: `docs/superpowers/specs/2026-08-19-template-admin-policy-consolidation-design.md`
- Test: `src/features/template-customization/domain/template-studio-config.test.ts`

**Interfaces:**
- Consumes: 없음 (첫 Task)
- Produces:
  - `export type TemplateBackgroundType = 'color' | 'image' | 'graphic'` (이미 존재)
  - `export type TemplateBackgroundPolicy = { types?: readonly TemplateBackgroundType[]; colorValues?: readonly string[]; imageConfigIds?: readonly number[]; graphicConfigIds?: readonly string[] }`
  - `export type TemplateTextPolicy = { colorValues?: readonly string[] }`
  - `PublishedHtmlTemplate`에 `backgroundPolicy?: TemplateBackgroundPolicy`·`textPolicy?: TemplateTextPolicy` 추가
  - `getTemplateRuntimeManifest`가 위 둘을 읽는다 (인자 타입이 `Pick<PublishedHtmlTemplate, 'html' | 'nodeConfigs'> & Partial<Pick<PublishedHtmlTemplate, 'width' | 'height' | 'backgroundPolicy' | 'textPolicy'>>`)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`template-studio-config.test.ts`의 `import` 블록에 타입 하나를 더한다.

```ts
import type { StudioRuntimeManifest } from '@/modules/studio-controller/controller-definition'
```

`const forwardStraightConfig = ...` 바로 아래에 헬퍼를 둔다.

```ts
// 매니페스트에는 findTemplateControl(Config용)이 닿지 않으므로 그룹을 펼쳐 찾는다.
function findManifestControl(manifest: StudioRuntimeManifest, id: string) {
	return manifest.controller.groups
		.flatMap((group) => group.controls)
		.find((control) => control.id === id)
}
```

`describe('deriveTemplateStudioConfig', ...)` 안, 첫 `it` 뒤에 테스트 다섯 개를 더한다.

```ts
it('배경 정책이 형식을 좁히고 하나만 남으면 읽기 전용이 된다', () => {
	const manifest = getTemplateRuntimeManifest({
		...template,
		backgroundPolicy: { types: ['color'] },
	})

	expect(findManifestControl(manifest, 'background.type')).toMatchObject({
		availability: 'readonly',
		defaultValue: 'color',
		options: [{ value: 'color', label: 'Color' }],
	})
})

it('둘 이상 허용하면 읽기 전용이 아니고 기본값은 첫 허용 형식이다', () => {
	const manifest = getTemplateRuntimeManifest({
		...template,
		backgroundPolicy: { types: ['image', 'graphic'] },
	})
	const control = findManifestControl(manifest, 'background.type')

	expect(control).toMatchObject({
		defaultValue: 'image',
		options: [
			{ value: 'image', label: 'Image' },
			{ value: 'graphic', label: 'Graphic' },
		],
	})
	expect(control && 'availability' in control ? control.availability : undefined).toBeUndefined()
})

it('허용 색은 배경·텍스트 색 컨트롤의 values로 내려간다', () => {
	const manifest = getTemplateRuntimeManifest({
		...template,
		backgroundPolicy: { colorValues: ['#112233'] },
		textPolicy: { colorValues: ['#445566', '#778899'] },
	})

	expect(findManifestControl(manifest, 'background.color')).toMatchObject({
		values: ['#112233'],
	})
	expect(findManifestControl(manifest, 'text.color')).toMatchObject({
		values: ['#445566', '#778899'],
	})
})

it('배경 형식을 전부 막으면 파생이 거부한다', () => {
	expect(() =>
		getTemplateRuntimeManifest({ ...template, backgroundPolicy: { types: [] } }),
	).toThrow('배경 형식')
})

it('정책이 없으면 지금까지의 매니페스트와 같다', () => {
	expect(getTemplateRuntimeManifest({ ...template, backgroundPolicy: {}, textPolicy: {} })).toEqual(
		getTemplateRuntimeManifest(template),
	)
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm vitest run src/features/template-customization/domain/template-studio-config.test.ts`
Expected: FAIL — `backgroundPolicy`가 `PublishedHtmlTemplate`에 없어 타입 오류, 그리고 `background.type`이 여전히 세 옵션·`defaultValue: 'color'`

- [ ] **Step 3: 정책 타입과 파생을 구현한다**

`template-studio-config.ts`의 `export type TemplateBackgroundType = ...` 아래에 타입 둘을 더한다.

```ts
/** Admin이 정하는 배경 정책. 목록이 없으면 전부 허용이다 — exportPolicy와 같은 규칙. */
export type TemplateBackgroundPolicy = {
	types?: readonly TemplateBackgroundType[]
	colorValues?: readonly string[]
	imageConfigIds?: readonly number[]
	graphicConfigIds?: readonly string[]
}

/** 텍스트 일괄 색은 레이어 하나가 아니라 텍스트 전체에 걸리므로 템플릿 단위로 정한다. */
export type TemplateTextPolicy = {
	colorValues?: readonly string[]
}
```

`PublishedHtmlTemplate`에서 `controllerRestrictions`·`controllerPresentation` 두 줄은 **그대로 두고**(Task 5가 지운다) 아래 둘을 더한다.

```ts
	backgroundPolicy?: TemplateBackgroundPolicy
	textPolicy?: TemplateTextPolicy
```

`const TEXT_COLOR_CONTROL_ID = 'text.color'` 아래에 옵션 정본을 둔다.

```ts
const BACKGROUND_TYPE_OPTIONS: readonly { value: TemplateBackgroundType; label: string }[] = [
	{ value: 'color', label: 'Color' },
	{ value: 'image', label: 'Image' },
	{ value: 'graphic', label: 'Graphic' },
]
```

`getTemplateRuntimeManifest` 위에 그룹 빌더를 둔다.

```ts
/**
 * 배경 그룹을 정책으로 좁혀 만든다.
 *
 * 🔴 background.color 컨트롤은 형식에서 색을 막아도 지운다 — TemplateBackgroundSlot.colorControlId가
 * 필수고 parse가 그 존재를 검증하므로, 없애면 슬롯 계약과 소비 컴포넌트까지 optional이 번진다.
 * 색이 형식에 없으면 창작자가 그 자리에 닿지 못하므로 남겨 두어도 해가 없다.
 */
function buildBackgroundGroup(policy: TemplateBackgroundPolicy | undefined): ControllerGroupDefinition {
	const allowed = policy?.types
	const options = allowed
		? BACKGROUND_TYPE_OPTIONS.filter((option) => allowed.includes(option.value))
		: BACKGROUND_TYPE_OPTIONS
	if (options.length === 0) {
		throw new Error('Template 배경 형식은 최소 하나를 허용해야 합니다.')
	}
	return {
		id: 'background',
		title: 'Background',
		controls: [
			{
				id: BACKGROUND_TYPE_CONTROL_ID,
				kind: 'select',
				label: 'Type',
				defaultValue: options[0].value,
				options,
				// 고를 것이 하나면 열어 둘 이유가 없다.
				...(options.length === 1 ? { availability: 'readonly' as const } : {}),
			},
			{
				id: BACKGROUND_COLOR_CONTROL_ID,
				kind: 'color',
				label: 'Background Color',
				defaultValue: null,
				...(policy?.colorValues?.length ? { values: policy.colorValues } : {}),
			},
		],
	}
}
```

`getTemplateRuntimeManifest`의 인자와 본문을 고친다. 시그니처는

```ts
export function getTemplateRuntimeManifest({
	html,
	nodeConfigs,
	width,
	height,
	backgroundPolicy,
	textPolicy,
}: Pick<PublishedHtmlTemplate, 'html' | 'nodeConfigs'> &
	Partial<
		Pick<PublishedHtmlTemplate, 'width' | 'height' | 'backgroundPolicy' | 'textPolicy'>
	>): StudioRuntimeManifest {
```

텍스트 그룹의 색 컨트롤에 `values`를 붙인다.

```ts
									{
										id: TEXT_COLOR_CONTROL_ID,
										kind: 'color' as const,
										label: 'Color',
										defaultValue: null,
										...(textPolicy?.colorValues?.length
											? { values: textPolicy.colorValues }
											: {}),
									},
```

배경 그룹 리터럴 전체를 빌더 호출로 바꾼다.

```ts
				buildBackgroundGroup(backgroundPolicy),
```

- [ ] **Step 4: 통과를 확인한다**

Run: `pnpm vitest run src/features/template-customization/domain/template-studio-config.test.ts`
Expected: PASS (기존 테스트 포함 전부)

Run: `pnpm typecheck`
Expected: 오류 없음

- [ ] **Step 5: 스펙 문서의 결정을 고친다**

`docs/superpowers/specs/2026-08-19-template-admin-policy-consolidation-design.md`의 "파생" 절에서 아래 줄을

```
  - `types`에 `color`가 없으면 `background.color` 컨트롤을 만들지 않는다. 있으면 `values: colorValues`.
```

이렇게 바꾼다.

```
  - `background.color` 컨트롤은 형식에서 색을 막아도 남긴다. `colorValues`가 있으면 `values`로 좁힌다. 🔴 `TemplateBackgroundSlot.colorControlId`가 필수고 parse가 존재를 검증하므로 컨트롤을 없애면 슬롯 계약과 소비 컴포넌트까지 optional이 번진다.
```

- [ ] **Step 6: 커밋**

```bash
git add src/features/template-customization/domain/template-studio-config.ts \
  src/features/template-customization/domain/template-studio-config.test.ts \
  docs/superpowers/specs/2026-08-19-template-admin-policy-consolidation-design.md
git commit -m "feat: 배경·텍스트 정책이 템플릿 매니페스트를 좁히게 한다"
```

---

### Task 2: 정책이 배경 슬롯과 그래픽 목록을 좁힌다

**Files:**
- Modify: `src/features/template-customization/domain/template-studio-config.ts:600-700` (`deriveTemplateStudioConfig`)
- Test: `src/features/template-customization/domain/template-studio-config.test.ts`

**Interfaces:**
- Consumes: Task 1의 `TemplateBackgroundPolicy`, `PublishedHtmlTemplate.backgroundPolicy`
- Produces: `deriveTemplateStudioConfig(template, imageConfigs, graphicConfigs)`가 `backgroundPolicy.imageConfigIds`를 배경 슬롯의 `imageConfig.allowedConfigIds`로, `backgroundPolicy.graphicConfigIds`를 `config.template.graphicConfigs` 필터로 반영한다. 슬롯 계약에 새 필드를 더하지 않는다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`describe('deriveTemplateStudioConfig', ...)` 안에 둘을 더한다.

```ts
it('배경 정책이 허용 이미지 프로파일을 배경 슬롯에 싣는다', () => {
	const config = deriveTemplateStudioConfig(
		{ ...template, backgroundPolicy: { imageConfigIds: [3] } },
		[imageConfig],
	)
	const background = config.template.slots.find(isBackgroundSlot)

	expect(background?.imageConfig).toEqual({ mode: 'selectable', allowedConfigIds: [3] })
	expect(listCompatibleTemplateImageConfigs(background!, [imageConfig])).toHaveLength(1)
})

it('배경 정책이 그래픽 런타임 목록을 좁힌다', () => {
	const allowed = deriveTemplateStudioConfig(
		{ ...template, backgroundPolicy: { graphicConfigIds: [forwardStraightConfig.id] } },
		[],
		[forwardStraightConfig],
	)
	const blocked = deriveTemplateStudioConfig(
		{ ...template, backgroundPolicy: { graphicConfigIds: [] } },
		[],
		[forwardStraightConfig],
	)

	expect(allowed.template.graphicConfigs).toHaveLength(1)
	expect(blocked.template.graphicConfigs).toHaveLength(0)
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm vitest run src/features/template-customization/domain/template-studio-config.test.ts -t 배경 정책이`
Expected: FAIL — `imageConfig`가 `{ mode: 'selectable' }`뿐이고 `graphicConfigs`가 그대로 1개

- [ ] **Step 3: 파생을 구현한다**

`deriveTemplateStudioConfig` 본문 맨 위, `const { html, nodeConfigs } = template` 아래에 좁힌 목록을 만든다.

```ts
	const backgroundPolicy = template.backgroundPolicy
	// template.graphicConfigs는 배경 그래픽에서만 소비된다 — 슬롯에 id 목록을 더하지 않고 목록 자체를 좁힌다.
	const allowedGraphicIds = backgroundPolicy?.graphicConfigIds
	const scopedGraphicConfigs = allowedGraphicIds
		? graphicConfigs.filter((config) => allowedGraphicIds.includes(config.id))
		: graphicConfigs
```

배경 슬롯 리터럴의 `imageConfig`를 고친다.

```ts
			imageConfig: {
				mode: 'selectable',
				...(backgroundPolicy?.imageConfigIds
					? { allowedConfigIds: backgroundPolicy.imageConfigIds }
					: {}),
			},
```

`config` 리터럴의 `graphicConfigs`를 좁힌 목록으로 바꾼다.

```ts
			graphicConfigs: scopedGraphicConfigs,
```

- [ ] **Step 4: 통과를 확인한다**

Run: `pnpm vitest run src/features/template-customization/domain/template-studio-config.test.ts`
Expected: PASS

Run: `pnpm typecheck`
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/features/template-customization/domain/template-studio-config.ts \
  src/features/template-customization/domain/template-studio-config.test.ts
git commit -m "feat: 배경 정책이 허용 프로파일과 그래픽 목록을 좁히게 한다"
```

---

### Task 3: 허용 색 다중 선택

**Files:**
- Modify: `src/lib/color.ts`
- Modify: `src/lib/color.test.ts`
- Modify: `src/components/admin/templates/brand-color-swatches.tsx`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `export function toggleHexValue(values: readonly string[], hex: string): string[]` — `src/lib/color.ts`
  - `export function BrandColorSwatchSet({ legend, colors, values, onChange, disabled }: { legend: string; colors: BrandColor[]; values: readonly string[]; onChange: (next: string[]) => void; disabled?: boolean })` — `brand-color-swatches.tsx`. 기존 `BrandColorSwatches`(단일 선택)는 그대로 둔다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/lib/color.test.ts`에 더한다. 파일 상단 `import`에 `toggleHexValue`를 넣는다.

```ts
describe('toggleHexValue', () => {
	it('없으면 켜고 있으면 끈다', () => {
		expect(toggleHexValue([], '#112233')).toEqual(['#112233'])
		expect(toggleHexValue(['#112233'], '#112233')).toEqual([])
	})

	it('입력 순서를 지킨다 — 스와치 순서로 재배열하지 않는다', () => {
		expect(toggleHexValue(['#445566'], '#112233')).toEqual(['#445566', '#112233'])
	})
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm vitest run src/lib/color.test.ts`
Expected: FAIL — `toggleHexValue is not a function`

- [ ] **Step 3: 순수 함수를 구현한다**

`src/lib/color.ts`에 더한다.

```ts
/** 허용 색 목록에서 하나를 켜고 끈다. 순서는 고른 순서를 지킨다. */
export function toggleHexValue(values: readonly string[], hex: string): string[] {
	return values.includes(hex) ? values.filter((value) => value !== hex) : [...values, hex]
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `pnpm vitest run src/lib/color.test.ts`
Expected: PASS

- [ ] **Step 5: 다중 선택 스와치를 구현한다**

`brand-color-swatches.tsx`의 `import`에 `toggleHexValue`를 더하고(`import { isValidHex, toggleHexValue } from '@/lib/color'`), 파일 끝에 형제 컴포넌트를 둔다.

```tsx
/**
 * 허용 색을 좁히는 다중 선택 스와치.
 * BrandColorSwatches(단일 선택)와 목적이 달라 값 계약을 나눈다 — 이쪽은 정책, 저쪽은 값이다.
 */
export function BrandColorSwatchSet({
	legend,
	colors,
	values,
	onChange,
	disabled,
}: {
	legend: string
	colors: BrandColor[]
	values: readonly string[]
	onChange: (next: string[]) => void
	disabled?: boolean
}) {
	return (
		<FieldSet className="gap-2">
			<FieldLegend variant="label">{legend}</FieldLegend>
			<div className="flex flex-wrap gap-2">
				{colors.map((color) => {
					if (!isValidHex(color.hex)) return null
					const hex = color.hex.startsWith('#') ? color.hex : `#${color.hex}`
					const selected = values.includes(hex)
					return (
						<Button
							key={color.id}
							type="button"
							disabled={disabled}
							aria-pressed={selected}
							aria-label={`${color.name} ${hex}`}
							onClick={() => onChange(toggleHexValue(values, hex))}
							variant={selected ? 'muted' : 'outline'}
							size="sm"
						>
							<span
								aria-hidden
								className="size-3.5 rounded-sm"
								style={{ backgroundColor: hex }}
							/>
							{color.name}
						</Button>
					)
				})}
			</div>
			<FieldDescription>고르지 않으면 브랜드 색 전체를 허용합니다.</FieldDescription>
		</FieldSet>
	)
}
```

`FieldDescription`을 `@/components/ui/field` import에 더한다.

- [ ] **Step 6: 통과를 확인한다**

Run: `pnpm typecheck && pnpm check`
Expected: 오류 없음

- [ ] **Step 7: 커밋**

```bash
git add src/lib/color.ts src/lib/color.test.ts \
  src/components/admin/templates/brand-color-swatches.tsx
git commit -m "feat: 허용 색을 좁히는 다중 선택 스와치를 추가한다"
```

---

### Task 4: 배경 설정 섹션과 공통 설정 카드

**Files:**
- Create: `src/collections/fields/template-policy-field.ts`
- Create: `src/components/admin/templates/template-background-policy-field.tsx`
- Modify: `src/collections/Templates.ts:91-93`
- Modify: `src/components/admin/templates/template-layers-field.tsx`
- Modify: `src/features/template-core/repositories/published-template.payload.repository.ts:100-160`
- Modify: `src/features/template-customization/services/get-published-template.service.ts:55-68`
- Modify: `src/features/agent-chat/repositories/agent-template.payload.repository.ts:15-50`
- Modify: `src/features/agent-chat/services/agent-template-request.service.ts:100-110`
- Modify: `src/features/template-import/services/prepare-template-save.service.ts:15-100`

**Interfaces:**
- Consumes: Task 1의 `TemplateBackgroundPolicy`·`TemplateTextPolicy`, Task 3의 `BrandColorSwatchSet`
- Produces:
  - `export function templateBackgroundPolicyField(): Field` — `template-policy-field.ts`
  - `export function TemplateBackgroundPolicyField(props: JSONFieldClientComponent 인자): JSX.Element` — `template-background-policy-field.tsx`
  - `templates.backgroundPolicy`·`templates.textPolicy` 두 json 필드가 읽기 경로 전체(published·agent·저장 게이트)를 타고 `deriveTemplateStudioConfig`까지 도달한다

- [ ] **Step 1: Payload 필드를 만든다**

`src/collections/fields/template-policy-field.ts`를 만든다. 그래픽 런타임 목록은 클라이언트에서 도메인을 import하지 않도록 `clientProps`로 넘긴다 — `studio-controller-field.ts`의 `baseConfigs`와 같은 방식이다.

```ts
import type { Field } from 'payload'
import { GRAPHIC_RUNTIME_OPTIONS } from '@/features/graphic-generation/domain/graphic-studio-manifest'

/** 배경 정책 — 창작자가 고를 수 있는 배경 형식과 그 안의 허용 목록. */
export function templateBackgroundPolicyField(): Field {
	return {
		name: 'backgroundPolicy',
		type: 'json',
		label: '배경 설정',
		admin: {
			components: {
				Field: {
					path: '/components/admin/templates/template-background-policy-field#TemplateBackgroundPolicyField',
					clientProps: { graphicOptions: GRAPHIC_RUNTIME_OPTIONS },
				},
			},
		},
	}
}

/** 텍스트 일괄 색의 허용 팔레트. UI는 레이어 워크스페이스의 `공통 설정` 카드가 소유한다. */
export function templateTextPolicyField(): Field {
	return {
		name: 'textPolicy',
		type: 'json',
		admin: { hidden: true },
	}
}
```

- [ ] **Step 2: 섹션 UI를 만든다**

`src/components/admin/templates/template-background-policy-field.tsx`를 만든다. 형식은 옵션마다 On/Off 토글, 제한은 형식이 켜진 것만 보여준다 — 정본 `77:2247`의 두 카드 구조다.

```tsx
'use client'

import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldLegend, FieldSet } from '@/components/ui/field'
import {
	type ImageProfileOption,
	requestPublishedImageProfiles,
} from '@/features/image-generation/services/generate-image.client'
import type {
	TemplateBackgroundPolicy,
	TemplateBackgroundType,
} from '@/features/template-customization/domain/template-studio-config'
import { BrandColorSwatchSet, usePublishedBrandColors } from './brand-color-swatches'

const TYPE_ROWS: readonly { value: TemplateBackgroundType; label: string }[] = [
	{ value: 'color', label: '색' },
	{ value: 'image', label: '이미지' },
	{ value: 'graphic', label: '그래픽' },
]

type Props = ComponentProps<JSONFieldClientComponent> & {
	graphicOptions?: readonly { value: string; label: string }[]
}

function readPolicy(value: unknown): TemplateBackgroundPolicy {
	return value && typeof value === 'object' ? (value as TemplateBackgroundPolicy) : {}
}

/** 목록을 켜고 끈다. 전부 켜진 상태는 목록 자체를 지워 "전부 허용"으로 되돌린다. */
function toggleId<T>(current: readonly T[] | undefined, all: readonly T[], id: T): T[] | undefined {
	const base = current ?? all
	const next = base.includes(id) ? base.filter((value) => value !== id) : [...base, id]
	return next.length === all.length ? undefined : next
}

export function TemplateBackgroundPolicyField({ path, graphicOptions = [] }: Props) {
	const { disabled, setValue, value } = useField<unknown>({ path })
	const policy = readPolicy(value)
	const { colors } = usePublishedBrandColors()
	const [profiles, setProfiles] = useState<ImageProfileOption[]>([])

	useEffect(() => {
		void requestPublishedImageProfiles().then(setProfiles).catch(() => setProfiles([]))
	}, [])

	const types = policy.types ?? TYPE_ROWS.map((row) => row.value)
	const allows = (type: TemplateBackgroundType) => types.includes(type)

	function patch(next: Partial<TemplateBackgroundPolicy>) {
		setValue({ ...policy, ...next })
	}

	return (
		<div className="field-type json mb-5 flex flex-col gap-4">
			<FieldLabel label="배경 설정" path={path} />

			<FieldSet className="gap-2 rounded-md border p-3">
				<FieldLegend variant="label">형식</FieldLegend>
				<div className="flex flex-wrap gap-2">
					{TYPE_ROWS.map((row) => (
						<Button
							key={row.value}
							type="button"
							size="sm"
							disabled={disabled}
							aria-pressed={allows(row.value)}
							variant={allows(row.value) ? 'muted' : 'outline'}
							onClick={() =>
								patch({
									types: types.includes(row.value)
										? types.filter((type) => type !== row.value)
										: [...types, row.value],
								})
							}
						>
							{row.label}
						</Button>
					))}
				</div>
				<FieldDescription
					description="최소 하나는 켜야 합니다. 전부 끄면 발행이 막힙니다."
					path={path}
				/>
			</FieldSet>

			{allows('color') ? (
				<BrandColorSwatchSet
					legend="허용 색"
					colors={colors}
					values={policy.colorValues ?? []}
					disabled={disabled}
					onChange={(colorValues) =>
						patch({ colorValues: colorValues.length ? colorValues : undefined })
					}
				/>
			) : null}

			{allows('image') ? (
				<FieldSet className="gap-2 rounded-md border p-3">
					<FieldLegend variant="label">허용 이미지 프로파일</FieldLegend>
					<div className="flex flex-wrap gap-2">
						{profiles.map((profile) => {
							const all = profiles.map((candidate) => candidate.id)
							const on = (policy.imageConfigIds ?? all).includes(profile.id)
							return (
								<Button
									key={profile.id}
									type="button"
									size="sm"
									disabled={disabled}
									aria-pressed={on}
									variant={on ? 'muted' : 'outline'}
									onClick={() =>
										patch({
											imageConfigIds: toggleId(
												policy.imageConfigIds,
												all,
												profile.id,
											),
										})
									}
								>
									{profile.name}
								</Button>
							)
						})}
					</div>
				</FieldSet>
			) : null}

			{allows('graphic') ? (
				<FieldSet className="gap-2 rounded-md border p-3">
					<FieldLegend variant="label">허용 그래픽</FieldLegend>
					<div className="flex flex-wrap gap-2">
						{graphicOptions.map((option) => {
							const all = graphicOptions.map((candidate) => candidate.value)
							const on = (policy.graphicConfigIds ?? all).includes(option.value)
							return (
								<Button
									key={option.value}
									type="button"
									size="sm"
									disabled={disabled}
									aria-pressed={on}
									variant={on ? 'muted' : 'outline'}
									onClick={() =>
										patch({
											graphicConfigIds: toggleId(
												policy.graphicConfigIds,
												all,
												option.value,
											),
										})
									}
								>
									{option.label}
								</Button>
							)
						})}
					</div>
				</FieldSet>
			) : null}
		</div>
	)
}
```

- [ ] **Step 3: 컬렉션에 필드를 꽂는다**

`src/collections/Templates.ts`에서 `studioExportPolicyField({ source: 'template' }),` **앞**에 두 줄을 넣는다. 제한·표현 필드는 아직 지우지 않는다 — Task 5가 지운다.

```ts
		templateBackgroundPolicyField(),
		templateTextPolicyField(),
```

import를 더한다.

```ts
import {
	templateBackgroundPolicyField,
	templateTextPolicyField,
} from './fields/template-policy-field'
```

- [ ] **Step 4: 읽기 경로를 배선한다**

네 곳에서 `controllerRestrictions`/`controllerPresentation` 옆에 새 필드를 나란히 더한다. 이번 Task는 **더하기만** 한다.

`published-template.payload.repository.ts` — 타입 선언 두 군데(`:107`, `:147`)와 `select`(`:131`)에:

```ts
			backgroundPolicy?: unknown
			textPolicy?: unknown
```

```ts
			backgroundPolicy: true,
			textPolicy: true,
```

`get-published-template.service.ts`의 반환 리터럴에:

```ts
		backgroundPolicy: template.backgroundPolicy as PublishedHtmlTemplate['backgroundPolicy'],
		textPolicy: template.textPolicy as PublishedHtmlTemplate['textPolicy'],
```

`agent-template.payload.repository.ts`의 타입(`:17`)과 `select`(`:45`)에 같은 두 필드를, `agent-template-request.service.ts`(`:104`)의 리터럴에 같은 두 줄을 더한다.

`prepare-template-save.service.ts`의 `TemplateSaveCandidate`에

```ts
	backgroundPolicy?: unknown
	textPolicy?: unknown
```

그리고 `deriveTemplateStudioConfig` 호출 인자에

```ts
				backgroundPolicy: candidate.backgroundPolicy as never,
				textPolicy: candidate.textPolicy as never,
```

- [ ] **Step 5: 공통 설정 카드를 더한다**

`template-layers-field.tsx`의 렌더에서 `<Separator className="my-6" />` **앞**에 카드를 넣는다.

```tsx
			<Separator className="my-6" />

			<BrandColorSwatchSet
				legend="텍스트 허용 색 — 창작자가 텍스트 색을 고를 수 있는 범위"
				colors={brandColors}
				values={textPolicy.colorValues ?? []}
				onChange={(colorValues) =>
					dispatchFields({
						type: 'UPDATE',
						path: 'textPolicy',
						value: colorValues.length ? { colorValues } : {},
					})
				}
			/>
```

같은 컴포넌트 안에 값과 색 목록을 읽는 줄을 더한다(`const height = ...` 아래).

```tsx
	const textPolicy = (useFormFields(([fields]) => fields.textPolicy?.value) ?? {}) as {
		colorValues?: string[]
	}
	const { colors: brandColors } = usePublishedBrandColors()
```

import를 더한다.

```tsx
import { BrandColorSwatchSet, usePublishedBrandColors } from './brand-color-swatches'
```

- [ ] **Step 6: 검증**

Run: `pnpm typecheck && pnpm check`
Expected: 오류 없음

Run: `pnpm vitest run src/features/template-customization src/features/template-import src/features/agent-chat`
Expected: PASS

Run: `pnpm dev` 후 어드민에서 템플릿 하나를 열어 `배경 설정` 섹션이 뜨고, 형식 토글을 끄면 그 아래 목록이 사라지고, 저장 후 다시 열었을 때 값이 남아 있는지 본다. 🔴 `.env`가 공유 DB를 가리키므로 **저장은 draft 템플릿에만** 하고, 끝나면 값을 원래대로 되돌린다.
Expected: 섹션 표시·조건부 목록·저장·복원이 모두 동작

- [ ] **Step 7: 커밋**

```bash
git add src/collections/fields/template-policy-field.ts \
  src/components/admin/templates/template-background-policy-field.tsx \
  src/components/admin/templates/template-layers-field.tsx \
  src/collections/Templates.ts \
  src/features/template-core/repositories/published-template.payload.repository.ts \
  src/features/template-customization/services/get-published-template.service.ts \
  src/features/agent-chat/repositories/agent-template.payload.repository.ts \
  src/features/agent-chat/services/agent-template-request.service.ts \
  src/features/template-import/services/prepare-template-save.service.ts
git commit -m "feat: 배경 설정 섹션과 텍스트 허용 색 카드를 어드민에 올린다"
```

---

### Task 5: Controller 제한·표현을 템플릿에서 제거한다

**Files:**
- Modify: `src/collections/Templates.ts:91-92`
- Modify: `src/features/template-customization/domain/template-studio-config.ts` (타입·derive)
- Modify: `src/features/template-customization/domain/template-studio-config.test.ts:200-280`
- Modify: `src/features/template-core/repositories/published-template.payload.repository.ts`
- Modify: `src/features/template-customization/services/get-published-template.service.ts`
- Modify: `src/features/agent-chat/repositories/agent-template.payload.repository.ts`
- Modify: `src/features/agent-chat/services/agent-template-request.service.ts`
- Modify: `src/features/template-import/services/prepare-template-save.service.ts`
- Modify: `src/features/template-import/services/prepare-template-save.service.test.ts:140-150`
- Modify: `src/features/template-customization/services/get-template-studio.service.test.ts:10-50`
- Modify: `src/features/template-customization/services/get-published-template.service.test.ts:10-40`
- Modify: `src/components/studio/template/template-generator.test.tsx:440-450`
- Modify: `src/collections/fields/studio-controller-field.test.ts`

**Interfaces:**
- Consumes: Task 4의 배선 (새 정책이 이미 읽기 경로를 타고 있어야 제거가 안전하다)
- Produces: `PublishedHtmlTemplate`에서 `controllerRestrictions`·`controllerPresentation`이 사라진다. `TemplateStudioConfig.controllerPresentation`은 남고 항상 기본값(모두 `collapsible: true`, `defaultOpen: true`)이다.

- [ ] **Step 1: 필드 존재 계약 테스트를 먼저 고친다**

`src/collections/fields/studio-controller-field.test.ts`에 더한다. 파일이 이미 `namedField(collection.fields, 'controllerRestrictions')` 패턴을 쓰므로 같은 헬퍼를 쓴다.

```ts
	it('템플릿에는 Controller 제한·표현 필드를 두지 않는다 — 레이어와 배경 설정이 소유한다', () => {
		expect(namedField(Templates.fields, 'controllerRestrictions')).toBeUndefined()
		expect(namedField(Templates.fields, 'controllerPresentation')).toBeUndefined()
		expect(namedField(Templates.fields, 'backgroundPolicy')).toBeDefined()
		expect(namedField(Templates.fields, 'textPolicy')).toBeDefined()
	})

	it('프로파일 컬렉션에는 그대로 남는다 — 거기엔 파생 순환이 없다', () => {
		expect(namedField(GraphicProfiles.fields, 'controllerRestrictions')).toBeDefined()
		expect(namedField(ImageProfiles.fields, 'controllerRestrictions')).toBeDefined()
	})
```

`Templates`·`GraphicProfiles`·`ImageProfiles` import가 없으면 더한다.

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm vitest run src/collections/fields/studio-controller-field.test.ts`
Expected: FAIL — `controllerRestrictions`가 아직 `Templates.fields`에 있다

- [ ] **Step 3: 필드와 파생을 제거한다**

`Templates.ts`에서 두 줄을 지운다.

```ts
		studioControllerRestrictionsField({ source: 'template' }),
		studioControllerPresentationField({ source: 'template' }),
```

import에서도 두 이름을 뺀다. `studioExportPolicyField`는 남는다.

`template-studio-config.ts`

- `PublishedHtmlTemplate`에서 `controllerRestrictions?: unknown`·`controllerPresentation?: unknown` 두 줄을 지운다.
- `deriveTemplateStudioConfig`에서 좁히기 호출을 없애고 그룹을 매니페스트에서 바로 쓴다.

```ts
	const runtimeManifest = getTemplateRuntimeManifest(template)
	const controllerGroups = runtimeManifest.controller.groups
```

- `controllerPresentation`은 계약에 남기고 어드민 입력만 끊는다.

```ts
		// 어드민 입력을 없앤 뒤에도 창작자 사이드바가 이 값을 읽으므로 기본값을 계산해 싣는다.
		controllerPresentation: resolveControllerPresentation(controllerGroups, undefined),
```

- `projectPayloadControllerRestrictions`·`applyControllerRestrictions` import를 지운다. `resolveControllerPresentation`은 남긴다.

`published-template.payload.repository.ts`·`get-published-template.service.ts`·`agent-template.payload.repository.ts`·`agent-template-request.service.ts`·`prepare-template-save.service.ts`에서 두 필드의 타입 선언·`select`·리터럴 줄을 지운다. Task 4에서 더한 `backgroundPolicy`·`textPolicy`는 그대로 둔다.

- [ ] **Step 4: 낡은 테스트를 고친다**

`template-studio-config.test.ts`에서 `it('Restrictions와 Admin 그룹 표현을 분리해...')`와 `it('sparse Restrictions는 쓰지 않은 Definition 필드를...')` 두 개를 지우고, 대신 표현 기본값 하나를 남긴다.

```ts
	it('Controller 표현은 어드민 입력 없이 기본값으로 채워진다', () => {
		const config = deriveTemplateStudioConfig(template)

		expect(config.controllerPresentation?.groups).toEqual([
			{ groupId: 'text', collapsible: true, defaultOpen: true },
			{ groupId: 'background', collapsible: true, defaultOpen: true },
		])
	})
```

`prepare-template-save.service.test.ts:145`·`get-template-studio.service.test.ts:16`·`get-published-template.service.test.ts:18`·`template-generator.test.tsx:444`의 픽스처에서 `controllerRestrictions`/`controllerPresentation` 블록을 지운다. `get-published-template.service.test.ts:34`의 `expect(template?.controllerRestrictions).toEqual(...)`는 지우고, `get-template-studio.service.test.ts:48`의 `not.toContain('controllerRestrictions')`는 남긴다 — 여전히 참이고 회귀 가드로 쓸모가 있다.

- [ ] **Step 5: 통과를 확인한다**

Run: `pnpm vitest run src/collections src/features/template-customization src/features/template-core src/features/template-import src/features/agent-chat src/components/studio`
Expected: PASS

Run: `pnpm typecheck && pnpm check`
Expected: 오류 없음. 오류가 남으면 `controllerRestrictions`를 아직 참조하는 곳이므로 그 파일도 함께 정리한다.

- [ ] **Step 6: 커밋**

🔴 작업 트리를 다른 세션이 함께 쓴다. `git add -A`나 디렉터리 단위 add를 쓰지 말고 이 Task에서 고친 파일만 적는다.

```bash
git add src/collections/Templates.ts \
  src/collections/fields/studio-controller-field.test.ts \
  src/features/template-customization/domain/template-studio-config.ts \
  src/features/template-customization/domain/template-studio-config.test.ts \
  src/features/template-customization/services/get-published-template.service.ts \
  src/features/template-customization/services/get-published-template.service.test.ts \
  src/features/template-customization/services/get-template-studio.service.test.ts \
  src/features/template-core/repositories/published-template.payload.repository.ts \
  src/features/template-import/services/prepare-template-save.service.ts \
  src/features/template-import/services/prepare-template-save.service.test.ts \
  src/features/agent-chat/repositories/agent-template.payload.repository.ts \
  src/features/agent-chat/services/agent-template-request.service.ts \
  src/components/studio/template/template-generator.test.tsx
git commit -m "refactor: 템플릿에서 Controller 제한·표현 패널을 없앤다"
```

---

### Task 6: 레이어 세부 설정 — 허용 프로파일과 창작자 변형 허용

**Files:**
- Modify: `src/types/template.ts:55-60`
- Modify: `src/features/template-core/domain/collect-template-slots.ts` (`TemplateImageSlot`, `collectTemplateImageSlots`)
- Modify: `src/features/template-customization/domain/template-studio-config.ts` (이미지 슬롯 파생)
- Modify: `src/components/admin/templates/template-layer-editors.tsx:392-430` (`ImageSlotSpecEditor`)
- Test: `src/features/template-customization/domain/template-studio-config.test.ts`

**Interfaces:**
- Consumes: 없음 (Task 1~5와 독립)
- Produces:
  - `TemplateNodeConfig.imageInput?: { profileId?: number; allowedProfileIds?: number[]; transform?: { enabled: boolean } }`
  - `TemplateImageSlot`에 `allowedProfileIds?: readonly number[]`·`transformEnabled: boolean` 추가
  - 이미지 슬롯 파생이 `imageConfig.allowedConfigIds`와 `transform.enabled`를 정책에서 채운다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```ts
it('이미지 레이어 정책이 허용 프로파일과 창작자 변형 허용을 슬롯에 싣는다', () => {
	const config = deriveTemplateStudioConfig(
		{
			...template,
			nodeConfigs: {
				...template.nodeConfigs,
				'2:1': {
					imageInput: { allowedProfileIds: [3], transform: { enabled: false } },
					imageColorize: { line: '#112233' },
				},
			},
		},
		[imageConfig],
	)
	const slot = config.template.slots.find(isImageSlot)

	expect(slot?.imageConfig).toEqual({ mode: 'selectable', allowedConfigIds: [3] })
	expect(slot?.transform.enabled).toBe(false)
})

it('변형 허용을 적지 않으면 지금까지처럼 허용이다', () => {
	const config = deriveTemplateStudioConfig(template, [imageConfig])

	expect(config.template.slots.find(isImageSlot)?.transform.enabled).toBe(true)
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm vitest run src/features/template-customization/domain/template-studio-config.test.ts -t 이미지 레이어 정책이`
Expected: FAIL — `allowedProfileIds`가 타입에 없고 `transform.enabled`가 항상 `true`

- [ ] **Step 3: 계약과 파생을 구현한다**

`src/types/template.ts`의 `imageInput`을 넓힌다.

```ts
	/**
	 * 존재 자체가 스튜디오 개방 선언 — 유저가 이 프레임의 이미지를 생성해 채울 수 있다.
	 * profileId는 사용할 프로파일 고정(없으면 유저가 선택), allowedProfileIds는 그 선택의 범위(없으면 전부),
	 * transform.enabled는 창작자의 이동·확대·회전 허용(없으면 허용).
	 */
	imageInput?: {
		profileId?: number
		allowedProfileIds?: number[]
		transform?: { enabled: boolean }
	}
```

`collect-template-slots.ts`의 `TemplateImageSlot`에 두 줄을 더하고 `collectTemplateImageSlots`가 채우게 한다.

```ts
	/** 창작자가 고를 수 있는 프로파일 범위 — 없으면 접근 가능한 전부다. */
	allowedProfileIds?: readonly number[]
	/** 창작자의 이동·확대·회전 허용. */
	transformEnabled: boolean
```

```ts
				slots.push({
					nodeId,
					name: attributes['data-name'] || nodeId,
					profileId: config.imageInput.profileId,
					...(config.imageInput.allowedProfileIds
						? { allowedProfileIds: config.imageInput.allowedProfileIds }
						: {}),
					transformEnabled: config.imageInput.transform?.enabled ?? true,
					boxWidth: readPxDimension(style, 'width'),
					boxHeight: readPxDimension(style, 'height'),
					policy,
				})
```

`template-studio-config.ts`의 이미지 슬롯 파생에서 두 값을 반영한다.

```ts
				imageConfig: slot.profileId
					? { mode: 'pinned', configId: slot.profileId }
					: {
							mode: 'selectable',
							...(slot.allowedProfileIds
								? { allowedConfigIds: slot.allowedProfileIds }
								: {}),
						},
```

```ts
				transform: { enabled: slot.transformEnabled, limits: IMAGE_EDIT_TRANSFORM_LIMITS },
```

- [ ] **Step 4: 통과를 확인한다**

Run: `pnpm vitest run src/features/template-customization src/features/template-core`
Expected: PASS

- [ ] **Step 5: 세부 설정 UI에 두 행을 더한다**

`ImageSlotSpecEditor`에 `profiles` 토글 목록과 변형 허용 버튼을 더한다. `프로파일 고정`이 `스튜디오에서 선택`일 때만 허용 목록을 보여준다.

```tsx
			{imageInput.profileId ? null : (
				<Field>
					<FieldLabel htmlFor="image-slot-allowed-profiles">
						허용 프로파일 — 고르지 않으면 전부
					</FieldLabel>
					<div id="image-slot-allowed-profiles" className="flex flex-wrap gap-2">
						{profiles?.map((profile) => {
							const all = profiles.map((candidate) => candidate.id)
							const on = (imageInput.allowedProfileIds ?? all).includes(profile.id)
							const next = on
								? (imageInput.allowedProfileIds ?? all).filter(
										(id) => id !== profile.id,
									)
								: [...(imageInput.allowedProfileIds ?? all), profile.id]
							return (
								<Button
									key={profile.id}
									type="button"
									size="sm"
									aria-pressed={on}
									variant={on ? 'muted' : 'outline'}
									onClick={() =>
										onChange({
											...imageInput,
											allowedProfileIds:
												next.length === all.length ? undefined : next,
										})
									}
								>
									{profile.name}
								</Button>
							)
						})}
					</div>
				</Field>
			)}
			<Field>
				<FieldLabel htmlFor="image-slot-transform">창작자 변형 허용</FieldLabel>
				<Button
					id="image-slot-transform"
					type="button"
					size="sm"
					aria-pressed={imageInput.transform?.enabled ?? true}
					variant={(imageInput.transform?.enabled ?? true) ? 'muted' : 'outline'}
					onClick={() =>
						onChange({
							...imageInput,
							transform: { enabled: !(imageInput.transform?.enabled ?? true) },
						})
					}
				>
					{(imageInput.transform?.enabled ?? true) ? 'On' : 'Off'}
				</Button>
			</Field>
```

`Button` import가 없으면 `@/components/ui/button`에서 더한다.

🔴 이 토글은 창작자 **권한**이다. 같은 파일의 `ImageTransformEditor`(이동 X/Y·확대·회전 슬라이더)는 어드민 자신의 배치값(`imageTransform`)이라 다른 것이다. 두 개를 합치지 말 것.

- [ ] **Step 6: 검증**

Run: `pnpm typecheck && pnpm check`
Expected: 오류 없음

Run: `pnpm vitest run src/features/template-customization src/features/template-core src/components/admin`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add src/types/template.ts \
  src/features/template-core/domain/collect-template-slots.ts \
  src/features/template-customization/domain/template-studio-config.ts \
  src/features/template-customization/domain/template-studio-config.test.ts \
  src/components/admin/templates/template-layer-editors.tsx
git commit -m "feat: 이미지 레이어에 허용 프로파일과 창작자 변형 허용을 준다"
```

---

### Task 7: 마이그레이션과 문서

**Files:**
- Create: `migrations/<timestamp>_template_policy_fields.ts`
- Create: `migrations/<timestamp>_template_policy_fields.json`
- Modify: `migrations/index.ts`
- Modify: `docs/superpowers/specs/2026-08-19-template-admin-policy-consolidation-design.md` (상태 줄)

**Interfaces:**
- Consumes: Task 4·5의 스키마 변경 전부 (`backgroundPolicy`·`textPolicy` 추가, `controllerRestrictions`·`controllerPresentation` 제거)
- Produces: 커밋된 마이그레이션 하나 + drizzle 스냅샷

- [ ] **Step 1: 마이그레이션을 만든다**

🔴 `.env.local`에 이 머신 전용 `DATABASE_URL`(로컬 postgres)과 `PAYLOAD_DB_PUSH=true`가 있어야 한다. 지금 `.env.local`은 두 줄이 주석 처리돼 있고 `.env`가 공유 Supabase를 가리킨다. 주석을 풀고 로컬 DB를 만든 뒤 진행한다.

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22
pnpm migrate:create template_policy_fields
```

- [ ] **Step 2: 생성된 SQL을 읽는다**

`migrations/<timestamp>_template_policy_fields.ts`를 열어 확인한다.

- `templates`·`_templates_v`에 `background_policy`·`text_policy`(jsonb) 추가
- `templates`·`_templates_v`에서 `controller_restrictions`·`controller_presentation`(및 `version_` 접두 대응 컬럼) 삭제
- 다른 컬렉션의 컬럼은 건드리지 않음

다른 변경이 섞여 있으면 스냅샷이 낡은 것이므로 멈추고 원인을 찾는다.

- [ ] **Step 3: 빈 DB에 적용해 검증한다**

```bash
createdb lbs_migrate_check
DATABASE_URL=postgresql://postgres@localhost:5432/lbs_migrate_check PAYLOAD_DB_PUSH=false pnpm payload migrate
```
Expected: 전체 마이그레이션이 오류 없이 끝난다

```bash
dropdb lbs_migrate_check
```

- [ ] **Step 4: 스펙 상태를 갱신한다**

스펙 문서 두 번째 줄을 바꾼다.

```
작성 2026-08-19 · 상태: 구현 완료
```

- [ ] **Step 5: 커밋**

스키마 소스와 마이그레이션·스냅샷·index를 한 커밋에 넣는다.

```bash
git add migrations docs/superpowers/specs/2026-08-19-template-admin-policy-consolidation-design.md
git commit -m "chore: 템플릿 정책 필드 교체 마이그레이션을 넣는다"
```

- [ ] **Step 6: 전체 검증**

```bash
pnpm typecheck && pnpm check
pnpm vitest run src/collections src/features src/components src/lib src/modules
```
Expected: 전부 PASS

---

## 이미 구현돼 있어 손대지 않는 것

스펙의 `세부 설정` 표에는 아래 행도 있지만 **코드에 이미 있다.** Figma 정본에만 없거나 표시값이 틀린 것이므로 이 계획에 Task가 없다.

| 행 | 이미 있는 곳 |
| --- | --- |
| 라벨 · 플레이스홀더 | `template-layer-editors.tsx` `SpecField id="slot-spec-label"`·`slot-spec-placeholder` |
| 형식 · 최대 글자 · 최대 줄 · AI 지시 | 같은 파일 `slot-spec-format`·`slot-spec-max-length`·`slot-spec-max-lines`·`slot-spec-ai` |
| 라인아트 선·배경 색 | 같은 파일 `image-colorize-*` |
| 벡터 자산 · 맞춤 · 색 | `vector-layer-editor.tsx` |
| 사용 상태 · 기본 표시 · 숨김 가능 | 같은 파일 `template-layer-access`·`template-layer-default-visible`·`template-layer-visibility-toggle` |
| 비편집 레이어 안내 문구 | 같은 파일 `${typeLabel(...)} 레이어는 아직 편집할 값이 없습니다.` |

## 배포 메모

- 공유 stage DB는 `migrations/**` push에 `deploy-migrations.yml`이 자동 적용한다. 사람이 `payload migrate`를 돌리지 않는다.
- 기존 템플릿 4개(id 9·10·12·13)는 두 정책이 비어 있는 상태로 시작한다. 빈 값 = 전부 허용이므로 창작자 화면 동작은 지금과 같다. **데이터를 심을 일이 없다.**
- 🔴 Figma 정본에 남은 미완성 둘(`배경 설정`이 `출력 설정`의 복제, 세부 설정 `형식` 표시값이 `Color`)은 이 계획 밖이다. Task 4의 섹션 UI는 정본의 두 카드 구조만 따르고 내용은 스펙을 따른다.

## 알려진 충돌 위험

다른 세션이 `src/components/shared/controller/*`와 검수 화면을 `feat/controller-review-extension`에서 손보고 있다. 이 계획은 `src/components/admin/templates/*`·템플릿 도메인·`src/lib/color.ts`에 머물지만, 컨트롤러 킷 프리미티브가 바뀌면 Task 3의 스와치가 그 결과를 따라야 한다. Task 3 착수 전에 `git log origin/stage --oneline -5`로 킷 변경이 먼저 들어왔는지 본다.
