import {
	type GraphicStudioConfig,
	parseGraphicStudioConfig,
} from '@/features/graphic-generation/domain/graphic-studio-config'
import {
	getImageStudioControls,
	type ImageStudioConfig,
	parseImageStudioConfig,
} from '@/features/image-generation/domain/image-studio-config'
import {
	IMAGE_ASPECT_RATIOS,
	type ImageAspectRatio,
	type ImageOutputSize,
} from '@/features/image-generation/image-size'
import { DEFAULT_CMYK_ICC_PROFILE } from '@/features/studio-export/color-profile'
import type { PrintPpi } from '@/features/studio-export/print-policy'
import { supportsTemplateExport } from '@/features/studio-export/services/export-template'
import {
	parseStudioOutputCapability,
	resolveStudioOutputFormats,
} from '@/features/studio-export/studio-output'
import {
	collectTemplateImageSlots,
	collectTemplateSlots,
	collectTemplateVectorSlots,
	type ResolvedTemplateLayerPolicy,
} from '@/features/template-core/domain/collect-template-slots'
import { IMAGE_EDIT_TRANSFORM_LIMITS } from '@/lib/template-image-transform'
import type {
	ControllerControlDefinition,
	ControllerGroupDefinition,
	StudioControllerConfig,
	StudioRuntimeManifest,
} from '@/modules/studio-controller/controller-definition'
import {
	applyControllerRestrictions,
	parseStudioControllerConfig,
	projectPayloadControllerRestrictions,
	resolveControllerPresentation,
} from '@/modules/studio-controller/controller-definition'
import type { TemplateNodeConfig } from '@/types/template'

const BACKGROUND_TYPE_CONTROL_ID = 'background.type'
const BACKGROUND_COLOR_CONTROL_ID = 'background.color'
const TEXT_COLOR_CONTROL_ID = 'text.color'

type TemplateSlotBindingBase = {
	/** DOM 합성 주소. Label과 분리되어 Admin에서 이름을 바꿔도 binding은 유지된다. */
	id: string
	layer: string
	label: string
}

type TemplateEditableSlotBase = TemplateSlotBindingBase & ResolvedTemplateLayerPolicy

type TextControlDefinition = Extract<ControllerControlDefinition, { kind: 'text' }>
type SelectControlDefinition = Extract<ControllerControlDefinition, { kind: 'select' }>

