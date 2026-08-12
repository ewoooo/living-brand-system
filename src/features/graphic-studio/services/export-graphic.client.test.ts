// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { forwardStraightGraphicConfig } from '@/features/graphic-studio/graphic-studio-manifest'
import { createControllerValues } from '@/features/studio-controller/controller-definition'
import { exportGraphicStudioSvg } from './export-graphic.client'

describe('exportGraphicStudioSvg', () => {
	it('Effective capability와 runtime adapter가 모두 있을 때만 SVG를 저장한다', () => {
		const values = createControllerValues(forwardStraightGraphicConfig.controller.groups)
		expect(
			exportGraphicStudioSvg(forwardStraightGraphicConfig, values, {
				width: 800,
				height: 600,
			}),
		).toMatchObject({ filename: 'forward-straight.svg', mimeType: 'image/svg+xml' })

		expect(() =>
			exportGraphicStudioSvg(
				{ ...forwardStraightGraphicConfig, output: { formats: [] } },
				values,
				{ width: 800, height: 600 },
			),
		).toThrow('unavailable')
	})
})
