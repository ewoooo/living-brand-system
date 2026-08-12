import { describe, expect, it } from 'vitest'
import type { PublishedImageProfileDefinition } from '@/features/generate-image/repositories/image-profile.payload.repository'
import {
	deriveImageStudioConfig,
	getImageColorAdjustmentControls,
	getImageStudioControls,
	getImageStudioFeature,
	getImageStudioFeatureControlIds,
	IMAGE_STUDIO_CONTROL_IDS,
} from './image-studio-config'

const profile: PublishedImageProfileDefinition = {
	id: 5,
	name: '에센허브 브랜드 제품컷',
	slug: 'brand-product',
	imageModelPreset: 'openai-gpt-image-2',
	aspectRatio: '2:3',
	imageSize: '2K',
}

describe('deriveImageStudioConfig', () => {
	it('legacy 프로파일을 공통 envelope와 stable control ID로 투영한다', () => {
		const config = deriveImageStudioConfig(profile)
		const controls = getImageStudioControls(config)

		expect(config).toMatchObject({
			studio: 'image',
			id: 5,
			version: 1,
			name: '에센허브 브랜드 제품컷',
			output: { formats: ['png'], original: true },
			image: { slug: 'brand-product', features: [{ type: 'camera-control' }] },
		})
		expect(config).not.toHaveProperty('imageModelPreset')
		expect(config).not.toHaveProperty('profilePrompt')
		expect(config).not.toHaveProperty('userPromptNormalization')
		expect(controls.prompt).toMatchObject({ id: 'prompt', kind: 'text', maxLength: 500 })
		expect(controls.batch).toMatchObject({
			id: 'batch',
			defaultValue: '4',
			options: [{ value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }],
		})
		expect(controls.ratio.defaultValue).toBe('2:3')
		expect(controls.resolution).toMatchObject({
			defaultValue: '2K',
			options: [{ value: '1K' }, { value: '2K' }, { value: '4K' }],
		})
	})

	it('저장된 output 정책은 원본 다운로드를 끄지만 Runtime 형식을 확장하지 않는다', () => {
		expect(
			deriveImageStudioConfig({
				...profile,
				output: { formats: ['png'], original: false },
			}).output,
		).toEqual({ formats: ['png'], original: false })
	})

	it('legacy 상한·카메라·색을 Definition과 descriptor에 옮긴다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			maxPromptLength: 120,
			cameraControl: false,
			colorAdjustment: { line: '#112233', background: '#ffffff' },
		})
		const controls = getImageStudioControls(config)
		const colors = getImageColorAdjustmentControls(config)

		expect(controls.prompt.maxLength).toBe(120)
		expect(getImageStudioFeature(config, 'camera-control')).toBeUndefined()
		expect(colors?.line.defaultValue).toBe('#112233')
		expect(colors?.background?.defaultValue).toBe('#ffffff')
	})

	it('라인 색이 없으면 색 control을 만들지 않는다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			colorAdjustment: { line: null, background: '#ffffff' },
		})

		expect(getImageStudioFeature(config, 'color-adjustment')).toBeUndefined()
		expect(getImageColorAdjustmentControls(config)).toBeNull()
	})

	it('1K만 지원하는 모델은 resolution 선택지를 서버 capability와 교집합한다', () => {
		const controls = getImageStudioControls(
			deriveImageStudioConfig({
				...profile,
				imageModelPreset: 'google-nano-banana-2-lite',
				imageSize: '1K',
			}),
		)

		expect(controls.resolution.options).toEqual([{ label: '1K', value: '1K' }])
	})

	it('저장된 Controller를 우선하고 Payload row id를 공개 계약에서 제거한다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			controller: storedController(),
		})
		const controls = getImageStudioControls(config)

		expect(controls.prompt).toMatchObject({ maxLength: 80, availability: 'readonly' })
		expect(config.controller.groups[0]).toMatchObject({ id: 'image', title: 'Image' })
		expect(config.image.features).toEqual([])
		expect(JSON.stringify(config)).not.toContain('payload-row-id')
		expect(JSON.stringify(config)).not.toContain('blockType')
		expect(JSON.stringify(config)).not.toContain('"key"')
	})

	it('저장된 feature block을 capability와 semantic control ref로만 투영한다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			controller: storedControllerWithColor(),
			features: [
				{
					id: 'payload-row-id',
					blockType: 'colorAdjustment',
					line: 'brandLine',
					background: 'brandBackground',
				},
				{ id: 'payload-row-id', blockType: 'cameraControl' },
			],
		})

		expect(config.image.features).toEqual([
			{
				type: 'color-adjustment',
				controls: { line: 'brandLine', background: 'brandBackground' },
			},
			{ type: 'camera-control' },
		])
		expect(getImageColorAdjustmentControls(config)).toMatchObject({
			line: { id: 'brandLine', kind: 'color' },
			background: { id: 'brandBackground', kind: 'color' },
		})
		expect(getImageStudioFeatureControlIds(config)).toEqual(['brandLine', 'brandBackground'])
		expect(JSON.stringify(config.image.features)).not.toContain('payload-row-id')
		expect(JSON.stringify(config.image.features)).not.toContain('blockType')
	})

	it('canonical Controller의 빈 feature 목록은 legacy capability를 되살리지 않는다', () => {
		expect(
			deriveImageStudioConfig({
				...profile,
				controller: storedController(),
				features: [],
				cameraControl: true,
				colorAdjustment: { line: '#112233' },
			}).image.features,
		).toEqual([])

		expect(deriveImageStudioConfig({ ...profile, features: [] }).image.features).toContainEqual(
			{ type: 'camera-control' },
		)
	})

	it('중복 feature와 없거나 잘못된 color control ref를 발행 거부한다', () => {
		expect(() =>
			deriveImageStudioConfig({
				...profile,
				controller: storedController(),
				features: [{ blockType: 'cameraControl' }, { blockType: 'cameraControl' }],
			}),
		).toThrow('Image feature type이 중복되었습니다: camera-control')

		expect(() =>
			deriveImageStudioConfig({
				...profile,
				controller: storedController(),
				features: [{ blockType: 'colorAdjustment', line: 'missing' }],
			}),
		).toThrow('Image controller에 missing color control이 필요합니다.')

		expect(() =>
			deriveImageStudioConfig({
				...profile,
				controller: storedController(),
				features: [{ blockType: 'colorAdjustment', line: 'prompt' }],
			}),
		).toThrow('Image controller의 prompt control은 color이어야 합니다.')
	})
})

