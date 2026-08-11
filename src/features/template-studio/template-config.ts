import {
	IMAGE_ASPECT_RATIOS,
	type ImageAspectRatio,
	type ImageOutputSize,
} from '@/features/generate-image/image-size'
import type { GraphicStudioConfig } from '@/features/graphic-studio/graphic-studio-config'
import {
	getImageStudioControls,
	type ImageStudioConfig,
} from '@/features/image-studio/image-studio-config'
import type {
	ControllerControlDefinition,
	StudioControllerConfig,
} from '@/features/studio-controller/controller-definition'
import { parseStudioControllerConfig } from '@/features/studio-controller/controller-definition'
import {
	canExportTemplate,
	type TemplateExportFormat,
} from '@/features/template-export/services/export-template.client'
import {
	collectTemplateImageSlots,
	collectTemplateSlots,
} from '@/services/collect-template-slots.service'
import { IMAGE_EDIT_TRANSFORM_LIMITS } from '@/services/compose-template-html.client'
import type { PublishedHtmlTemplate } from '@/services/get-published-template.service'

const BACKGROUND_TYPE_CONTROL_ID = 'background.type'

type TemplateSlotBindingBase = {
	/** DOM 합성 주소. Label과 분리되어 Admin에서 이름을 바꿔도 binding은 유지된다. */
	id: string
	layer: string
	label: string
}

type TextControlDefinition = Extract<ControllerControlDefinition, { kind: 'text' }>
type SelectControlDefinition = Extract<ControllerControlDefinition, { kind: 'select' }>

export type TemplateTextSlot = TemplateSlotBindingBase & {
	kind: 'text'
	/** 공통 controller.groups에 있는 text Definition의 stable id. */
	controlId: string
	/** HTML input 동작과 줄 수는 아직 공통 text primitive가 표현하지 못하는 DOM binding 제약이다. */
	input: {
		format: 'free' | 'number' | 'email' | 'date'
		maxLines?: number
	}
}

export type TransformLimits = typeof IMAGE_EDIT_TRANSFORM_LIMITS

export type TemplateImageConfigSlot = TemplateSlotBindingBase & {
	kind: 'image'
	/** 대상 슬롯 기하 — 생성 비율과 transform px 환산의 단일 원천. */
	box: { width?: number; height?: number }
	/** ImageStudioConfig를 복제하지 않고 참조하는 Template 정책. */
	imageConfig:
		| { mode: 'pinned'; configId: number }
		| { mode: 'selectable'; allowedConfigIds?: readonly number[] }
	/** Image feature capability가 있을 때만 적용하는 Template 값 override. */
	featureOverrides?: {
		colorAdjustment?: { line: string; background?: string }
	}
	transform: { enabled: boolean; limits: TransformLimits }
}

export type TemplateBackgroundSlot = TemplateSlotBindingBase & {
	kind: 'background'
	/** 공통 controller.groups에 있는 background type Definition의 stable id. */
	typeControlId: typeof BACKGROUND_TYPE_CONTROL_ID
	imageConfig: { mode: 'selectable'; allowedConfigIds?: readonly number[] }
}

export type TemplateConfigSlot = TemplateTextSlot | TemplateImageConfigSlot | TemplateBackgroundSlot

export type TemplateBackgroundType = 'color' | 'image' | 'graphic'

/**
 * Template의 controller.groups에는 Template 전역에서 id가 유일한 Definition만 둔다.
 * ImageStudioConfig의 prompt/ratio처럼 슬롯마다 id가 반복되는 Definition은 각 슬롯 scope에서
 * 원본 Config를 직접 소비한다. 전역 id를 만들기 위한 prefix DSL이나 Definition 복제는 하지 않는다.
 */
export type TemplateConfig = StudioControllerConfig<'template', number> & {
	template: {
		slots: readonly TemplateConfigSlot[]
		imageConfigs: readonly ImageStudioConfig[]
		graphicConfigs: readonly GraphicStudioConfig[]
		exportOption: {
			formats: readonly TemplateExportFormat[]
			printPpi?: PublishedHtmlTemplate['printPpi']
			canvas: { width: number; height: number }
		}
	}
}

export const isTextSlot = (slot: TemplateConfigSlot): slot is TemplateTextSlot =>
	slot.kind === 'text'