export type TemplateTextSlot = TemplateEditableSlotBase & {
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

export type TemplateImageConfigSlot = TemplateEditableSlotBase & {
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

export type TemplateVectorSlot = TemplateEditableSlotBase & {
	kind: 'vector'
	color?: string
}

export type TemplateBackgroundSlot = TemplateSlotBindingBase & {
	kind: 'background'
	/** 공통 controller.groups에 있는 background type Definition의 stable id. */
	typeControlId: typeof BACKGROUND_TYPE_CONTROL_ID
	colorControlId: typeof BACKGROUND_COLOR_CONTROL_ID
	imageConfig: { mode: 'selectable'; allowedConfigIds?: readonly number[] }
}

export type TemplateEditableLayer = TemplateTextSlot | TemplateImageConfigSlot | TemplateVectorSlot

export type TemplateConfigSlot = TemplateEditableLayer | TemplateBackgroundSlot

export type TemplateBackgroundType = 'color' | 'image' | 'graphic'

/** Template Studio SSR에 노출하는 node config 부분집합. */
export type PublishedTemplateNodeConfig = {
	input?: Omit<NonNullable<TemplateNodeConfig['input']>, 'aiInstruction'>
	imageInput?: TemplateNodeConfig['imageInput']
	imageColorize?: TemplateNodeConfig['imageColorize']
	creator?: TemplateNodeConfig['creator']
	vectorColor?: TemplateNodeConfig['vectorColor']
}

/** Published Template을 Template Studio Config와 세션이 소비하는 read model로 투영한 계약. */
export type PublishedHtmlTemplate = {
	kind: 'html'
	id: number
	name: string
	html: string
	nodeConfigs: Record<string, PublishedTemplateNodeConfig>
	width: number
	height: number
	printPpi?: PrintPpi
	templateVersion: string
	controllerRestrictions?: unknown
	controllerPresentation?: unknown
	output?: { allowedFormats?: readonly string[] | null } | null
}

/**
 * Template의 controller.groups에는 Template 전역에서 id가 유일한 Definition만 둔다.
 * ImageStudioConfig의 prompt/ratio처럼 슬롯마다 id가 반복되는 Definition은 각 슬롯 scope에서
 * 원본 Config를 직접 소비한다. 전역 id를 만들기 위한 prefix DSL이나 Definition 복제는 하지 않는다.
 */
export type TemplateConfig = StudioControllerConfig<'template', number> & {
	template: {
		slots: readonly TemplateConfigSlot[]
		textColorControlId?: typeof TEXT_COLOR_CONTROL_ID
		imageConfigs: readonly ImageStudioConfig[]
		graphicConfigs: readonly GraphicStudioConfig[]
		exportOption: {
			printPpi?: PublishedHtmlTemplate['printPpi']
			canvas: { width: number; height: number }
		}
	}
}

/** unknown 입력을 공통 Controller와 Template slot/reference/export descriptor까지 검증한다. */
export function parseTemplateConfig(input: unknown): TemplateConfig {
	const common = parseStudioControllerConfig(input)
	parseStudioOutputCapability(common.output)
	const root = templateRecord(input, 'TemplateConfig')
	assertTemplateKeys(root, [
		'studio',
		'id',
		'version',
		'name',
		'output',
		'controller',
		'controllerPresentation',
		'template',
	])
	if (common.studio !== 'template')
		throw new Error('TemplateConfig studio: template이어야 합니다.')
	if (typeof common.id !== 'number' || !Number.isInteger(common.id)) {
		throw new Error('TemplateConfig id: 정수여야 합니다.')
	}
	const template = templateRecord(root.template, 'TemplateConfig.template')
	assertTemplateKeys(template, [
		'slots',
		'textColorControlId',
		'imageConfigs',
		'graphicConfigs',
		'exportOption',
	])
	if (!Array.isArray(template.slots)) throw new Error('TemplateConfig slots는 배열이어야 합니다.')
	if (!Array.isArray(template.imageConfigs) || !Array.isArray(template.graphicConfigs)) {
		throw new Error('TemplateConfig 참조 Config는 배열이어야 합니다.')
	}
	if (template.textColorControlId !== undefined) {
		assertTemplateString(template.textColorControlId, 'textColorControlId')
	}
	const imageConfigIds = new Set<number>()
	for (const config of template.imageConfigs) {
		const parsed = parseImageStudioConfig(config)
		if (imageConfigIds.has(parsed.id))
			throw new Error(`TemplateConfig Image Config id가 중복되었습니다: ${parsed.id}`)
		imageConfigIds.add(parsed.id)
	}
	const graphicConfigIds = new Set<string>()
	for (const config of template.graphicConfigs) {
		const parsed = parseGraphicStudioConfig(config)
		if (graphicConfigIds.has(parsed.id))
			throw new Error(`TemplateConfig Graphic Config id가 중복되었습니다: ${parsed.id}`)
		graphicConfigIds.add(parsed.id)
	}

	const slotIds = new Set<string>()
	for (const value of template.slots) {
		const slot = templateRecord(value, 'TemplateConfig slot')
		for (const key of ['id', 'layer', 'label']) assertTemplateString(slot[key], `slot.${key}`)
		if (slotIds.has(slot.id as string))
			throw new Error(`TemplateConfig slot id가 중복되었습니다: ${slot.id}`)
		slotIds.add(slot.id as string)
		if (slot.kind !== 'background') assertTemplateLayerPolicy(slot)
		switch (slot.kind) {
			case 'text': {
				assertTemplateKeys(slot, [
					'id',
					'layer',
					'label',
					'kind',
					'access',
					'visibility',
					'controlId',
					'input',
				])
				assertTemplateString(slot.controlId, 'slot.controlId')
				const textInput = templateRecord(slot.input, 'Template text input')
				assertTemplateKeys(textInput, ['format', 'maxLines'])
				if (!['free', 'number', 'email', 'date'].includes(textInput.format as string)) {
					throw new Error('Template text input format이 올바르지 않습니다.')
				}
				if (textInput.maxLines !== undefined)
					assertPositiveInteger(textInput.maxLines, 'maxLines')
				break
			}
			case 'image': {
				assertTemplateKeys(slot, [
					'id',
					'layer',
					'label',
					'kind',
					'access',
					'visibility',
					'box',
					'imageConfig',
					'featureOverrides',
					'transform',
				])
				assertTemplateBox(slot.box)
				assertTemplateImagePolicy(slot.imageConfig)
				if (slot.featureOverrides !== undefined) {
					assertTemplateFeatureOverrides(slot.featureOverrides)
				}
				const transform = templateRecord(slot.transform, 'Template transform')
				assertTemplateKeys(transform, ['enabled', 'limits'])
				if (typeof transform.enabled !== 'boolean')
					throw new Error('Template transform enabled가 올바르지 않습니다.')
				assertTemplateTransformLimits(transform.limits)
				break
			}
			case 'vector':
				assertTemplateKeys(slot, [
					'id',
					'layer',
					'label',
					'kind',
					'access',
					'visibility',
					'color',
				])
				if (slot.color !== undefined) assertTemplateString(slot.color, 'slot.color')
				break
			case 'background':
				assertTemplateKeys(slot, [
					'id',
					'layer',
					'label',
					'kind',
					'typeControlId',
					'colorControlId',
					'imageConfig',
				])
				assertTemplateString(slot.typeControlId, 'slot.typeControlId')
				assertTemplateString(slot.colorControlId, 'slot.colorControlId')
				assertTemplateImagePolicy(slot.imageConfig)
				break
			default:
				throw new Error(`지원하지 않는 Template slot입니다: ${String(slot.kind)}`)
		}
	}

	const exportOption = templateRecord(template.exportOption, 'TemplateConfig exportOption')
	assertTemplateKeys(exportOption, ['printPpi', 'canvas'])
	if (exportOption.printPpi !== undefined) assertPositiveNumber(exportOption.printPpi, 'printPpi')
	const canvas = templateRecord(exportOption.canvas, 'TemplateConfig canvas')
	assertTemplateKeys(canvas, ['width', 'height'])
	assertPositiveNumber(canvas.width, 'canvas.width')
	assertPositiveNumber(canvas.height, 'canvas.height')

	const typed = input as TemplateConfig
	const { text, background } = partitionTemplateSlots(typed.template.slots)
	for (const slot of text) {
		if (findTemplateControl(typed, slot.controlId)?.kind !== 'text') {
			throw new Error(`Template text control 참조가 올바르지 않습니다: ${slot.controlId}`)
		}
	}
	if (
		typed.template.textColorControlId &&
		findTemplateControl(typed, typed.template.textColorControlId)?.kind !== 'color'
	) {
		throw new Error('Template text color control 참조가 올바르지 않습니다.')
	}
	if (
		background &&
		(findTemplateControl(typed, background.typeControlId)?.kind !== 'select' ||
			findTemplateControl(typed, background.colorControlId)?.kind !== 'color')
	) {
		throw new Error('Template background control 참조가 올바르지 않습니다.')
	}
	return typed
}

export const isTextSlot = (slot: TemplateConfigSlot): slot is TemplateTextSlot =>
	slot.kind === 'text'
export const isImageSlot = (slot: TemplateConfigSlot): slot is TemplateImageConfigSlot =>
	slot.kind === 'image'
export const isVectorSlot = (slot: TemplateConfigSlot): slot is TemplateVectorSlot =>
	slot.kind === 'vector'
export const isBackgroundSlot = (slot: TemplateConfigSlot): slot is TemplateBackgroundSlot =>
	slot.kind === 'background'

/** slot kind 추가 시 모든 소비 경로가 한 exhaustive switch에서 컴파일 실패하도록 분류한다. */
export function partitionTemplateSlots(slots: readonly TemplateConfigSlot[]) {
	const text: TemplateTextSlot[] = []
	const image: TemplateImageConfigSlot[] = []
	const vector: TemplateVectorSlot[] = []
	let background: TemplateBackgroundSlot | undefined
	for (const slot of slots) {
		switch (slot.kind) {
			case 'text':
				text.push(slot)
				break
			case 'image':
				image.push(slot)
				break
			case 'vector':
				vector.push(slot)
				break
			case 'background':
				if (background) throw new Error('Template background slot은 하나만 허용됩니다.')
				background = slot
				break
			default:
				return assertNeverTemplateSlot(slot)
		}
	}
	return { text, image, vector, background }
}

function assertNeverTemplateSlot(slot: never): never {
	throw new Error(`지원하지 않는 Template slot입니다: ${JSON.stringify(slot)}`)
}

export function findTemplateControl(
	config: TemplateConfig,
	controlId: string,
): ControllerControlDefinition | undefined {
	return config.controller.groups
		.flatMap((group) => group.controls)
		.find((control) => control.id === controlId)
}

export function findTemplateControlGroup(
	config: TemplateConfig,
	controlId: string,
): ControllerGroupDefinition | undefined {
	return config.controller.groups.find((group) =>
		group.controls.some((control) => control.id === controlId),
	)
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

/** Template 문서 구조에서 Admin 제한 전의 결정적 Runtime Manifest를 파생한다. */
export function getTemplateRuntimeManifest({
	html,
	nodeConfigs,
	printPpi,
	templateVersion,
}: Pick<PublishedHtmlTemplate, 'html' | 'nodeConfigs' | 'printPpi'> & {
	templateVersion?: string
}): StudioRuntimeManifest {
	const textControls: TextControlDefinition[] = collectTemplateSlots(html, nodeConfigs).map(
		(slot) => ({
			id: `text:${slot.nodeId}`,
			kind: 'text',
			label: slot.input.label ?? slot.name,
			defaultValue: slot.text,
			...(slot.policy.access === 'readonly' ? { availability: 'readonly' as const } : {}),
			multiline: (slot.input.inputFormat ?? 'free') === 'free' && slot.input.maxLines !== 1,
			...(slot.input.maxLength === undefined ? {} : { maxLength: slot.input.maxLength }),
			...(slot.input.placeholder === undefined
				? {}
				: { placeholder: slot.input.placeholder }),
		}),
	)
	return {
		output: {
			colorProfiles: {
				rgb: ['srgb'],
				cmyk: [DEFAULT_CMYK_ICC_PROFILE],
			},
			formats: (['png', 'tiff', 'pdf'] as const).filter((format) =>
				supportsTemplateExport(format, { printPpi, templateVersion }),
			),
		},
		controller: {
			groups: [
				...(textControls.length
					? [
							{
								id: 'text',
								title: 'Text',
								controls: [
									...textControls,
									{
										id: TEXT_COLOR_CONTROL_ID,
										kind: 'color' as const,
										label: 'Color',
										defaultValue: null,
									},
								],
							},
						]
					: []),
				{
					id: 'background',
					title: 'Background',
					controls: [
						{
							id: BACKGROUND_TYPE_CONTROL_ID,
							kind: 'select' as const,
							label: 'Type',
							defaultValue: 'color',
							options: [
								{ value: 'color', label: 'Color' },
								{ value: 'image', label: 'Image' },
								{ value: 'graphic', label: 'Graphic' },
							],
						},
						{
							id: BACKGROUND_COLOR_CONTROL_ID,
							kind: 'color' as const,
							label: 'Background Color',
							defaultValue: null,
						},
					],
				},
			],
		},
	}
}

/** published Template과 접근 가능한 Image·Graphic Config에서 실행 가능한 Template 계약을 순수 파생한다. */
export function deriveTemplateConfig(
	template: PublishedHtmlTemplate,
	imageConfigs: readonly ImageStudioConfig[] = [],
	graphicConfigs: readonly GraphicStudioConfig[] = [],
): TemplateConfig {
	const { html, nodeConfigs } = template
	const textSlots = collectTemplateSlots(html, nodeConfigs)
	const vectorSlots = collectTemplateVectorSlots(html, nodeConfigs)
	const slots: TemplateConfigSlot[] = [
		...textSlots.map(
			(slot): TemplateTextSlot => ({
				id: slot.nodeId,
				layer: slot.name,
				label: slot.input.label ?? slot.name,
				kind: 'text',
				access: slot.policy.access,
				visibility: slot.policy.visibility,
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
				access: slot.policy.access,
				visibility: slot.policy.visibility,
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
		...vectorSlots.map(
			(slot): TemplateVectorSlot => ({
				id: slot.nodeId,
				layer: slot.name,
				label: slot.name,
				kind: 'vector',
				access: slot.policy.access,
				visibility: slot.policy.visibility,
				...(slot.color ? { color: slot.color } : {}),
			}),
		),
		{
			id: 'background',
			layer: 'background',
			label: 'Background',
			kind: 'background',
			typeControlId: BACKGROUND_TYPE_CONTROL_ID,
			colorControlId: BACKGROUND_COLOR_CONTROL_ID,
			imageConfig: { mode: 'selectable' },
		},
	]

	const runtimeManifest = getTemplateRuntimeManifest(template)
	const controllerGroups = applyControllerRestrictions(
		runtimeManifest.controller.groups,
		projectPayloadControllerRestrictions(template.controllerRestrictions),
	)

	const config: TemplateConfig = {
		studio: 'template',
		id: template.id,
		version: 1,
		name: template.name,
		output: {
			...runtimeManifest.output,
			formats: resolveStudioOutputFormats(
				runtimeManifest.output.formats,
				template.output?.allowedFormats,
			),
		},
		controller: {
			groups: controllerGroups,
		},
		controllerPresentation: resolveControllerPresentation(
			controllerGroups,
			template.controllerPresentation,
		),
		template: {
			slots,
			...(textSlots.length ? { textColorControlId: TEXT_COLOR_CONTROL_ID } : {}),
			imageConfigs,
			graphicConfigs,
			exportOption: {
				printPpi: template.printPpi,
				canvas: { width: template.width, height: template.height },
			},
		},
	}
	parseTemplateConfig(config)
	return config
}

function templateRecord(value: unknown, name: string): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${name}이 객체가 아닙니다.`)
	}
	return value as Record<string, unknown>
}

function assertTemplateKeys(value: Record<string, unknown>, allowed: readonly string[]) {
	const allowedKeys = new Set(allowed)
	for (const key of Object.keys(value)) {
		if (!allowedKeys.has(key)) {
			throw new Error(`TemplateConfig에 알 수 없는 필드가 있습니다: ${key}`)
		}
	}
}

function assertTemplateString(value: unknown, name: string) {
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(`TemplateConfig ${name}은 비어 있지 않은 문자열이어야 합니다.`)
	}
}

function assertPositiveNumber(value: unknown, name: string) {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
		throw new Error(`TemplateConfig ${name}은 양수여야 합니다.`)
	}
}

function assertFiniteNumber(value: unknown, name: string) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(`TemplateConfig ${name}은 유한한 숫자여야 합니다.`)
	}
}

function assertPositiveInteger(value: unknown, name: string) {
	assertPositiveNumber(value, name)
	if (!Number.isInteger(value)) throw new Error(`TemplateConfig ${name}은 정수여야 합니다.`)
}

function assertTemplateBox(value: unknown) {
	const box = templateRecord(value, 'TemplateConfig box')
	assertTemplateKeys(box, ['width', 'height'])
	if (box.width !== undefined) assertPositiveNumber(box.width, 'box.width')
	if (box.height !== undefined) assertPositiveNumber(box.height, 'box.height')
}

function assertTemplateLayerPolicy(slot: Record<string, unknown>) {
	if (slot.access !== 'readonly' && slot.access !== 'editable') {
		throw new Error('TemplateConfig layer access가 올바르지 않습니다.')
	}
	const visibility = templateRecord(slot.visibility, 'TemplateConfig layer visibility')
	assertTemplateKeys(visibility, ['defaultVisible', 'allowToggle'])
	if (
		typeof visibility.defaultVisible !== 'boolean' ||
		typeof visibility.allowToggle !== 'boolean'
	) {
		throw new Error('TemplateConfig layer visibility가 올바르지 않습니다.')
	}
	if (slot.access !== 'editable' && (!visibility.defaultVisible || visibility.allowToggle)) {
		throw new Error('TemplateConfig readonly layer는 visibility 정책을 바꿀 수 없습니다.')
	}
}

function assertTemplateFeatureOverrides(value: unknown) {
	const overrides = templateRecord(value, 'TemplateConfig featureOverrides')
	assertTemplateKeys(overrides, ['colorAdjustment'])
	if (overrides.colorAdjustment === undefined) return
	const color = templateRecord(overrides.colorAdjustment, 'TemplateConfig colorAdjustment')
	assertTemplateKeys(color, ['line', 'background'])
	assertTemplateString(color.line, 'colorAdjustment.line')
	if (color.background !== undefined) {
		assertTemplateString(color.background, 'colorAdjustment.background')
	}
}

function assertTemplateTransformLimits(value: unknown) {
	const limits = templateRecord(value, 'TemplateConfig transform limits')
	assertTemplateKeys(limits, ['translate', 'scale', 'rotate'])
	for (const key of ['translate', 'scale', 'rotate'] as const) {
		const range = templateRecord(limits[key], `TemplateConfig transform limits.${key}`)
		assertTemplateKeys(range, ['min', 'max'])
		assertFiniteNumber(range.min, `transform limits.${key}.min`)
		assertFiniteNumber(range.max, `transform limits.${key}.max`)
		if ((range.min as number) > (range.max as number)) {
			throw new Error(`TemplateConfig transform limits.${key}의 범위가 올바르지 않습니다.`)
		}
	}
}

function assertTemplateImagePolicy(value: unknown) {
	const policy = templateRecord(value, 'TemplateConfig image policy')
	if (policy.mode === 'pinned') {
		assertTemplateKeys(policy, ['mode', 'configId'])
		assertPositiveInteger(policy.configId, 'imageConfig.configId')
		return
	}
	if (policy.mode !== 'selectable')
		throw new Error('TemplateConfig image policy mode가 올바르지 않습니다.')
	assertTemplateKeys(policy, ['mode', 'allowedConfigIds'])
	if (policy.allowedConfigIds === undefined) return
	if (!Array.isArray(policy.allowedConfigIds)) {
		throw new Error('TemplateConfig allowedConfigIds는 배열이어야 합니다.')
	}
	const ids = new Set<number>()
	for (const id of policy.allowedConfigIds) {
		assertPositiveInteger(id, 'allowedConfigIds')
		if (ids.has(id as number))
			throw new Error('TemplateConfig allowedConfigIds가 중복되었습니다.')
		ids.add(id as number)
	}
}
