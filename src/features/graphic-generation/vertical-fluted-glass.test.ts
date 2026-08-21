import { describe, expect, it } from 'vitest'
import verticalFlutedGlassRuntimeManifest, {
	VERTICAL_FLUTED_GLASS_DEFAULT_INPUT,
	VERTICAL_FLUTED_GLASS_PRESET_IDS,
	VERTICAL_FLUTED_GLASS_PRESETS,
} from '@/features/graphic-generation/graphic-runtimes/vertical-fluted-glass/definition'
import { toVerticalFlutedGlassInput } from '@/features/graphic-generation/graphic-runtimes/vertical-fluted-glass/model'
import {
	type ControllerGroupDefinition,
	createControllerValues,
} from '@/modules/studio-controller/controller-definition'

describe('verticalFlutedGlass', () => {
	const groups: readonly ControllerGroupDefinition[] =
		verticalFlutedGlassRuntimeManifest.controller.groups
	const controls = groups.flatMap((group) => group.controls)

	it('Controller 기본값을 shader uniform 입력으로 검증한다', () => {
		const values = createControllerValues(verticalFlutedGlassRuntimeManifest.controller.groups)
		expect(toVerticalFlutedGlassInput(values)).toEqual(VERTICAL_FLUTED_GLASS_DEFAULT_INPUT)
	})

	it('노출된 값은 범위를 지키고, 색상 reset은 기본값으로 되돌아간다', () => {
		const values = createControllerValues(verticalFlutedGlassRuntimeManifest.controller.groups)
		expect(toVerticalFlutedGlassInput({ ...values, rayColor1: null }).rayColor1).toBe(
			VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor1,
		)
		expect(() => toVerticalFlutedGlassInput({ ...values, speed: 2.01 })).toThrow()
	})

	it('컨트롤러에 없는 값은 프리셋이 정하고 컨트롤러 값으로 덮이지 않는다', () => {
		const values = createControllerValues(verticalFlutedGlassRuntimeManifest.controller.groups)
		const input = toVerticalFlutedGlassInput({
			...values,
			preset: 'focused',
			axisFalloff: 3.01,
		})
		expect(input.axisFalloff).toBe(VERTICAL_FLUTED_GLASS_PRESETS.focused.axisFalloff)
	})

	it('알 수 없는 프리셋은 기본으로 떨어진다 — 저장된 값이 낡아도 화면은 뜬다', () => {
		const values = createControllerValues(verticalFlutedGlassRuntimeManifest.controller.groups)
		expect(toVerticalFlutedGlassInput({ ...values, preset: 'no-such-preset' })).toEqual(
			VERTICAL_FLUTED_GLASS_DEFAULT_INPUT,
		)
	})

	// 세로 축은 이 런타임의 정체성이다 — 프리셋이 각도를 눕히면 linear와 구분이 사라진다.
	it('모든 프리셋이 세로를 지킨다 — 광선은 -90°, 리브는 90°로 고정된다', () => {
		const values = createControllerValues(verticalFlutedGlassRuntimeManifest.controller.groups)
		for (const preset of VERTICAL_FLUTED_GLASS_PRESET_IDS) {
			const input = toVerticalFlutedGlassInput({ ...values, preset })
			expect(input.rayRotation).toBe(-90)
			expect(input.glassAngle).toBe(90)
			// 광원도 상단 축 위에 있어야 한다 — 프리셋은 가로 위치(x)만 옮긴다.
			expect(input.source.y).toBe(-0.62)
		}
	})

	it('프리셋은 노출된 컨트롤을 건드리지 않는다 — 겹치면 컨트롤러 기본값이 이겨 조용히 무시된다', () => {
		const exposed = new Set(controls.map((control) => control.id))
		for (const preset of VERTICAL_FLUTED_GLASS_PRESET_IDS) {
			const clash = Object.keys(VERTICAL_FLUTED_GLASS_PRESETS[preset]).filter((key) =>
				exposed.has(key),
			)
			expect(clash, preset).toEqual([])
		}
	})

	it('프리셋 select이 프리셋 목록을 그대로 담는다', () => {
		const preset = controls.find((control) => control.id === 'preset')
		expect(
			preset && 'options' in preset ? preset.options.map(({ value }) => value) : null,
		).toEqual([...VERTICAL_FLUTED_GLASS_PRESET_IDS])
	})
})
