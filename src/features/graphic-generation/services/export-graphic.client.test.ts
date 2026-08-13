// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { forwardStraightGraphicConfig } from '@/features/graphic-generation/domain/graphic-studio-manifest'
import { createControllerValues } from '@/modules/studio-controller/controller-definition'
import { exportGraphicStudioSvg } from './export-graphic.client'

const request = {
	format: 'svg',
	colorProfile: { space: 'rgb', icc: 'srgb' },
	options: { width: 800, height: 600, outlineText: false },
} as const

describe('exportGraphicStudioSvg', () => {
	it('Effective capability와 runtime adapter가 모두 있을 때만 SVG를 저장한다', () => {
		const values = createControllerValues(forwardStraightGraphicConfig.controller.groups)
		expect(exportGraphicStudioSvg(forwardStraightGraphicConfig, values, request)).toMatchObject(
			{ filename: 'forward-straight.svg', mimeType: 'image/svg+xml' },
		)

		expect(() =>
			exportGraphicStudioSvg(
				{ ...forwardStraightGraphicConfig, output: { formats: [] } },
				values,
				request,
			),
		).toThrow('unavailable')
	})
})
