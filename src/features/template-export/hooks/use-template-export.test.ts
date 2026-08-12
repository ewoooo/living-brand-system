// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canExportTemplate } from '../services/export-template'
import { exportTemplate } from '../services/export-template.client'
import { useTemplateExport } from './use-template-export'

vi.mock('../services/export-template', () => ({
	canExportTemplate: vi.fn(),
}))
vi.mock('../services/export-template.client', () => ({
	exportTemplate: vi.fn(),
}))

const input = {
	fileName: '브랜드 카드',
	height: 300,
	html: '<div id="__stage">카드</div>',
	output: { formats: ['png', 'tiff', 'pdf'] as const },
	printPpi: 300 as const,
	templateId: 12,
	templateVersion: '2026-07-29',
	width: 600,
}

describe('useTemplateExport', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(canExportTemplate).mockReturnValue(true)
	})

	it('가용 조건과 실행을 export use case에 위임한다', async () => {
		const { result } = renderHook(() => useTemplateExport(input))

		await act(() => result.current.exportTemplate('pdf'))
		expect(exportTemplate).toHaveBeenCalledWith('pdf', input)
		expect(result.current.canExport('tiff')).toBe(true)
		expect(canExportTemplate).toHaveBeenCalledWith('tiff', input)
		expect(result.current.exporting).toBeNull()
		expect(result.current.exportError).toBeNull()
	})

	it('형식별 오류를 공통 계약으로 반환한다', async () => {
		vi.mocked(exportTemplate).mockRejectedValue(new Error('템플릿이 변경되었습니다.'))
		const { result } = renderHook(() => useTemplateExport(input))

		await act(() => result.current.exportTemplate('tiff'))

		expect(result.current.exportError).toBe('템플릿이 변경되었습니다.')
		expect(result.current.exporting).toBeNull()
	})
})
