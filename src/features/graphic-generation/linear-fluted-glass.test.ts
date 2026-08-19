import { describe, expect, it } from 'vitest'
import linearFlutedGlassRuntimeManifest, {
	LINEAR_FLUTED_GLASS_DEFAULT_INPUT,
	LINEAR_FLUTED_GLASS_PRESET_IDS,
	LINEAR_FLUTED_GLASS_PRESETS,
} from '@/features/graphic-generation/graphic-runtimes/linear-fluted-glass/definition'
import {
	linearFlutedGlassColorToRgb,
	linearFlutedGlassDistortionShapeToUniform,
	toLinearFlutedGlassInput,
	toLinearFlutedGlassShaderPoint,
} from '@/features/graphic-generation/graphic-runtimes/linear-fluted-glass/model'
import { createControllerValues } from '@/modules/studio-controller/controller-definition'

describe('linearFlutedGlass', () => {
	it('Controller 기본값을 shader uniform 입력으로 검증한다', () => {
		const values = createControllerValues(linearFlutedGlassRuntimeManifest.controller.groups)
		expect(toLinearFlutedGlassInput(values)).toEqual(LINEAR_FLUTED_GLASS_DEFAULT_INPUT)
		expect(linearFlutedGlassColorToRgb('#37f08c')).toEqual([55 / 255, 240 / 255, 140 / 255])
	})

	it('노출된 값은 범위를 지키고, 색상 reset은 기본값으로 되돌아간다', () => {
		const values = createControllerValues(linearFlutedGlassRuntimeManifest.controller.groups)
		expect(toLinearFlutedGlassInput({ ...values, rayColor1: null }).rayColor1).toBe(
			LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayColor1,
		)
		expect(() => toLinearFlutedGlassInput({ ...values, speed: 2.01 })).toThrow()
	})

	it('컨트롤러에 없는 값은 프리셋이 정하고 컨트롤러 값으로 덮이지 않는다', () => {
		const values = createControllerValues(linearFlutedGlassRuntimeManifest.controller.groups)
		// axisFalloff는 노출되지 않는다 — 값을 밀어 넣어도 프리셋이 이긴다.
		const input = toLinearFlutedGlassInput({ ...values, preset: 'focused', axisFalloff: 3.01 })
		expect(input.axisFalloff).toBe(LINEAR_FLUTED_GLASS_PRESETS.focused.axisFalloff)
		expect(input.rayDensity).toBe(LINEAR_FLUTED_GLASS_PRESETS.focused.rayDensity)
	})

	it('프리셋이 정하지 않은 숨은 값은 기본값을 그대로 쓴다', () => {
		const values = createControllerValues(linearFlutedGlassRuntimeManifest.controller.groups)
		const input = toLinearFlutedGlassInput({ ...values, preset: 'upperAxis' })
		expect(input.source).toEqual(LINEAR_FLUTED_GLASS_PRESETS.upperAxis.source)
		expect(input.rayBackgroundColor).toBe(LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayBackgroundColor)
	})

	it('알 수 없는 프리셋은 기본으로 떨어진다 — 저장된 값이 낡아도 화면은 뜬다', () => {
		const values = createControllerValues(linearFlutedGlassRuntimeManifest.controller.groups)
		expect(toLinearFlutedGlassInput({ ...values, preset: 'no-such-preset' })).toEqual(
			LINEAR_FLUTED_GLASS_DEFAULT_INPUT,
		)
	})

	it('모든 프리셋이 수평을 지킨다 — 앵글은 프리셋이 건드리지 않는다', () => {
		const values = createControllerValues(linearFlutedGlassRuntimeManifest.controller.groups)
		for (const preset of LINEAR_FLUTED_GLASS_PRESET_IDS) {
			const input = toLinearFlutedGlassInput({ ...values, preset })
			expect(input.rayRotation).toBe(0)
			expect(input.glassAngle).toBe(0)
		}
	})

	it('Controller 화면 좌표의 Y축을 WebGL 좌표로 반전한다', () => {
		expect(toLinearFlutedGlassShaderPoint({ x: -0.75, y: 0.5 })).toEqual([-0.75, -0.5])
		expect(toLinearFlutedGlassShaderPoint({ x: -0.75, y: 0.5 }, { x: -0.5, y: 0.75 })).toEqual([
			-1.25, -1.25,
		])
	})

	it('왜곡 형태를 shader 정수 uniform으로 변환한다', () => {
		expect(linearFlutedGlassDistortionShapeToUniform('cascade')).toBe(0)
		expect(linearFlutedGlassDistortionShapeToUniform('lens')).toBe(3)
	})

	// uniform 이름 오타는 컴파일도 통과하고 화면만 조용히 비므로 텍스트로 대조한다.
	it('shader가 선언한 uniform과 runtime이 쓰는 uniform이 정확히 일치한다', async () => {
		const { readFile } = await import('node:fs/promises')
		const [shader, runtime] = await Promise.all([
			readFile(
				'src/features/graphic-generation/graphic-runtimes/linear-fluted-glass/shader.ts',
				'utf8',
			),
			readFile(
				'src/features/graphic-generation/graphic-runtimes/linear-fluted-glass/runtime.client.ts',
				'utf8',
			),
		])
		const declared = Array.from(
			shader.matchAll(/^uniform\s+\w+\s+(\w+);/gm),
			(match) => match[1],
		).sort()
		const written = Array.from(
			runtime.matchAll(/getUniformLocation\(program,\s*'(\w+)'\)/g),
			(match) => match[1],
		).sort()

		expect(written).toEqual(declared)
	})
})
