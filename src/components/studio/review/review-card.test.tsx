import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import type { CheckImage } from '@/features/asset-check/types'
import { ReviewCard } from './review-card'

describe('ReviewCard', () => {
	afterEach(cleanup)

	it('검사 전 행에서 시나리오를 고르면 그 이미지의 키를 올려보내고 목록을 닫는다', () => {
		const onScenarioChange = vi.fn()
		const { container } = render(
			<ReviewCard
				image={checkImage({})}
				scenarios={scenarios}
				selected={false}
				onOpen={vi.fn()}
				onScenarioChange={onScenarioChange}
			/>,
		)

		// 행 자체가 버튼이므로 트리거는 그 안이 아니라 형제로 겹쳐 앉아야 한다.
		expect(
			container.querySelector('[data-slot="controller-list-row"]')?.querySelector('button'),
		).toBeNull()

		fireEvent.click(screen.getByRole('button', { name: '검수 시나리오 선택' }))
		fireEvent.click(screen.getByRole('radio', { name: '레이아웃 검수' }))

		expect(onScenarioChange).toHaveBeenCalledWith('layout-review')
		expect(screen.queryByRole('radio', { name: '레이아웃 검수' })).not.toBeInTheDocument()
	})

	it('현재 시나리오는 행의 보조 줄과 셀렉트에서 같은 것을 가리킨다', () => {
		render(
			<ReviewCard
				image={checkImage({ scenarioKey: 'layout-review' })}
				scenarios={scenarios}
				selected={false}
				onOpen={vi.fn()}
				onScenarioChange={vi.fn()}
			/>,
		)

		expect(screen.getByText('레이아웃 검수')).toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: '검수 시나리오 선택' }))
		expect(screen.getByRole('radio', { name: '레이아웃 검수' })).toBeChecked()
		expect(screen.getByRole('radio', { name: '로고 사용 검수' })).not.toBeChecked()
	})

	it('판정이 나온 행은 셀렉트 대신 종합 판정만 싣는다', () => {
		const { container } = render(
			<ReviewCard
				image={checkImage({ results: { 'color.palette': failResult() } })}
				scenarios={scenarios}
				selected={false}
				onOpen={vi.fn()}
				onScenarioChange={vi.fn()}
			/>,
		)

		expect(screen.queryByRole('button', { name: '검수 시나리오 선택' })).not.toBeInTheDocument()
		expect(screen.getByText('미통과')).toBeInTheDocument()
		// 행 자체가 버튼이므로 그 안에 또 다른 버튼이 생기면 안 된다 — 판정은 표시 전용이다.
		expect(
			container
				.querySelector('[data-slot="controller-list-row"]')
				?.querySelectorAll('button'),
		).toHaveLength(0)
	})

	it('고를 시나리오가 하나뿐이면 셀렉트를 잠근다', () => {
		render(
			<ReviewCard
				image={checkImage({})}
				scenarios={[scenarios[0]]}
				selected={false}
				onOpen={vi.fn()}
				onScenarioChange={vi.fn()}
			/>,
		)

		expect(screen.getByRole('button', { name: '검수 시나리오 선택' })).toBeDisabled()
	})

	it('행을 누르면 파일을 연다 — 셀렉트를 누른 것과 섞이지 않는다', () => {
		const onOpen = vi.fn()
		render(
			<ReviewCard
				image={checkImage({})}
				scenarios={scenarios}
				selected={false}
				onOpen={onOpen}
				onScenarioChange={vi.fn()}
			/>,
		)

		fireEvent.click(screen.getByText('test.png'))
		expect(onOpen).toHaveBeenCalledOnce()

		fireEvent.click(screen.getByRole('button', { name: '검수 시나리오 선택' }))
		expect(onOpen).toHaveBeenCalledOnce()
	})
})

const scenarios = [
	{ key: 'logo-usage', title: '로고 사용 검수', checkKeys: ['color.palette'] },
	{ key: 'layout-review', title: '레이아웃 검수', checkKeys: ['color.palette'] },
]

function checkImage(patch: Partial<CheckImage>): CheckImage {
	return {
		id: 'image-1',
		url: 'blob:test',
		name: 'test.png',
		file: {} as File,
		scenarioKey: 'logo-usage',
		status: 'idle',
		...patch,
	}
}

function failResult(): CheckResult {
	return {
		rule: { key: 'color.palette', title: 'color.palette', executor: 'deterministic' },
		checker: { key: 'color.palette', type: 'algorithm' },
		rawResult: { status: 'fail', fulfillment: null },
	}
}
