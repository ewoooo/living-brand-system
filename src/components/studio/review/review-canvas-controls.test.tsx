import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CheckImage, CheckImageContextValue } from '@/features/asset-check/types'

const useCheckImages = vi.fn<() => CheckImageContextValue>()
vi.mock('@/features/asset-check/hooks/use-check-images', () => ({
	useCheckImages: () => useCheckImages(),
}))

const { ReviewCanvasControls } = await import('./review-canvas-controls')

describe('ReviewCanvasControls', () => {
	afterEach(cleanup)

	it('선택 위치를 1부터 세어 보여준다', () => {
		useCheckImages.mockReturnValue(context({ images: files(3), selectedId: 'file-1' }))
		renderControls()

		// 화면은 두 칸(2 | 3)으로 나뉘므로 읽히는 문장은 sr-only가 갖는다.
		expect(screen.getByText('3개 중 2번째 파일')).toBeInTheDocument()
	})

	it('이동은 선택만 바꾼다 — 캐러셀은 선택을 따라온다', () => {
		const select = vi.fn()
		useCheckImages.mockReturnValue(context({ images: files(3), selectedId: 'file-1', select }))
		renderControls()

		fireEvent.click(screen.getByRole('button', { name: '다음 파일' }))
		expect(select).toHaveBeenCalledWith('file-2')

		fireEvent.click(screen.getByRole('button', { name: '이전 파일' }))
		expect(select).toHaveBeenCalledWith('file-0')
	})

	it('양 끝에서 이동 버튼을 잠근다', () => {
		useCheckImages.mockReturnValue(context({ images: files(2), selectedId: 'file-0' }))
		renderControls()

		expect(screen.getByRole('button', { name: '이전 파일' })).toBeDisabled()
		expect(screen.getByRole('button', { name: '다음 파일' })).toBeEnabled()
	})

	it('파일이 없으면 양쪽 모두 잠긴다', () => {
		useCheckImages.mockReturnValue(context({ images: [], selectedId: null }))
		renderControls()

		expect(screen.getByText('0개 중 0번째 파일')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '이전 파일' })).toBeDisabled()
		expect(screen.getByRole('button', { name: '다음 파일' })).toBeDisabled()
	})

	it('전체 결과 보기는 자리만 잡고 잠겨 있다', () => {
		useCheckImages.mockReturnValue(context({ images: files(2), selectedId: 'file-0' }))
		renderControls()

		expect(screen.getByRole('button', { name: '전체 결과 보기' })).toBeDisabled()
	})
})

function renderControls() {
	return render(<ReviewCanvasControls previewSize={50} onPreviewSizeChange={vi.fn()} />)
}

function files(count: number): CheckImage[] {
	return Array.from({ length: count }, (_, index) => ({
		id: `file-${index}`,
		url: 'blob:test',
		name: `file-${index}.png`,
		file: {} as File,
		scenarioKey: 'quick',
		status: 'idle' as const,
	}))
}

function context(patch: Partial<CheckImageContextValue>): CheckImageContextValue {
	return {
		scenarios: [],
		images: [],
		selectedId: null,
		selected: null,
		select: vi.fn(),
		addFiles: vi.fn(),
		scenarioKey: 'quick',
		setScenarioKey: vi.fn(),
		showFailOnly: false,
		toggleFailOnly: vi.fn(),
		runCheck: vi.fn(),
		runAllChecks: vi.fn(),
		selectedRuleKey: null,
		selectRule: vi.fn(),
		...patch,
	}
}
