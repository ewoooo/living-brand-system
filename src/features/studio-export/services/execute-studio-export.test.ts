import { describe, expect, it, vi } from 'vitest'
import type { ExportRequest } from '../export-contract'
import {
	executeStudioExport,
	type StudioExportSource,
	supportsStudioExportSource,
} from './execute-studio-export'

describe('executeStudioExport', () => {
	it('형식을 해당 family의 단일 handler로 전달한다', async () => {
		type Request = Extract<ExportRequest, { format: 'png' | 'svg' }>
		const result = {
			data: new Blob(),
			filename: 'studio.png',
			mimeType: 'image/png',
		}
		const png = vi.fn(async () => result)
		const source = { raster: { png } } satisfies StudioExportSource<Request>
		const request = {
			format: 'png',
			colorProfile: { space: 'rgb', icc: 'srgb' },
			options: { scale: 1, transparent: true },
		} as const satisfies Request

		await expect(executeStudioExport(source, request)).resolves.toBe(result)
		expect(png).toHaveBeenCalledWith(request)
		expect(supportsStudioExportSource(source, request)).toBe(true)
	})

	it('실행 port가 없는 형식은 거부한다', () => {
		const request = {
			format: 'svg',
			colorProfile: { space: 'rgb', icc: 'srgb' },
			options: { width: 100, height: 100, outlineText: false },
		} as const satisfies ExportRequest

		const source = {}
		expect(supportsStudioExportSource(source, request)).toBe(false)
		expect(() => executeStudioExport(source, request)).toThrow('SVG export is unavailable.')
	})
})
