import { describe, expect, it } from 'vitest'
import type { PublishedImageProfileDefinition } from '@/features/generate-image/repositories/image-profile.payload.repository'
import { deriveImageStudioConfig } from './image-studio-config'

const profile: PublishedImageProfileDefinition = {
	id: 5,
	name: '에센허브 브랜드 제품컷',
	slug: 'brand-product',
	imageModelPreset: 'openai-gpt-image-2',
	aspectRatio: '2:3',
	imageSize: '2K',
}

describe('deriveImageStudioConfig', () => {
	it('프로파일 정의를 시작값으로, 전역 상한을 레인지로 옮긴다', () => {
		const config = deriveImageStudioConfig(profile)

		expect(config).toMatchObject({
			profileId: 5,
			version: 1,
			name: '에센허브 브랜드 제품컷',
			slug: 'brand-product',
			prompt: { maxLength: 500 },
			supportsCameraControl: true,
		})
		expect(config.generateOptions.batch).toEqual({ options: [1, 2, 3, 4], defaultValue: 4 })
		expect(config.generateOptions.ratio.defaultValue).toBe('2:3')
		expect(config.generateOptions.resolution).toEqual({
			options: ['1K', '2K', '4K'],
			defaultValue: '2K',
		})
	})

	it('해상도 레인지는 모델 능력에서 파생한다 — 1K만 지원하는 모델은 선택지가 하나다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			imageModelPreset: 'google-nano-banana-2-lite',
			imageSize: '1K',
		})

		expect(config.generateOptions.resolution.options).toEqual(['1K'])
	})
})
