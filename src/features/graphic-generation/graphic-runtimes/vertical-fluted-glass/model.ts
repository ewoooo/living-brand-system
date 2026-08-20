import {
	type LinearFlutedGlassInput,
	linearFlutedGlassInputSchema,
} from '@/features/graphic-generation/graphic-runtimes/linear-fluted-glass/model'
import type {
	ControllerControlValue,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import {
	VERTICAL_FLUTED_GLASS_DEFAULT_INPUT,
	VERTICAL_FLUTED_GLASS_PRESETS,
	type VerticalFlutedGlassPresetId,
} from './definition'

// 셰이더 입력·pad 바인딩은 linear가 소유한다 — 세로형은 기본값·프리셋만 다르다.
export { default } from '@/features/graphic-generation/graphic-runtimes/linear-fluted-glass/model'
export { VERTICAL_FLUTED_GLASS_DEFAULT_INPUT } from './definition'

export type VerticalFlutedGlassInput = LinearFlutedGlassInput

/** 컨트롤러가 고른 프리셋. 알 수 없는 값이면 기본으로 떨어진다 — 저장된 값이 낡아도 화면은 뜬다. */
function resolveVerticalFlutedGlassPreset(value: ControllerControlValue) {
	const id = typeof value === 'string' ? value : ''
	return id in VERTICAL_FLUTED_GLASS_PRESETS
		? VERTICAL_FLUTED_GLASS_PRESETS[id as VerticalFlutedGlassPresetId]
		: VERTICAL_FLUTED_GLASS_PRESETS.basic
}

/**
 * Controller 값을 shader uniform 입력으로 검증한다.
 *
 * 컨트롤러는 노출된 값만 갖는다 — 나머지는 프리셋이 정한다. 셰이더는 여전히 전체 uniform을
 * 요구하므로 여기서 기본값 → 프리셋 → 노출 값 순으로 덮어 완전한 입력을 만든다.
 */
export function toVerticalFlutedGlassInput(values: ControllerValues): VerticalFlutedGlassInput {
	const base = {
		...VERTICAL_FLUTED_GLASS_DEFAULT_INPUT,
		...resolveVerticalFlutedGlassPreset(values.preset),
	}
	return linearFlutedGlassInputSchema.parse({
		...base,
		rayColor1: values.rayColor1 ?? base.rayColor1,
		rayColor2: values.rayColor2 ?? base.rayColor2,
		rayColor3: values.rayColor3 ?? base.rayColor3,
		rayColor4: values.rayColor4 ?? base.rayColor4,
		rayColor5: values.rayColor5 ?? base.rayColor5,
		rayBackgroundColor: values.rayBackgroundColor ?? base.rayBackgroundColor,
		paletteDrift: values.paletteDrift ?? base.paletteDrift,
		bloomColor: values.bloomColor ?? base.bloomColor,
		rayBloom: values.rayBloom ?? base.rayBloom,
		rayIntensity: values.rayIntensity ?? base.rayIntensity,
		raySpotty: values.raySpotty ?? base.raySpotty,
		rayMidSize: values.rayMidSize ?? base.rayMidSize,
		speed: values.speed ?? base.speed,
		rayScale: values.rayScale ?? base.rayScale,
		glassSize: values.glassSize ?? base.glassSize,
		ribCurve: values.ribCurve ?? base.ribCurve,
		distortionShape: values.distortionShape ?? base.distortionShape,
	})
}
