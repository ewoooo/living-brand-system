import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
			images: ['/api/generated-images/file/adjusted.png'],
			model: 'gemini-3.1-flash-lite-image',
			profileId: 5,
			profileName: 'Technical Illustration',
			prompt: '{"camera":"front-right three-quarter view"}',
		})
	})
	afterEach(cleanup)

	it('고정 프리셋을 각도로 변환해 생성 이미지 ID로 조정을 요청한다', async () => {
		const user = userEvent.setup()
		render(
			createElement(ImageCameraPresets, {
				basePrompt: '{"subject":"유조선"}',
				generatedImageId: 8,
				profileId: 5,
				seedImage: '/api/generated-images/file/generated.png',
			}),
		)

		const azimuth = screen.getByRole('combobox', { name: '방향' })
		azimuth.focus()
		await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
		const elevation = screen.getByRole('combobox', { name: '높이' })
		elevation.focus()
		await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
		fireEvent.click(screen.getByRole('button', { name: '시점 적용' }))

		expect(mocks.requestCameraAdjustment).toHaveBeenCalledWith({
			basePrompt: '{"subject":"유조선"}',
			camera: { azimuthDeg: 45, elevationDeg: 20 },
			count: 1,
			generatedImageId: 8,
			profileId: 5,
		})
		expect(await screen.findByAltText('카메라 시점 조정 결과')).toHaveAttribute(
			'src',
			'/api/generated-images/file/adjusted.png',
		)
		expect(screen.getByText('조정 결과: 우측 3/4 · 약간 위')).toBeInTheDocument()
	})
})
