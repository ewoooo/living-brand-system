import type {
	ControllerGroupDefinition,
	ControllerOption,
} from '@/modules/studio-controller/controller-definition'

/**
 * 프리셋 select의 식별자. 🔑 런타임이 이 id로 컨트롤을 선언하면 프로파일 프리셋이 그 선택지에
 * 붙고, 선언하지 않았으면 프로파일이 프리셋을 가질 때 그룹째 만들어 준다.
 */
export const GRAPHIC_PRESET_CONTROL_ID = 'preset'

/**
 * 프로파일이 소유하는 프리셋. 브랜드 디자이너가 admin에서 만든 파라미터 조합이다.
 *
 * 🔑 코드 프리셋(`definition.ts`의 상수)을 대체하지 않고 **뒤에 붙는다** — 코드 프리셋은 DB가
 *    비어 있어도 존재하므로, 그것을 지우면 새 환경에서 창작자가 파라미터 40여 개를 맨손으로 만나게 된다.
 */
export type GraphicProfilePreset = {
	id: string
	label: string
	/** 런타임 입력 스키마의 일부. 여기 없는 키는 런타임 기본값을 따른다. */
	values: Readonly<Record<string, unknown>>
}

/** 식별자 규칙 — admin 필드의 validate와 같은 모양이다. */
const PRESET_ID_PATTERN = /^[a-z][a-z0-9-]*$/

function toPreset(input: unknown): GraphicProfilePreset | null {
	if (!input || typeof input !== 'object') return null
	const { presetId, label, values } = input as Record<string, unknown>
	if (typeof presetId !== 'string' || !PRESET_ID_PATTERN.test(presetId)) return null
	if (typeof label !== 'string' || label.length === 0) return null
	// 🔴 배열·null은 조합이 아니다 — 스프레드하면 런타임 입력이 조용히 깨진다.
	if (!values || typeof values !== 'object' || Array.isArray(values)) return null
	return { id: presetId, label, values: values as Record<string, unknown> }
}

/**
 * Payload가 준 array 값을 프리셋 목록으로 읽는다.
 *
 * 🔑 잘못된 항목은 **버린다** — 프로파일 하나가 깨졌다고 스튜디오 전체가 뜨지 않으면 안 된다.
 *    admin의 `validate`가 저장 시점에 막으므로, 여기까지 온 잘못된 값은 손으로 넣은 옛 데이터다.
 */
export function parseGraphicProfilePresets(input: unknown): readonly GraphicProfilePreset[] {
	if (!Array.isArray(input)) return []
	const presets: GraphicProfilePreset[] = []
	const seen = new Set<string>()
	for (const entry of input) {
		const preset = toPreset(entry)
		// 같은 식별자가 둘이면 앞엣것을 남긴다 — 목록 순서가 곧 admin의 순서다.
		if (!preset || seen.has(preset.id)) continue
		seen.add(preset.id)
		presets.push(preset)
	}
	return presets
}

/**
 * 프리셋 select의 선택지를 만든다. 코드 프리셋이 앞이고 프로파일 프리셋이 뒤다.
 *
 * 🔴 식별자가 겹치면 **코드가 이긴다.** 프로파일이 코드 프리셋을 덮으면 런타임이 기대하는 조합이
 *    화면에서 사라지는데, 그것이 왜 사라졌는지 admin 화면 어디에도 안 나타난다.
 */
export function mergeGraphicPresetOptions(
	codeOptions: readonly ControllerOption[],
	profilePresets: readonly GraphicProfilePreset[],
): readonly ControllerOption[] {
	const reserved = new Set(codeOptions.map((option) => option.value))
	return [
		...codeOptions,
		...profilePresets
			.filter((preset) => !reserved.has(preset.id))
			.map((preset) => ({ value: preset.id, label: preset.label })),
	]
}

/** 고른 식별자가 프로파일 프리셋이면 그 값 묶음을, 코드 프리셋이면 `null`을 준다. */
export function findGraphicProfilePreset(
	presets: readonly GraphicProfilePreset[],
	selected: unknown,
): GraphicProfilePreset | null {
	if (typeof selected !== 'string') return null
	return presets.find((preset) => preset.id === selected) ?? null
}

/**
 * 런타임 컨트롤 그룹에 프로파일 프리셋을 얹는다.
 *
 * 🔴 프리셋 컨트롤이 없는 런타임(6개 중 4개)에서 프로파일 프리셋을 조용히 버리지 않는다 —
 *    admin이 만든 것이 화면에 안 나타나면 왜 없는지 알 길이 없다. 그때는 그룹을 만들어 붙인다.
 */
export function withProfilePresetOptions(
	groups: readonly ControllerGroupDefinition[],
	presets: readonly GraphicProfilePreset[],
): readonly ControllerGroupDefinition[] {
	if (presets.length === 0) return groups

	let attached = false
	const next = groups.map((group) => ({
		...group,
		controls: group.controls.map((control) => {
			if (control.id !== GRAPHIC_PRESET_CONTROL_ID || control.kind !== 'select')
				return control
			attached = true
			return { ...control, options: mergeGraphicPresetOptions(control.options, presets) }
		}),
	}))
	if (attached) return next

	// 프리셋만 있는 그룹을 맨 앞에 세운다 — 판의 성격을 먼저 고르고 나머지를 조정하는 순서다.
	const control = {
		id: GRAPHIC_PRESET_CONTROL_ID,
		label: '프리셋',
		kind: 'select' as const,
		defaultValue: presets[0]?.id ?? null,
		options: mergeGraphicPresetOptions([], presets),
	}
	return [{ id: GRAPHIC_PRESET_CONTROL_ID, title: 'Preset', controls: [control] }, ...groups]
}
