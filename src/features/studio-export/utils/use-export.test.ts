// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useExport } from './use-export'

describe('useExport', () => {
	it('허용된 action만 한 번에 하나씩 실행하고 실패를 UI 상태로 반환한다', async () => {
		const execute = vi.fn().mockRejectedValue(new Error('내보내기 실패'))
		const { result } = renderHook(() =>
			useExport<'png' | 'pdf'>({
				canExport: (action) => action === 'png',
				execute,
			}),
		)

		await act(() => Promise.all([result.current.run('png'), result.current.run('png')]))
		expect(execute).toHaveBeenCalledOnce()
		expect(result.current.error).toBe('내보내기 실패')
		expect(result.current.exporting).toBeNull()

		await act(() => result.current.run('pdf'))
		expect(execute).toHaveBeenCalledOnce()
	})
})
