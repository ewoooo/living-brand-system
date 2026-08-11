import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImageGenerationResults } from './image-generation-results'

const SRC = '/api/generated-images/file/generated.png'

function props(overrides: { color?: { line: string; background?: string } | null } = {}) {
	return {
		color: overrides.color ?? null,
		loading: false,
		onSelect: vi.fn(),
		requested: 2,
		result: {
			aspectRatio: '16:9' as const,
			imageSize: '1K' as const,
			images: [SRC, '/api/generated-images/file/generated-2.png'],
			model: 'gemini-3.1-flash-lite-image',
			profileId: 5,
			profileName: 'Technical Illustration',
			prompt: '{"subject":"유조선"}',
		},
		selected: null,
	}
}

describe('ImageGenerationResults', () => {
	afterEach(cleanup)

	// 선택은 컨트롤러(카메라 섹션·저장 CTA)를 여는 입력이라 캔버스는 올려보내기만 한다.
	it('결과 카드 클릭을 선택으로 올리고 선택된 번호를 알린다', () => {
		const base = props()
		const view = render(createElement(ImageGenerationResults, base))

		fireEvent.click(screen.getByRole('button', { name: '생성 결과 1' }))
		expect(base.onSelect).toHaveBeenCalledWith(0)

		view.rerender(createElement(ImageGenerationResults, { ...base, selected: 0 }))
		expect(screen.getByText('1번 선택됨')).toBeInTheDocument()
	})

	it('색이 없으면 오버레이 없이 원본만 보인다', () => {
		const view = render(createElement(ImageGenerationResults, props()))

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
})
