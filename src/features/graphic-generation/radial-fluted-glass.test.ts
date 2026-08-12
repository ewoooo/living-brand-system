import { describe, expect, it } from 'vitest'
import { radialFlutedGlassGraphicConfig } from '@/features/graphic-generation/domain/graphic-studio-manifest'
import { createControllerValues } from '@/modules/studio-controller/controller-definition'
import {
	RADIAL_FLUTED_GLASS_DEFAULT_INPUT,
	radialFlutedGlassColorToRgb,
	toRadialFlutedGlassInput,
} from './radial-fluted-glass'

describe('radialFlutedGlass', () => {
	it('Controller 기본값을 shader uniform 입력으로 검증한다', () => {
		const values = createControllerValues(radialFlutedGlassGraphicConfig.controller.groups)
		expect(toRadialFlutedGlassInput(values)).toEqual(RADIAL_FLUTED_GLASS_DEFAULT_INPUT)
		expect(radialFlutedGlassColorToRgb('#3dff8a')).toEqual([61 / 255, 1, 138 / 255])
	})

	it('색상 reset은 기본 블룸으로 되돌리고 범위 밖 값은 거부한다', () => {
		const values = createControllerValues(radialFlutedGlassGraphicConfig.controller.groups)
		expect(toRadialFlutedGlassInput({ ...values, bloomColor: null }).bloomColor).toBe(
			RADIAL_FLUTED_GLASS_DEFAULT_INPUT.bloomColor,
		)
		expect(() => toRadialFlutedGlassInput({ ...values, speed: 2.01 })).toThrow()
	})
})