export const isImageSlot = (slot: TemplateConfigSlot): slot is TemplateImageConfigSlot =>
	slot.kind === 'image'
export const isBackgroundSlot = (slot: TemplateConfigSlot): slot is TemplateBackgroundSlot =>
	slot.kind === 'background'

export function findTemplateControl(
	config: TemplateConfig,
	controlId: string,
): ControllerControlDefinition | undefined {
	return config.controller.groups
		.flatMap((group) => group.controls)
		.find((control) => control.id === controlId)
}

export type ResolvedTemplateImageConfig = {
	config: ImageStudioConfig
	prompt: TextControlDefinition
	ratio: SelectControlDefinition & {
		defaultValue: ImageAspectRatio
		options: readonly [{ value: ImageAspectRatio; label: string }]
	}
	imageSize: ImageOutputSize
}

/**
 * Image Config를 Template 슬롯에 좁혀 적용한다. Template은 1장 생성과 슬롯 기하만 강제하고,
 * 원본 Config에 없는 비율·해상도·컨트롤을 추가하지 않는다.
 */
export function resolveTemplateImageConfig(
	config: ImageStudioConfig,
	box: { width?: number; height?: number },
): ResolvedTemplateImageConfig | null {
	let controls: ReturnType<typeof getImageStudioControls>
	try {
		controls = getImageStudioControls(config)
	} catch {
		return null
	}
	const { prompt, batch, ratio, resolution } = controls
	const batchSupportsOne =
		batch.availability === undefined || batch.availability === 'enabled'
			? batch.options.some((option) => option.value === '1')
			: batch.defaultValue === '1'
	if (!batchSupportsOne) return null

	const ratioIsEnabled = ratio.availability === undefined || ratio.availability === 'enabled'
	const selectedRatio = ratioIsEnabled
		? nearestAllowedAspectRatio(
				box.width,
				box.height,
				ratio.options
					.map(({ value }) => value)
					.filter((value): value is ImageAspectRatio => isImageAspectRatio(value)),
				isImageAspectRatio(ratio.defaultValue) ? ratio.defaultValue : undefined,
			)
		: isImageAspectRatio(ratio.defaultValue)
			? ratio.defaultValue
			: undefined
	const imageSize = resolution.defaultValue
	if (
		!selectedRatio ||
		!isImageOutputSize(imageSize) ||
		!resolution.options.some((option) => option.value === imageSize)
	) {
		return null
	}

	const selectedOption = ratio.options.find((option) => option.value === selectedRatio)
	if (!selectedOption) return null
	return {
		config,
		prompt,
		ratio: {
			...ratio,
			availability: 'readonly',
			defaultValue: selectedRatio,
			options: [{ value: selectedRatio, label: selectedOption.label }],
		},
		imageSize,
	}
}

export function listCompatibleTemplateImageConfigs(
	slot: TemplateImageConfigSlot | TemplateBackgroundSlot,
	configs: readonly ImageStudioConfig[],
	box = slot.kind === 'image' ? slot.box : { width: undefined, height: undefined },
): ResolvedTemplateImageConfig[] {
	const policy = slot.imageConfig
	const allowedConfigIds =
		policy.mode === 'selectable' && policy.allowedConfigIds
			? new Set(policy.allowedConfigIds)
			: null
	const candidates = configs.filter((config) => {
		if (policy.mode === 'pinned') return config.id === policy.configId
		return !allowedConfigIds || allowedConfigIds.has(config.id)
	})
	return candidates.flatMap((config) => {
		const resolved = resolveTemplateImageConfig(config, box)
		return resolved ? [resolved] : []
	})
}

function nearestAllowedAspectRatio(
	width: number | undefined,
	height: number | undefined,
	allowed: readonly ImageAspectRatio[],
	fallback: ImageAspectRatio | undefined,
): ImageAspectRatio | undefined {
	if (allowed.length === 0) return undefined
	if (!width || !height || !Number.isFinite(width) || !Number.isFinite(height)) {
		return fallback && allowed.includes(fallback) ? fallback : allowed[0]
	}
	const target = Math.log(width / height)
	return allowed.reduce((nearest, candidate) =>
		ratioDistance(candidate, target) < ratioDistance(nearest, target) ? candidate : nearest,
	)
}

