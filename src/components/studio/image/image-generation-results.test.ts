import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./image-camera-presets', () => ({
	ImageCameraPresets: ({
		generatedImageId,
		profileId,
		seedImage,
	}: {
		generatedImageId: number
		profileId: number
		seedImage: string
	}) =>
		createElement(
			'div',
			{ 'data-testid': 'camera-presets' },
			`${profileId}:${generatedImageId}:${seedImage}`,
		),
}))

import { ImageGenerationResults } from './image-generation-results'

describe('ImageGenerationResults', () => {
	afterEach(cleanup)

	it('생성 이미지를 선택한 뒤에만 카메라 프리셋을 연결한다', () => {
		const onSelect = vi.fn()
		const props = {
			loading: false,
			onSelect,
			requested: 1,
			result: {
				aspectRatio: '16:9' as const,
				imageSize: '1K' as const,
				generatedImages: [
					{
						collection: 'generated-images' as const,
						createdAt: '2026-07-31T03:00:00.000Z',
						id: 8,
						url: '/api/generated-images/file/generated.png',
					},
				],
				images: ['/api/generated-images/file/generated.png'],
				model: 'gemini-3.1-flash-lite-image',
				profileId: 5,
				profileName: 'Technical Illustration',
				prompt: '{"subject":"유조선"}',
			},
			selected: null,
		}
		const view = render(createElement(ImageGenerationResults, props))

		expect(screen.queryByTestId('camera-presets')).not.toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: '생성 결과 1' }))
		expect(onSelect).toHaveBeenCalledWith(0)

		view.rerender(createElement(ImageGenerationResults, { ...props, selected: 0 }))
		expect(screen.getByTestId('camera-presets')).toHaveTextContent(
			'5:8:/api/generated-images/file/generated.png',
		)
	})
})
