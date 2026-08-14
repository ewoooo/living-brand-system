import { describe, expect, it } from 'vitest'
import radialFlutedGlassRuntimeManifest, {
	RADIAL_FLUTED_GLASS_DEFAULT_INPUT,
} from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/definition'
import {
	radialFlutedGlassColorToRgb,
	radialFlutedGlassDistortionShapeToUniform,
	toRadialFlutedGlassInput,
	toRadialFlutedGlassShaderPoint,
} from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/model'
import { createControllerValues } from '@/modules/studio-controller/controller-definition'

describe('radialFlutedGlass', () => {
	it('Controller 기본값을 shader uniform 입력으로 검증한다', () => {
		const values = createControllerValues(radialFlutedGlassRuntimeManifest.controller.groups)
		expect(toRadialFlutedGlassInput(values)).toEqual(RADIAL_FLUTED_GLASS_DEFAULT_INPUT)
		expect(radialFlutedGlassColorToRgb('#3dff8a')).toEqual([61 / 255, 1, 138 / 255])
	})

	it('색상 reset은 기본 블룸으로 되돌리고 범위 밖 값은 거부한다', () => {
		const values = createControllerValues(radialFlutedGlassRuntimeManifest.controller.groups)
		expect(toRadialFlutedGlassInput({ ...values, bloomColor: null }).bloomColor).toBe(
			RADIAL_FLUTED_GLASS_DEFAULT_INPUT.bloomColor,
		)
		expect(() => toRadialFlutedGlassInput({ ...values, speed: 2.01 })).toThrow()
		expect(() => toRadialFlutedGlassInput({ ...values, sourceOffsetX: 2.01 })).toThrow()
	})

	it('Controller 화면 좌표의 Y축을 WebGL 좌표로 반전한다', () => {
		expect(toRadialFlutedGlassShaderPoint({ x: -0.75, y: 0.5 })).toEqual([-0.75, -0.5])
		expect(toRadialFlutedGlassShaderPoint({ x: -0.75, y: 0.5 }, { x: -0.5, y: 0.75 })).toEqual([
			-1.25, -1.25,
		])
	})

	it('왜곡 형태를 shader 정수 uniform으로 변환한다', () => {
		expect(radialFlutedGlassDistortionShapeToUniform('cascade')).toBe(0)
		expect(radialFlutedGlassDistortionShapeToUniform('lens')).toBe(3)
	})
})
