import { describe, expect, it } from 'vitest'
import { IMAGE_ASPECT_RATIOS, IMAGE_OUTPUT_SIZES, toOpenAIImageSize } from './image-size'

describe('toOpenAIImageSize', () => {
	it('모든 출력 계약을 gpt-image-2 크기 제약 안으로 변환한다', () => {
		for (const aspectRatio of IMAGE_ASPECT_RATIOS) {
			for (const imageSize of IMAGE_OUTPUT_SIZES) {
				const [width, height] = toOpenAIImageSize(aspectRatio, imageSize)
					.split('x')
					.map(Number)

				expect(width % 16).toBe(0)
				expect(height % 16).toBe(0)
				expect(Math.max(width, height)).toBeLessThanOrEqual(3840)
				expect(width * height).toBeGreaterThanOrEqual(655_360)
				expect(width * height).toBeLessThanOrEqual(8_294_400)
				expect(Math.max(width, height) / Math.min(width, height)).toBeLessThanOrEqual(3)
			}
		}
	})

	it('16:9 4K를 OpenAI의 대표 4K 크기로 유지한다', () => {
		expect(toOpenAIImageSize('16:9', '4K')).toBe('3840x2160')
	})
})
