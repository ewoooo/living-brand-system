import { describe, expect, it } from 'vitest'
import { resolveGraphicStudioOutput } from '@/features/graphic-generation/domain/graphic-studio-manifest'
import forwardStraightRuntimeManifest from '@/features/graphic-generation/graphic-runtimes/forward-straight/definition'
import { CAMERA_AZIMUTHS, CAMERA_ELEVATIONS } from '@/features/image-generation/camera-control'
import type { ImageStudioConfig } from '@/features/image-generation/domain/image-studio-config'
import {
	deriveTemplateStudioConfig,
	findTemplateControl,
	getTemplateRuntimeManifest,
	isBackgroundSlot,
	isImageSlot,
	isTextSlot,
	listCompatibleTemplateImageConfigs,
	type PublishedHtmlTemplate,
	parseTemplateStudioConfig,
	resolveTemplateImageConfig,
} from './template-studio-config'

const template: PublishedHtmlTemplate = {
	kind: 'html',
	id: 7,
	name: '포스터',
	html: [
		'<div>',
		'<p data-node-id="1:1" data-figma-type="TEXT" data-name="Title">기본 제목</p>',
		'<div data-node-id="2:1" data-figma-type="FRAME" data-name="Hero" data-image-carrier="" style="width:400px;height:300px"></div>',
		'</div>',
	].join(''),
	nodeConfigs: {
		'1:1': { input: { label: '제목', maxLength: 20, maxLines: 1 } },
		'2:1': { imageInput: { profileId: 3 }, imageColorize: { line: '#112233' } },
	},
	width: 800,
	height: 600,
	templateVersion: '2026-08-01T00:00:00.000Z',
}

const imageConfig = createImageConfig(3, ['1:1', '4:3'])
const forwardStraightConfig = {
	...forwardStraightRuntimeManifest,
	output: resolveGraphicStudioOutput(forwardStraightRuntimeManifest),
}

