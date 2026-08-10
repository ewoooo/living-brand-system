import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageGenerator } from './image-generator'

const mocks = vi.hoisted(() => ({ generate: vi.fn() }))

vi.mock('@/features/generate-image/hooks/use-image-generation', () => ({
	useImageGeneration: () => ({
		error: null,
		generate: mocks.generate,
		loading: false,
		requested: 0,
		result: null,
		selected: null,
		setSelected: vi.fn(),
	}),
}))
vi.mock('@/components/studio/generate/image-generation-results', () => ({
	ImageGenerationResults: () => null,
}))

describe('ImageGenerator', () => {
	beforeEach(() => vi.clearAllMocks())
	afterEach(cleanup)

	it('첫 published 프로파일을 선택해 profileId로 생성한다', () => {
		render(
			createElement(ImageGenerator, {
				profiles: [{ id: 5, name: '에센허브 브랜드 제품컷' }],
			}),
		)

		fireEvent.change(screen.getByRole('textbox', { name: '프롬프트' }), {
			target: { value: '파란 세럼병' },
		})
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.generate).toHaveBeenCalledWith({
			count: 2,
			prompt: '파란 세럼병',
			profileId: 5,
		})
	})

	it('라우트가 지정한 프로파일을 처음 선택한다', () => {
		render(
			createElement(ImageGenerator, {
				profiles: [
					{ id: 5, name: '일러스트레이션' },
					{ id: 7, name: '그라디언트' },
				],
				initialProfileId: 7,
			}),
		)

		expect(screen.getByRole('combobox', { name: '프로파일' })).toHaveTextContent('그라디언트')
	})

	it('빈 캔버스의 예시를 프롬프트에 반영한다', () => {
		render(createElement(ImageGenerator, { profiles: [] }))

		fireEvent.click(
			screen.getByRole('button', {
				name: '신제품을 위한 깨끗한 스튜디오 제품 이미지',
			}),
		)

		expect(screen.getByRole('textbox', { name: '프롬프트' })).toHaveValue(
			'신제품을 위한 깨끗한 스튜디오 제품 이미지',
		)
		expect(screen.getByRole('button', { name: '이미지 생성' })).toBeDisabled()
		expect(screen.queryByText('자유 생성 (브랜드 스타일 없음)')).not.toBeInTheDocument()
	})
})
