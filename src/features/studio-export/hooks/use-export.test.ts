// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ExportRequest } from '../export-contract'
import { useExport } from './use-export'

vi.mock('../adapters/download-export-result.client', () => ({
	downloadExportResult: vi.fn(),
}))

describe('useExport', () => {
	it('허용된 action만 한 번에 하나씩 실행하고 실패를 UI 상태로 반환한다', async () => {
		type Request = Extract<ExportRequest, { format: 'png' | 'pdf' }>
		const png = {
			artifact: 'raster',
			format: 'png',
			colorProfile: { space: 'rgb', icc: 'srgb' },
			options: { scale: 1, transparent: true },
		} as const satisfies Request
		const pdf = {
			artifact: 'raster',
			format: 'pdf',
			colorProfile: { space: 'cmyk', icc: 'cgats21-crpc6' },
			options: { bleedMm: 0, ppi: 300 },
		} as const satisfies Request
		const execute = vi.fn().mockRejectedValue(new Error('내보내기 실패'))
		const { result } = renderHook(() =>
			useExport<Request>({
				capability: { formats: ['png', 'pdf'], print: { ppi: [300] } },
				canExport: (request) => request.format === 'png',
				execute,
			}),
		)

		await act(() => Promise.all([result.current.run(png), result.current.run(png)]))
		expect(execute).toHaveBeenCalledOnce()
		expect(result.current.error).toBe('내보내기 실패')
		expect(result.current.exporting).toBeNull()

		expect(result.current.canExport(pdf)).toBe(false)
		await act(() => result.current.run(pdf))
		expect(execute).toHaveBeenCalledOnce()
	})
})