describe('deriveTemplateStudioConfig', () => {
	it('Runtime Manifest는 같은 Template 문서에서 같은 controller와 Artifact를 파생한다', () => {
		const manifest = getTemplateRuntimeManifest(template)

		expect(getTemplateRuntimeManifest(template)).toEqual(manifest)
		expect(manifest).toMatchObject({
			artifacts: { raster: {} },
			controller: {
				groups: [
					{ id: 'text', title: 'Text' },
					{ id: 'background', title: 'Background' },
				],
			},
		})
		expect(getTemplateRuntimeManifest({ ...template })).toEqual(manifest)
	})

	it('Template 도메인 계약을 멱등 검증하고 slot의 알 수 없는 필드를 거부한다', () => {
		const config = deriveTemplateStudioConfig(template, [imageConfig], [forwardStraightConfig])
		expect(parseTemplateStudioConfig(parseTemplateStudioConfig(config))).toBe(config)
		expect(() =>
			parseTemplateStudioConfig({
				...config,
				template: {
					...config.template,
					slots: config.template.slots.map((slot, index) =>
						index === 0 ? { ...slot, unknown: true } : slot,
					),
				},
			}),
		).toThrow('알 수 없는')
		const imageSlot = config.template.slots.find(isImageSlot)
		expect(imageSlot).toBeDefined()
		if (!imageSlot) return
		expect(() =>
			parseTemplateStudioConfig({
				...config,
				template: {
					...config.template,
					slots: config.template.slots.map((slot) =>
						slot.id === imageSlot.id
							? {
									...slot,
									featureOverrides: {
										colorAdjustment: { line: '#112233', unknown: true },
									},
								}
							: slot,
					),
				},
			}),
		).toThrow('알 수 없는')
	})

	it('Effective output은 Template Artifact와 실제 Exporter capability를 벗어날 수 없다', () => {
		const config = deriveTemplateStudioConfig(template, [imageConfig], [forwardStraightConfig])
		const withCommonFormat = {
			...config,
			output: { ...config.output, formats: ['svg'] as const },
		}
		expect(() => parseTemplateStudioConfig(withCommonFormat)).toThrow(
			'지원하지 않는 output format',
		)
	})

	it('공통 envelope에는 전역 Definition, Template 확장에는 DOM·슬롯 binding을 둔다', () => {
		const config = deriveTemplateStudioConfig(template, [imageConfig], [forwardStraightConfig])

		expect(config).toMatchObject({ studio: 'template', id: 7, version: 1, name: '포스터' })
		const text = config.template.slots.filter(isTextSlot)
		expect(text).toHaveLength(1)
		expect(text[0]).toMatchObject({
			id: '1:1',
			label: '제목',
			controlId: 'text:1:1',
			input: { format: 'free', maxLines: 1 },
		})
		expect(config.controller.groups[0]?.controls[0]).toMatchObject({
			id: 'text:1:1',
			kind: 'text',
			defaultValue: '기본 제목',
			maxLength: 20,
		})

		const image = config.template.slots.filter(isImageSlot)
		expect(image).toHaveLength(1)
		expect(image[0]).toMatchObject({
			kind: 'image',
			box: { width: 400, height: 300 },
			imageConfig: { mode: 'pinned', configId: 3 },
			featureOverrides: { colorAdjustment: { line: '#112233' } },
			transform: { enabled: true },
		})
		expect(image[0]?.transform.limits.scale).toEqual({ min: 0.2, max: 5 })
		expect(config.template.imageConfigs).toEqual([imageConfig])
		expect(config.template.graphicConfigs).toEqual([forwardStraightConfig])
		expect(config.template.slots.filter(isBackgroundSlot)).toHaveLength(1)
		expect(config.template.textColorControlId).toBe('text.color')
		expect(findTemplateControl(config, 'background.color')).toMatchObject({
			kind: 'color',
			defaultValue: null,
		})
	})

	it('output은 Raster Exporter capability를 따르고 canvas만 Template 도메인 정보로 남긴다', () => {
		expect(deriveTemplateStudioConfig(template)).toMatchObject({
			output: { formats: ['png', 'jpeg', 'tiff', 'pdf', 'mp4'] },
			template: {
				exportOption: {
					canvas: { width: 800, height: 600 },
				},
			},
		})
		expect(
			deriveTemplateStudioConfig({
				...template,
				exportPolicy: { allowedFormats: ['pdf'] },
			}).output.formats,
		).toEqual(['pdf'])
		expect(() =>
			deriveTemplateStudioConfig({
				...template,
				exportPolicy: { allowedFormats: ['svg'] },
			}),
		).toThrow('지원하지 않는 output format')
	})

	it('동적 published Template에서 만든 envelope도 공통 strict validator를 통과해야 한다', () => {
		expect(() =>
			deriveTemplateStudioConfig({
				...template,
				nodeConfigs: {
					...template.nodeConfigs,
					'1:1': { input: { label: '제목', maxLength: 2, maxLines: 1 } },
				},
			}),
		).toThrow('maxLength')
	})

	it('Restrictions와 Admin 그룹 표현을 분리해 Effective Config에 적용한다', () => {
		const config = deriveTemplateStudioConfig({
			...template,
			controllerPresentation: {
				groups: [{ groupId: 'text', defaultOpen: false }],
			},
			controllerRestrictions: {
				controls: [
					{
						controlId: 'text:1:1',
						availability: 'readonly',
						defaultValue: '고정 제목',
						maxLength: 10,
					},
					{
						controlId: 'text.color',
						availability: 'readonly',
						defaultValue: '#112233',
					},
					{
						controlId: 'background.type',
						availability: 'readonly',
						defaultValue: 'color',
						optionValues: ['color'],
					},
					{
						controlId: 'background.color',
						availability: 'disabled',
						defaultValue: '#ffffff',
					},
				],
			},
		})

		expect(config.controller.groups[0]).toMatchObject({
			title: 'Text',
		})
		expect(config.controllerPresentation?.groups[0]).toEqual({
			groupId: 'text',
			collapsible: true,
			defaultOpen: false,
		})
		expect(config.controller.groups[0]?.controls[0]).toMatchObject({
			availability: 'readonly',
			defaultValue: '고정 제목',
			maxLength: 10,
		})
		expect(config.controller.groups[1]?.controls[0]).toMatchObject({
			availability: 'readonly',
			options: [{ value: 'color', label: 'Color' }],
		})
		expect(findTemplateControl(config, 'text.color')).toMatchObject({
			availability: 'readonly',
			defaultValue: '#112233',
		})
		expect(findTemplateControl(config, 'background.color')).toMatchObject({
			availability: 'disabled',
			defaultValue: '#ffffff',
		})
	})

	it('sparse Restrictions는 쓰지 않은 Definition 필드를 Runtime Manifest에서 상속한다', () => {
		const config = deriveTemplateStudioConfig({
			...template,
			controllerRestrictions: {
				controls: [
					{
						controlId: 'text:1:1',
						availability: 'readonly',
						maxLength: 10,
					},
				],
			},
		})

		expect(findTemplateControl(config, 'text:1:1')).toMatchObject({
			label: '제목',
			defaultValue: '기본 제목',
			availability: 'readonly',
			maxLength: 10,
		})
	})
})

