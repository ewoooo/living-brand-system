import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageCameraPresets } from './image-camera-presets'

const mocks = vi.hoisted(() => ({
	requestCameraAdjustment: vi.fn(),
}))

vi.mock('@/features/generate-image/services/generate-image.client', () => ({
	requestCameraAdjustment: mocks.requestCameraAdjustment,
}))

describe('ImageCameraPresets', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.requestCameraAdjustment.mockResolvedValue({
			camera: {
				input: { azimuthDeg: 45, elevationDeg: 20 },
				resolved: { azimuth: 'front-right', elevation: 'elevated' },
			},
			images: ['data:image/png;base64,adjusted'],
			model: 'gemini-3.1-flash-lite-image',
			profileId: 5,
			profileName: 'Technical Illustration',
			prompt: '{"camera":"front-right three-quarter view"}',
		})
	})
	afterEach(cleanup)

	it('고정 프리셋을 각도로 변환해 선택한 이미지를 시드로 전달한다', async () => {
		render(
			createElement(ImageCameraPresets, {
				basePrompt: '{"subject":"유조선"}',
				profileId: 5,
				seedImage: 'data:image/png;base64,seed',
			}),
		)

		fireEvent.change(screen.getByLabelText('방향'), {
			target: { value: 'front-right' },
		})
		fireEvent.change(screen.getByLabelText('높이'), {
			target: { value: 'elevated' },
		})
		fireEvent.click(screen.getByRole('button', { name: '시점 적용' }))

		expect(mocks.requestCameraAdjustment).toHaveBeenCalledWith({
			basePrompt: '{"subject":"유조선"}',
			camera: { azimuthDeg: 45, elevationDeg: 20 },
			count: 1,
			profileId: 5,
			seedImage: 'data:image/png;base64,seed',
		})
		expect(await screen.findByAltText('카메라 시점 조정 결과')).toHaveAttribute(
			'src',
			'data:image/png;base64,adjusted',
		)
		expect(screen.getByText('조정 결과: 우측 3/4 · 약간 위')).toBeInTheDocument()
	})
})
