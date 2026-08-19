import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AiCheckResult, CheckResult } from '@/features/asset-check/checkers/types'
import type { CheckImage, CheckImageContextValue } from '@/features/asset-check/types'

const useCheckImages = vi.fn<() => CheckImageContextValue>()
vi.mock('@/features/asset-check/hooks/use-check-images', () => ({
	useCheckImages: () => useCheckImages(),
}))
// 캐러셀은 embla·object URL을 끌고 오므로 캔버스 분할만 보는 이 테스트에서는 대역을 세운다.
vi.mock('@/components/studio/review/upload/image-upload-carousel', () => ({
	ImageUploadCarousel: () => <div data-slot="image-upload-carousel" />,
}))

const { ReviewCanvas } = await import('./review-canvas')

describe('ReviewCanvas', () => {
	afterEach(cleanup)

	it('고른 룰이 없으면 근거 패널을 그리지 않는다', () => {
		useCheckImages.mockReturnValue(context({ selected: image({}) }))
		const { container } = render(<ReviewCanvas />)

		expect(container.querySelector('[data-slot="review-rule-detail"]')).toBeNull()
	})

	it('고른 룰의 기준별 판정·신뢰도·근거를 편다', () => {
		useCheckImages.mockReturnValue(
			context({
				selected: image({ results: { 'color.palette': aiResult() } }),
				selectedRuleKey: 'color.palette',
			}),
		)
		render(<ReviewCanvas />)

		expect(screen.getByRole('heading', { name: 'color.palette' })).toBeInTheDocument()
		expect(screen.getByText('Pass')).toBeInTheDocument()
		expect(screen.getByText('Review')).toBeInTheDocument()
		expect(screen.getByText('90%')).toBeInTheDocument()
		expect(screen.getByText('로고가 있어야 합니다')).toBeInTheDocument()
	})

	it('하단 바는 근거 패널을 뺀 캔버스 열 안에 뜬다', () => {
		// 🔴 바는 absolute left-1/2다 — relative 조상이 패널까지 품으면 패널이 열릴 때마다
		//    바가 패널 폭의 절반만큼 오른쪽으로 밀린다(디자인 56:2087은 캔버스 중앙).
		useCheckImages.mockReturnValue(
			context({
				selected: image({ results: { 'color.palette': aiResult() } }),
				selectedRuleKey: 'color.palette',
			}),
		)
		const { container } = render(<ReviewCanvas />)

		const stage = container.querySelector('[data-slot="review-canvas-stage"]')
		const bar = container.querySelector('[data-slot="controller-bar"]')
		const detail = container.querySelector('[data-slot="review-rule-detail"]')

		expect(stage).toContainElement(bar as HTMLElement)
		expect(stage).not.toContainElement(detail as HTMLElement)
	})

	it('판정이 사라진 룰은 패널이 스스로 닫힌다', () => {
		// 재검수·시나리오 변경으로 results가 비면 selectedRuleKey가 남아 있어도 그릴 것이 없다.
		useCheckImages.mockReturnValue(
			context({ selected: image({}), selectedRuleKey: 'color.palette' }),
		)
		const { container } = render(<ReviewCanvas />)

		expect(container.querySelector('[data-slot="review-rule-detail"]')).toBeNull()
	})

	it('닫기 버튼이 선택을 푼다', () => {
		const selectRule = vi.fn()
		useCheckImages.mockReturnValue(
			context({
				selected: image({ results: { 'color.palette': aiResult() } }),
				selectedRuleKey: 'color.palette',
				selectRule,
			}),
		)
		render(<ReviewCanvas />)

		fireEvent.click(screen.getByRole('button', { name: '판정 근거 닫기' }))
		expect(selectRule).toHaveBeenCalledWith(null)
	})
})

function image(patch: Partial<CheckImage>): CheckImage {
	return {
		id: 'image-1',
		url: 'blob:test',
		name: 'test.png',
		file: {} as File,
		scenarioKey: 'quick',
		status: 'completed',
		...patch,
	}
}

// 🔴 confidence는 0~1이 아니라 0~100이다(ai-observation-task의 프롬프트 계약).
//    이 픽스처가 0.9였던 탓에 화면이 100을 곱해 5800%로 나가는 동안 테스트는 통과했다.
function aiResult(): CheckResult {
	const observations: AiCheckResult['observations'] = [
		{
			criterionId: 'c-0',
			question: '로고가 있어야 합니다',
			expected: 'present',
			actual: 'present',
			confidence: 90,
			reason: '좌상단에서 로고를 찾았습니다',
			satisfied: true,
		},
		{
			criterionId: 'c-1',
			question: '여백이 충분해야 합니다',
			expected: 'present',
			actual: 'uncertain',
			confidence: 40,
			reason: '경계가 흐려 판단하지 못했습니다',
			satisfied: null,
		},
	]

	return {
		rule: { key: 'color.palette', title: 'color.palette', executor: 'heuristic' },
		checker: { key: 'ai', type: 'ai' },
		rawResult: { status: 'needs_review', fulfillment: null, observations },
	}
}

function context(patch: Partial<CheckImageContextValue>): CheckImageContextValue {
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