function storedController() {
	return {
		groups: [
			{
				id: 'payload-row-id',
				key: 'image',
				title: 'Image',
				collapsible: true,
				defaultOpen: true,
				controls: [
					{
						id: 'payload-row-id',
						blockType: 'text',
						key: IMAGE_STUDIO_CONTROL_IDS.prompt,
						label: 'Prompt',
						availability: 'readonly',
						defaultValue: '브랜드 제품',
						multiline: true,
						maxLength: 80,
					},
				],
			},
			{
				id: 'payload-row-id',
				key: 'generation-settings',
				title: 'Setting',
				collapsible: false,
				defaultOpen: true,
				controls: [
					storedSelect('batch', '장수', ['1', '2'], '2'),
					storedSelect('ratio', '비율', ['1:1', '2:3'], '2:3'),
					storedSelect('resolution', '해상도', ['1K', '2K'], '2K'),
				],
			},
		],
	}
}

function storedSelect(id: string, label: string, values: string[], defaultValue: string) {
	return {
		id: 'payload-row-id',
		blockType: 'select',
		key: id,
		label,
		availability: 'enabled',
		defaultValue,
		options: values.map((value) => ({ id: 'payload-row-id', label: value, value })),
	}
}

function storedControllerWithColor() {
	const controller = storedController()
	return {
		groups: [
			...controller.groups,
			{
				id: 'payload-row-id',
				key: 'colors',
				title: 'Colors',
				controls: [
					storedColor('brandLine', '#112233'),
					storedColor('brandBackground', '#ffffff'),
				],
			},
		],
	}
}

function storedColor(key: string, defaultValue: string) {
	return {
		id: 'payload-row-id',
		blockType: 'color',
		key,
		label: key,
		availability: 'enabled',
		defaultValue,
	}
}
