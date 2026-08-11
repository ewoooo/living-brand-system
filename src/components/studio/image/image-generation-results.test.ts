import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImageGenerationResults } from './image-generation-results'

describe('ImageGenerationResults', () => {
	afterEach(cleanup)

	// 선택은 컨트롤러(카메라 섹션·저장 CTA)를 여는 입력이라 캔버스는 올려보내기만 한다.
	it('결과 카드 클릭을 선택으로 올리고 선택된 번호를 알린다', () => {
		const onSelect = vi.fn()
		const props = {
			loading: false,
			onSelect,
			requested: 1,
			result: {
				aspectRatio: '16:9' as const,
				imageSize: '1K' as const,
				images: ['/api/generated-images/file/generated.png'],
				model: 'gemini-3.1-flash-lite-image',
				profileId: 5,
				profileName: 'Technical Illustration',
				prompt: '{"subject":"유조선"}',
			},
			selected: null,
		}
		const view = render(createElement(ImageGenerationResults, props))

		fireEvent.click(screen.getByRole('button', { name: '생성 결과 1' }))
		expect(onSelect).toHaveBeenCalledWith(0)

		view.rerender(createElement(ImageGenerationResults, { ...props, selected: 0 }))
		expect(screen.getByText('1번 선택됨')).toBeInTheDocument()
	})
})
