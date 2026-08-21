import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImageGenerationResults } from './image-generation-results'

const SRC = '/api/generated-images/file/generated.png'

function props(overrides: { color?: { line: string; background?: string } | null } = {}) {
	return {
		aspectRatio: '16:9' as const,
		color: overrides.color ?? null,
		items: [
			{ src: SRC, generatedImageId: 1, profileId: 5 },
			{
				src: '/api/generated-images/file/generated-2.png',
				generatedImageId: 2,
				profileId: 5,
			},
		],
		loading: false,
		onSelect: vi.fn(),
		referenceIndex: null as number | null,
		requested: 2,
		selected: null as number | null,
	}
}

describe('ImageGenerationResults', () => {
	afterEach(cleanup)

	// 선택은 컨트롤러(카메라 섹션·저장 CTA)를 여는 입력이라 캔버스는 올려보내기만 한다.
	it('결과 카드 클릭을 선택으로 올린다', () => {
		const base = props()
		const view = render(createElement(ImageGenerationResults, base))

		expect(
			screen.getByText('이미지를 클릭해 선택하면 시점 조정과 저장을 할 수 있어요'),
		).toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: '생성 결과 1' }))
		expect(base.onSelect).toHaveBeenCalledWith(0)

		view.rerender(createElement(ImageGenerationResults, { ...base, selected: 0 }))
		expect(
			screen.queryByText('이미지를 클릭해 선택하면 시점 조정과 저장을 할 수 있어요'),
		).not.toBeInTheDocument()
	})

	it('색이 없으면 오버레이 없이 원본만 보인다', () => {
		const view = render(createElement(ImageGenerationResults, props()))

		expect(
			view.container.querySelector<HTMLElement>('[data-slot="image-result"]')?.style
				.aspectRatio,
		).toBe('16 / 9')
		expect(
			view.container.querySelectorAll('[data-slot="image-colorize-overlay"]'),
		).toHaveLength(0)
	})

	// 색은 고른 한 장이 아니라 결과 전부에 적용된다(디자인 SSOT 16:7836).
	it('색이 있으면 카드마다 오버레이를 얹고 각 이미지를 마스크로 쓴다', () => {
		const view = render(
			createElement(ImageGenerationResults, props({ color: { line: '#000dff' } })),
		)

		const overlays = view.container.querySelectorAll<HTMLElement>(
			'[data-slot="image-colorize-overlay"]',
		)
		expect(overlays).toHaveLength(2)
		expect(overlays[0]?.style.maskImage).toContain(`url('${SRC}')`)
		expect(overlays[0]?.style.backgroundColor).toBe('rgb(0, 13, 255)')
		// 색을 얹어도 선택 버튼은 이름을 잃지 않는다 — 원본을 visibility로 숨기면 alt까지 사라진다.
		expect(screen.getByRole('button', { name: '생성 결과 1' })).toBeInTheDocument()
	})

	// 참조도 결과와 똑같이 고를 수 있다(원본만 저장하고 싶을 수 있다) — 다른 것은 이름뿐이라
	// 그리드가 참조를 결과 번호에서 빼고 세는지가 유일한 확인거리다.
	it('참조 카드에 참조 이름을 붙이고 결과 번호에서 뺀다', () => {
		const base = { ...props(), referenceIndex: 0, selected: 1 }
		render(createElement(ImageGenerationResults, base))

		expect(screen.getByRole('button', { name: '참조 원본' })).toBeInTheDocument()
		// 참조가 0번을 차지해도 첫 결과는 '생성 결과 2'가 아니라 '생성 결과 1'이다.
		expect(screen.getByRole('button', { name: '생성 결과 1' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: '생성 결과 2' })).not.toBeInTheDocument()
	})
})
