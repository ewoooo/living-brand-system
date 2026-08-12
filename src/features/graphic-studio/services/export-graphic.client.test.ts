// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { forwardStraightGraphicConfig } from '@/features/graphic-studio/graphic-studio-manifest'
import { createControllerValues } from '@/features/studio-controller/controller-definition'
import { downloadBlob } from '@/lib/object-url'
import { exportGraphicStudioSvg } from './export-graphic.client'

vi.mock('@/lib/object-url', () => ({ downloadBlob: vi.fn() }))

describe('exportGraphicStudioSvg', () => {
	it('Effective capability와 runtime adapter가 모두 있을 때만 SVG를 저장한다', () => {
		const values = createControllerValues(forwardStraightGraphicConfig.controller.groups)
		exportGraphicStudioSvg(forwardStraightGraphicConfig, values, { width: 800, height: 600 })
		expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'forward-straight.svg')

		expect(() =>
			exportGraphicStudioSvg(
				{ ...forwardStraightGraphicConfig, output: { formats: [] } },
				values,
				{ width: 800, height: 600 },
			),
		).toThrow('unavailable')
		expect(downloadBlob).toHaveBeenCalledOnce()
	})
})