function ratioDistance(ratio: ImageAspectRatio, target: number) {
	const [width, height] = ratio.split(':').map(Number)
	return Math.abs(Math.log(width / height) - target)
}

function isImageOutputSize(value: string | null): value is ImageOutputSize {
	return value === '1K' || value === '2K' || value === '4K'
}

function isImageAspectRatio(value: string | null): value is ImageAspectRatio {
	return IMAGE_ASPECT_RATIOS.includes(value as ImageAspectRatio)
}

/** published Template과 접근 가능한 Image·Graphic Config에서 실행 가능한 Template 계약을 순수 파생한다. */
export function deriveTemplateConfig(
	template: PublishedHtmlTemplate,
	imageConfigs: readonly ImageStudioConfig[] = [],
	graphicConfigs: readonly GraphicStudioConfig[] = [],
): TemplateConfig {
	const { html, nodeConfigs } = template
	const textSlots = collectTemplateSlots(html, nodeConfigs)
	const slots: TemplateConfigSlot[] = [
		...textSlots.map(
			(slot): TemplateTextSlot => ({
				id: slot.nodeId,
				layer: slot.name,
				label: slot.input.label ?? slot.name,
				kind: 'text',
				controlId: `text:${slot.nodeId}`,
				input: {
					format: slot.input.inputFormat ?? 'free',
					maxLines: slot.input.maxLines,
				},
			}),
		),
		...collectTemplateImageSlots(html, nodeConfigs).map(
			(slot): TemplateImageConfigSlot => ({
				id: slot.nodeId,
				layer: slot.name,
				label: slot.name,
				kind: 'image',
				box: { width: slot.boxWidth, height: slot.boxHeight },
				imageConfig: slot.profileId
					? { mode: 'pinned', configId: slot.profileId }
					: { mode: 'selectable' },
				...(nodeConfigs[slot.nodeId]?.imageColorize
					? {
							featureOverrides: {
								colorAdjustment: nodeConfigs[slot.nodeId].imageColorize,
							},
						}
					: {}),
				transform: { enabled: true, limits: IMAGE_EDIT_TRANSFORM_LIMITS },
			}),
		),
		{
			id: 'background',
			layer: 'background',
			label: 'Background',
			kind: 'background',
			typeControlId: BACKGROUND_TYPE_CONTROL_ID,
			imageConfig: { mode: 'selectable' },
		},
	]

	const textControls: TextControlDefinition[] = textSlots.map((slot) => ({
		id: `text:${slot.nodeId}`,
		kind: 'text',
		label: slot.input.label ?? slot.name,
		defaultValue: slot.text,
		multiline: (slot.input.inputFormat ?? 'free') === 'free' && slot.input.maxLines !== 1,
		...(slot.input.maxLength === undefined ? {} : { maxLength: slot.input.maxLength }),
		...(slot.input.placeholder === undefined ? {} : { placeholder: slot.input.placeholder }),
	}))

	const config: TemplateConfig = {
		studio: 'template',
		id: template.id,
		version: 1,
		name: template.name,
		controller: {
			groups: [
				...(textControls.length
					? [
							{
								id: 'text',
								title: 'Text',
								collapsible: true as const,
								controls: textControls,
							},
						]
					: []),
				{
					id: 'background',
					title: 'Background',
					collapsible: true,
					controls: [
						{
							id: BACKGROUND_TYPE_CONTROL_ID,
							kind: 'select',
							label: 'Type',
							defaultValue: 'color',
							options: [
								{ value: 'color', label: 'Color' },
								{ value: 'image', label: 'Image' },
								{ value: 'graphic', label: 'Graphic' },
							],
						},
					],
				},
			],
		},
		template: {
			slots,
			imageConfigs,
			graphicConfigs,
			exportOption: {
				formats: (['png', 'tiff', 'pdf'] as const).filter((format) =>
					canExportTemplate(format, {
						fileName: template.name,
						height: template.height,
						html: template.html,
						printPpi: template.printPpi,
						templateId: template.id,
						templateVersion: template.templateVersion,
						width: template.width,
					}),
				),
				printPpi: template.printPpi,
				canvas: { width: template.width, height: template.height },
			},
		},
	}
	parseStudioControllerConfig(config)
	return config
}
