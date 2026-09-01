import {
	acceptsControllerDraftValue,
	type ControllerControlValue,
	type ControllerGroupDefinition,
	type ControllerValues,
} from '@/modules/studio-controller/controller-definition'

/**
 * 프로파일이 소유하는 프리셋. 매니저가 admin에서 만든 **노출 컨트롤 값 조합**이다.
 *
 * 🔑 런타임의 「스타일」 컨트롤(`definition.ts`의 상수)과 다른 것이다 — 그쪽은 창작자에게 감춘
 *    파라미터를 정하는 런타임 입력이고, 이쪽은 노출된 컨트롤을 한 번에 채워 주는 **시작점**이다.
 *    그래서 값이 아니라 동작이고, 창작자가 컨트롤을 하나라도 만지면 선택이 풀린다.
 */
export type GraphicProfilePreset = {
	id: string
	label: string
	/** 런타임 입력 스키마의 일부. 여기 없는 키는 런타임 기본값을 따른다. */
	values: Readonly<Record<string, unknown>>
}

const PRESET_ID_PATTERN = /^[a-z][a-z0-9-]*$/

type GraphicPresetEntry = { presetId: string; label: string; values: Record<string, unknown> }

/**
 * 프리셋 항목 하나의 형식 오류를 설명한다. 정상이면 `null`.
 *
 * 🔑 parse는 이것으로 **버리고** admin `validate`는 이것으로 **막는다** — 두 규칙이 갈리면
 *    저장은 성공하는데 스튜디오에는 뜨지 않는 항목이 생긴다.
 */
export function describeGraphicPresetError(input: unknown): string | null {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return '프리셋 항목은 객체여야 합니다.'
	}
	const { presetId, label, values } = input as Record<string, unknown>
	if (typeof presetId !== 'string' || !PRESET_ID_PATTERN.test(presetId)) {
		return `식별자는 영문 소문자로 시작하고 소문자·숫자·하이픈만 씁니다: ${String(presetId)}`
	}
	if (typeof label !== 'string' || label.length === 0) {
		return `${presetId}: 화면에 띄울 label이 필요합니다.`
	}
	// 🔴 배열·null은 조합이 아니다 — 스프레드하면 런타임 입력이 조용히 깨진다.
	if (!values || typeof values !== 'object' || Array.isArray(values)) {
		return `${presetId}: values는 「컨트롤 id: 값」 객체여야 합니다.`
	}
	return null
}

function toPreset(input: unknown): GraphicProfilePreset | null {
	if (describeGraphicPresetError(input) !== null) return null
	const { presetId, label, values } = input as GraphicPresetEntry
	return { id: presetId, label, values }
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

/** 고른 식별자가 프로파일 프리셋이면 그 값 묶음을, 코드 프리셋이면 `null`을 준다. */
export function findGraphicProfilePreset(
	presets: readonly GraphicProfilePreset[],
	selected: unknown,
): GraphicProfilePreset | null {
	if (typeof selected !== 'string') return null
	return presets.find((preset) => preset.id === selected) ?? null
}

/**
 * 프리셋이 담은 값 중 **지금 노출된 컨트롤이 받아들이는 것만** 남긴다.
 *
 * 🔴 프리셋을 만든 뒤에 「Controller 제한」이 바뀌면 사라진 컨트롤의 값이 그대로 남아 있다.
 *    그것을 그냥 얹으면 창작자가 보지도 못하는 축이 몰래 움직인다.
 */
export function pickGraphicPresetValues(
	groups: readonly ControllerGroupDefinition[],
	preset: GraphicProfilePreset,
): ControllerValues {
	const values: ControllerValues = {}
	for (const group of groups) {
		for (const control of group.controls) {
			if (!(control.id in preset.values)) continue
			const value = preset.values[control.id] as ControllerControlValue
			if (acceptsControllerDraftValue(control, value)) values[control.id] = value
		}
	}
	return values
}
