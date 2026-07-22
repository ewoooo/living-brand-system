import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageGenerator } from './image-generator'

const mocks = vi.hoisted(() => ({ generate: vi.fn() }))

vi.mock('@/features/image-generation/hooks/use-image-generation', () => ({
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
vi.mock('@/features/image-generation/components/image-generation-results', () => ({
	ImageGenerationResults: () => null,
}))

describe('ImageGenerator', () => {
	beforeEach(() => vi.clearAllMocks())

	it('첫 published 프로파일을 선택해 profileId로 생성한다', () => {
		render(<ImageGenerator profiles={[{ id: 5, name: '에센허브 브랜드 제품컷' }]} />)

		fireEvent.change(screen.getByLabelText('만들 이미지 설명'), {
			target: { value: '파란 세럼병' },
		})
		fireEvent.click(screen.getByRole('button', { name: '생성' }))

		expect(mocks.generate).toHaveBeenCalledWith({
			count: 2,
			prompt: '파란 세럼병',
			profileId: 5,
		})
	})
})
