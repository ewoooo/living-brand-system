import { describe, expect, it } from 'vitest'
import { createControllerValues } from '@/features/studio-controller/controller-definition'
import { parseGraphicStudioConfig } from './graphic-studio-config'
import {
	forwardStraightGraphicConfig,
	getGraphicStudioRuntimeBindings,
	graphicStudioConfigs,
	renderGraphicStudioSvg,
} from './graphic-studio-runtime'

const config = forwardStraightGraphicConfig

describe('graphicStudioRuntime', () => {
	it('Graphic 계약을 멱등하게 검증하고 잘못된 studio·type을 거부한다', () => {
		expect(parseGraphicStudioConfig(parseGraphicStudioConfig(config))).toBe(config)
		expect(() => parseGraphicStudioConfig({ ...config, studio: 'image' })).toThrow('studio')
		expect(() => parseGraphicStudioConfig({ ...config, type: 'canvas' })).toThrow('type')
	})

	it('registry가 config·SVG projector·명시적 binding을 함께 제공한다', () => {
		expect(graphicStudioConfigs).toContain(config)
		const values = createControllerValues(config.controller.groups)
		expect(renderGraphicStudioSvg(config, values, { width: 800, height: 600 })).toContain(
			'viewBox="0 0 800 600"',
		)
		expect(getGraphicStudioRuntimeBindings(config, { width: 800, height: 600 })).toEqual({
			origin: { padAspectRatio: 4 / 3 },
		})
	})

	it('미등록 id와 type mismatch를 fail-closed한다', () => {
		const values = createControllerValues(config.controller.groups)
		for (const unsupported of [
			{ ...config, id: 'missing' },
			{ ...config, type: 'shader' as const },
		]) {
			expect(
				renderGraphicStudioSvg(unsupported, values, { width: 800, height: 600 }),
			).toBeNull()
			expect(
				getGraphicStudioRuntimeBindings(unsupported, { width: 800, height: 600 }),
			).toEqual({})
		}
	})

	it('유효하지 않은 viewport에는 기하 binding을 만들지 않는다', () => {
		expect(getGraphicStudioRuntimeBindings(config, { width: 0, height: 600 })).toEqual({})
		expect(getGraphicStudioRuntimeBindings(config, { width: 800, height: 0 })).toEqual({})
	})
})
