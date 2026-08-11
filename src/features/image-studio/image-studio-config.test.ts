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

	it('프로파일이 정의한 상한·카메라·색을 계약에 옮긴다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			maxPromptLength: 120,
			cameraControl: false,
			colorAdjustment: { line: '#112233', background: '#ffffff' },
		})

		expect(config.prompt.maxLength).toBe(120)
		expect(config.supportsCameraControl).toBe(false)
		expect(config.colorAdjustment).toEqual({ line: '#112233', background: '#ffffff' })
	})

	it('배경 색을 비우면 라인 색만 실어 색 조정을 연다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			colorAdjustment: { line: '#112233', background: null },
		})

		expect(config.colorAdjustment).toEqual({ line: '#112233' })
	})

	it('라인 색이 없으면 색 조정을 열지 않는다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			colorAdjustment: { line: null, background: '#ffffff' },
		})

		expect(config.colorAdjustment).toBeUndefined()
		expect('colorAdjustment' in config).toBe(false)
	})

	it('필드가 NULL인 기존 문서는 전역 상한·카메라 개방·색 미개방으로 파생한다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			maxPromptLength: null,
			cameraControl: null,
			colorAdjustment: null,
		})

		expect(config.prompt.maxLength).toBe(500)
		expect(config.supportsCameraControl).toBe(true)
		expect(config.colorAdjustment).toBeUndefined()
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
