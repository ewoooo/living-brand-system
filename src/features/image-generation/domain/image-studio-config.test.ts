import { describe, expect, it } from 'vitest'
import { getImageRuntimeManifest } from './image-runtime-manifest'
import {
	deriveImageStudioConfig,
	getImageColorAdjustmentControls,
	getImageStudioControls,
	getImageStudioFeature,
	getImageStudioFeatureControlIds,
	IMAGE_STUDIO_CONTROL_IDS,
	type PublishedImageProfileDefinition,
	parseImageStudioConfig,
	projectImageProfileFeatureSelections,
} from './image-studio-config'

const profile: PublishedImageProfileDefinition = {
	id: 5,
	name: '브랜드 제품컷',
	slug: 'brand-product',
	imageModelPreset: 'openai-gpt-image-2',
}

describe('deriveImageStudioConfig', () => {
	it('Generation Model Capability에서 결정적 Runtime Manifest를 발행한다', () => {
		const first = getImageRuntimeManifest(profile.imageModelPreset)
		const second = getImageRuntimeManifest(profile.imageModelPreset)

		expect(second).toEqual(first)
		expect(first).toMatchObject({
			artifacts: { raster: {}, original: {} },
			supportedFeatures: [
				{
					type: 'color-adjustment',
					controls: { line: 'lineColor', background: 'backgroundColor' },
				},
				{ type: 'camera-control' },
			],
		})
		expect(first.controller.groups.flatMap((group) => group.controls)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'lineColor', kind: 'color' }),
				expect.objectContaining({ id: 'backgroundColor', kind: 'color' }),
			]),
		)
	})

	it('Runtime Manifest를 feature 선택과 Admin Restrictions로 좁힌다', () => {
		const config = deriveImageStudioConfig(profile)
		const controls = getImageStudioControls(config)

		expect(parseImageStudioConfig(parseImageStudioConfig(config))).toBe(config)
		expect(() =>
			parseImageStudioConfig({ ...config, output: { ...config.output, formats: ['svg'] } }),
		).toThrow('지원하지 않는 output format')
		expect(config).toMatchObject({
			studio: 'image',
			id: 5,
			version: 1,
			name: '브랜드 제품컷',
			output: { formats: ['png', 'jpeg', 'tiff', 'pdf', 'mp4'], original: true },
			image: { slug: 'brand-product', features: [] },
		})
		expect(controls.prompt).toMatchObject({ id: 'prompt', kind: 'text', maxLength: 500 })
		expect(controls.batch).toMatchObject({
			defaultValue: '4',
			options: [{ value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }],
		})
		expect(controls.ratio.defaultValue).toBe('2:3')
		expect(controls.resolution.defaultValue).toBe('1K')
		expect(config.controller.groups.flatMap((group) => group.controls)).not.toEqual(
			expect.arrayContaining([expect.objectContaining({ id: 'lineColor' })]),
		)
	})

	it('Admin Restrictions는 Manifest 기본값·선택지·상한을 좁힌다', () => {
		const controls = getImageStudioControls(
			deriveImageStudioConfig({
				...profile,
				controllerRestrictions: {
					controls: [
						{ controlId: 'prompt', maxLength: 120 },
						{ controlId: 'ratio', optionValues: ['1:1', '2:3'], defaultValue: '1:1' },
						{ controlId: 'resolution', availability: 'readonly' },
					],
				},
			}),
		)

		expect(controls.prompt.maxLength).toBe(120)
		expect(controls.ratio).toMatchObject({
			defaultValue: '1:1',
			options: [{ value: '1:1' }, { value: '2:3' }],
		})
		expect(controls.resolution.availability).toBe('readonly')
	})

	it('Admin Restrictions가 알 수 없는 ID·선택지·프롬프트 상한을 확장하면 거부한다', () => {
		expect(() =>
			deriveImageStudioConfig({
				...profile,
				controllerRestrictions: { controls: [{ controlId: 'unknown' }] },
			}),
		).toThrow('Controller restriction control을 찾을 수 없습니다: unknown')
		expect(() =>
			deriveImageStudioConfig({
				...profile,
				controllerRestrictions: {
					controls: [{ controlId: 'ratio', optionValues: ['99:1'] }],
				},
			}),
		).toThrow('Controller restriction options가 기본 계약을 확장합니다: ratio')
		expect(() =>
			deriveImageStudioConfig({
				...profile,
				controllerRestrictions: {
					controls: [{ controlId: 'prompt', maxLength: 501 }],
				},
			}),
		).toThrow('Controller restriction maxLength가 기본 계약을 확장합니다: prompt')
	})

	it('feature 선택이 stable semantic ID의 control과 descriptor를 같이 파생한다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			features: [
				{
					id: 'feature-color',
					blockName: '색 조정',
					blockType: 'colorAdjustment',
					background: true,
				},
				{ id: 'feature-camera', blockName: '카메라 조정', blockType: 'cameraControl' },
			],
			controllerRestrictions: {
				controls: [
					{ controlId: 'lineColor', defaultValue: '#112233' },
					{ controlId: 'backgroundColor', defaultValue: '#ffffff' },
				],
			},
		})

		expect(getImageStudioFeature(config, 'camera-control')).toBeDefined()
		expect(getImageColorAdjustmentControls(config)).toMatchObject({
			line: { id: IMAGE_STUDIO_CONTROL_IDS.lineColor, defaultValue: '#112233' },
			background: {
				id: IMAGE_STUDIO_CONTROL_IDS.backgroundColor,
				defaultValue: '#ffffff',
			},
		})
		expect(getImageStudioFeatureControlIds(config)).toEqual(['lineColor', 'backgroundColor'])
	})

	it('선택하지 않은 feature control에 제한을 걸면 fail-closed한다', () => {
		expect(() =>
			deriveImageStudioConfig({
				...profile,
				controllerRestrictions: {
					controls: [{ controlId: 'lineColor', defaultValue: '#112233' }],
				},
			}),
		).toThrow('Controller restriction control을 찾을 수 없습니다: lineColor')
		expect(() =>
			deriveImageStudioConfig({
				...profile,
				features: [{ blockType: 'colorAdjustment', line: 'legacyLine' }],
			}),
		).toThrow('Image feature에 알 수 없는 필드가 있습니다: line')
		expect(() =>
			deriveImageStudioConfig({
				...profile,
				features: [{ blockType: 'cameraControl' }, { blockType: 'cameraControl' }],
			}),
		).toThrow('Image feature type이 중복되었습니다: camera-control')
	})

	it('모델별 resolution capability와 output 교집을 유지한다', () => {
		const config = deriveImageStudioConfig({
			...profile,
			imageModelPreset: 'google-nano-banana-2-lite',
			exportPolicy: { allowedFormats: ['png'], original: false },
		})
		expect(getImageStudioControls(config).resolution.options).toEqual([
			{ label: '1K', value: '1K' },
		])
		expect(config.output).toMatchObject({ formats: ['png'], original: false })
	})

	it('descriptor의 알 수 없는 필드를 거부한다', () => {
		const config = deriveImageStudioConfig(profile)
		expect(() =>
			parseImageStudioConfig({ ...config, image: { ...config.image, unknown: true } }),
		).toThrow('알 수 없는')
	})
})

describe('projectImageProfileFeatureSelections', () => {
	// Payload가 blocks에 항상 붙이는 blockName 때문에 실제 프로필이 전부 거부되던 회귀.
	// 데이터가 빈 환경에서는 이 경로를 안 타서 드러나지 않았다.
	it('Payload 내장 blockName이 있어도 feature를 투영한다', () => {
		expect(
			projectImageProfileFeatureSelections([
				{ id: 'legacy-camera-6', blockType: 'cameraControl', blockName: null },
				{
					id: 'legacy-color-1',
					blockType: 'colorAdjustment',
					blockName: null,
					background: true,
				},
			]),
		).toEqual([{ type: 'camera-control' }, { type: 'color-adjustment', background: true }])
	})

	it('그 밖의 알 수 없는 필드는 여전히 거부한다', () => {
		expect(() =>
			projectImageProfileFeatureSelections([
				{ id: 'x', blockType: 'cameraControl', unexpected: 1 },
			]),
		).toThrow('알 수 없는 필드')
	})
})
