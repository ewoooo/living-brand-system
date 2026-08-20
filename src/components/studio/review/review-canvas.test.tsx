import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CheckImageContextValue } from '@/features/asset-check/types'

const useCheckImages = vi.fn<() => CheckImageContextValue>()
vi.mock('@/features/asset-check/hooks/use-check-images', () => ({
	useCheckImages: () => useCheckImages(),
}))
// 캐러셀은 embla·object URL을 끌고 오므로 캔버스 골격만 보는 이 테스트에서는 대역을 세운다.
vi.mock('@/components/studio/review/upload/image-upload-carousel', () => ({
	ImageUploadCarousel: () => <div data-slot="image-upload-carousel" />,
}))

const { ReviewCanvas } = await import('./review-canvas')

describe('ReviewCanvas', () => {
	afterEach(cleanup)

	it('하단 바는 캔버스 열 안에 뜬다', () => {
		// 🔴 바는 absolute left-1/2다 — relative 조상이 캔버스 열이어야 캔버스 중앙에 남는다(디자인 56:2087).
		useCheckImages.mockReturnValue(context())
		const { container } = render(<ReviewCanvas />)

		const canvas = container.querySelector('[data-slot="review-canvas"]')
		const bar = container.querySelector('[data-slot="controller-bar"]')
		expect(canvas).toContainElement(bar as HTMLElement)
	})

	it('근거 패널은 캔버스가 그리지 않는다 — 사이드바 블록이 소유한다', () => {
		// 룰이 펼쳐져 있어도 캔버스에는 아무것도 늘어나지 않는다(디자인 78:2706 — 확장은 사이드바 쪽).
		useCheckImages.mockReturnValue(context({ selectedRuleKey: 'color.palette' }))
		const { container } = render(<ReviewCanvas />)

		expect(container.querySelector('[data-slot="review-rule-detail"]')).toBeNull()
	})
})

function context(patch: Partial<CheckImageContextValue> = {}): CheckImageContextValue {
	return {
		scenarios: [],
		images: [],
		selectedId: 'image-1',
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