describe('resolveTemplateImageConfig', () => {
	it('nearest는 선택된 Config의 ratio options 안에서만 고르고 한 값 readonly로 좁힌다', () => {
		const resolved = resolveTemplateImageConfig(imageConfig, { width: 1600, height: 900 })

		expect(resolved?.ratio).toMatchObject({
			availability: 'readonly',
			defaultValue: '4:3',
			options: [{ value: '4:3', label: '4:3' }],
		})
		expect(resolved?.imageSize).toBe('2K')
	})

	it('batch 고정 계약은 options가 아니라 default가 1일 때만 Template 1장 생성과 호환된다', () => {
		const readonlyTwo = replaceSelectControl(imageConfig, 'batch', {
			availability: 'readonly',
			defaultValue: '2',
		})
		const readonlyOne = replaceSelectControl(readonlyTwo, 'batch', { defaultValue: '1' })

		expect(resolveTemplateImageConfig(readonlyTwo, { width: 400, height: 300 })).toBeNull()
		expect(resolveTemplateImageConfig(readonlyOne, { width: 400, height: 300 })).not.toBeNull()
	})

	it('ratio 고정 계약은 슬롯 nearest로 덮지 않고 Admin default 한 값만 사용한다', () => {
		const fixed = replaceSelectControl(createImageConfig(3, ['1:1', '16:9']), 'ratio', {
			availability: 'disabled',
			defaultValue: '1:1',
		})

		expect(
			resolveTemplateImageConfig(fixed, { width: 1600, height: 900 })?.ratio,
		).toMatchObject({
			availability: 'readonly',
			defaultValue: '1:1',
			options: [{ value: '1:1', label: '1:1' }],
		})
	})

	it('pinned Config가 없거나 Template 1장 생성을 지원하지 않으면 호환 목록에서 제외한다', () => {
		const config = deriveTemplateStudioConfig(template, [imageConfig])
		const slot = config.template.slots.find(isImageSlot)
		expect(slot).toBeDefined()
		if (!slot) return

		expect(listCompatibleTemplateImageConfigs(slot, [])).toEqual([])
		const incompatible = createImageConfig(3, ['4:3'], ['2', '4'])
		expect(listCompatibleTemplateImageConfigs(slot, [incompatible])).toEqual([])
	})

	it('selectable은 허용 목록과 Template 생성 제약을 모두 통과한 Config만 노출한다', () => {
		const config = deriveTemplateStudioConfig({
			...template,
			nodeConfigs: {
				...template.nodeConfigs,
				'2:1': { imageInput: {} },
			},
		})
		const source = config.template.slots.find(isImageSlot)
		expect(source).toBeDefined()
		if (!source) return
		const slot = {
			...source,
			imageConfig: { mode: 'selectable' as const, allowedConfigIds: [4] },
		}

		expect(
			listCompatibleTemplateImageConfigs(slot, [
				imageConfig,
				createImageConfig(4, ['4:3']),
			]).map(({ config: candidate }) => candidate.id),
		).toEqual([4])
	})
})

function createImageConfig(
	id: number,
	ratios: readonly string[],
	batch = ['1', '2', '4'],
): ImageStudioConfig {
	return {
		studio: 'image',
		artifacts: { raster: {}, original: {} },
		id,
		version: 1,
		name: `프로파일 ${id}`,
		output: { formats: ['png'], original: true },
		controller: {
			groups: [
				{
					id: 'image',
					title: 'Image',
					controls: [
						{
							id: 'prompt',
							kind: 'text',
							label: 'Prompt',
							defaultValue: '',
							multiline: true,
							maxLength: 250,
						},
					],
				},
				{
					id: 'profile-settings',
					title: 'Profile Settings',
					controls: [
						{
							id: 'lineColor',
							kind: 'color',
							label: 'Line Color',
							defaultValue: '#000000',
						},
					],
				},
				{
					id: 'generation-settings',
					title: 'Setting',
					controls: [
						{
							id: 'batch',
							kind: 'select',
							label: '장수',
							defaultValue: batch[0] ?? null,
							options: batch.map((value) => ({ value, label: value })),
						},
						{
							id: 'ratio',
							kind: 'select',
							label: '비율',
							defaultValue: ratios[0] ?? null,
							options: ratios.map((value) => ({ value, label: value })),
						},
						{
							id: 'resolution',
							kind: 'select',
							label: '해상도',
							defaultValue: '2K',
							options: [{ value: '2K', label: '2K' }],
						},
					],
				},
			],
		},
		image: {
			slug: `profile-${id}`,
			features: [
				{ type: 'color-adjustment', controls: { line: 'lineColor' } },
				{
					type: 'camera-control',
					azimuths: CAMERA_AZIMUTHS,
					elevations: CAMERA_ELEVATIONS,
				},
			],
		},
	}
}

function replaceSelectControl(
	config: ImageStudioConfig,
	id: string,
	patch: { availability?: 'enabled' | 'readonly' | 'disabled'; defaultValue?: string },
): ImageStudioConfig {
	return {
		...config,
		controller: {
			groups: config.controller.groups.map((group) => ({
				...group,
				controls: group.controls.map((control) =>
					control.id === id && control.kind === 'select'
						? { ...control, ...patch }
						: control,
				),
			})),
		},
	}
}
