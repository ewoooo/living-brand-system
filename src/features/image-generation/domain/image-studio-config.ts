import { IMAGE_PROMPT_MAX_LENGTH } from '@/features/image-generation/image-generation-limits'
import type { ImageModelPreset } from '@/features/image-generation/image-model'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/image-generation/image-size'
import {
	resolveStudioOutputFormats,
	type StudioOutputCapability,
} from '@/features/studio-export/studio-output'
import {
	acceptsControllerExecutionValue,
	type ControllerControlDefinition,
	parseStudioControllerConfig,
	projectPayloadController,
	type StudioControllerConfig,
} from '@/modules/studio-controller/controller-definition'
import {
	getImageProfileServiceCapability,
	IMAGE_STUDIO_CONTROL_IDS,
} from './image-profile-service-capability'

export { IMAGE_STUDIO_CONTROL_IDS } from './image-profile-service-capability'

export const IMAGE_STUDIO_GROUP_IDS = {
	image: 'image',
	profileSettings: 'profile-settings',
	generationSettings: 'generation-settings',
} as const

export type ImageStudioFeature =
	| {
			type: 'color-adjustment'
			controls: { line: string; background?: string }
	  }
	| { type: 'camera-control' }

/** Image Studio Config를 파생하는 서버측 published 프로파일 read model. */
export type PublishedImageProfileDefinition = {
	id: number
	name: string
	slug: string | null
	imageModelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
	maxPromptLength?: number | null
	cameraControl?: boolean | null
	colorAdjustment?: { line?: string | null; background?: string | null } | null
	controller?: unknown
	features?: unknown
	output?: { allowedFormats?: readonly string[] | null; original?: boolean | null } | null
}

/** 이미지 프로파일 하나가 발행하는 공통 Controller envelope와 이미지 실행 descriptor. */
export type ImageStudioConfig = StudioControllerConfig<'image', number> & {
	output: StudioOutputCapability & { original: boolean }
	image: {
		slug: string | null
		features: readonly ImageStudioFeature[]
	}
}

type ControlOfKind<Kind extends ControllerControlDefinition['kind']> = Extract<
	ControllerControlDefinition,
	{ kind: Kind }
>

export type ImageStudioControls = {
	prompt: ControlOfKind<'text'>
	batch: ControlOfKind<'select'>
	ratio: ControlOfKind<'select'>
	resolution: ControlOfKind<'select'>
}

/** unknown 입력을 공통 Controller와 Image descriptor까지 검증한다. */
export function parseImageStudioConfig(input: unknown): ImageStudioConfig {
	const common = parseStudioControllerConfig(input)
	const config = record(input, 'ImageStudioConfig')
	assertKeys(config, ['studio', 'id', 'version', 'name', 'output', 'controller', 'image'])
	if (common.studio !== 'image') throw new Error('ImageStudioConfig studio: image여야 합니다.')
	if (typeof common.id !== 'number' || !Number.isInteger(common.id)) {
		throw new Error('ImageStudioConfig id: 정수여야 합니다.')
	}
	if (common.output.formats.some((format) => format !== 'png' && format !== 'jpeg')) {
		throw new Error('ImageStudioConfig output format이 올바르지 않습니다.')
	}
	if (typeof common.output.original !== 'boolean') {
		throw new Error('ImageStudioConfig output.original이 필요합니다.')
	}

	const image = record(config.image, 'ImageStudioConfig.image')
	assertKeys(image, ['slug', 'features'])
	if (image.slug !== null && typeof image.slug !== 'string') {
		throw new Error('ImageStudioConfig image.slug는 문자열 또는 null이어야 합니다.')
	}
	if (!Array.isArray(image.features)) {
		throw new Error('ImageStudioConfig image.features는 배열이어야 합니다.')
	}
	const featureTypes = new Set<string>()
	for (const featureValue of image.features) {
		const feature = record(featureValue, 'ImageStudioConfig feature')
		if (feature.type === 'camera-control') {
			assertKeys(feature, ['type'])
		} else if (feature.type === 'color-adjustment') {
			assertKeys(feature, ['type', 'controls'])
			const controls = record(feature.controls, 'ImageStudioConfig color controls')
			assertKeys(controls, ['line', 'background'])
			if (typeof controls.line !== 'string' || controls.line.length === 0) {
				throw new Error('ImageStudioConfig color line control이 필요합니다.')
			}
			if (controls.background !== undefined && typeof controls.background !== 'string') {
				throw new Error('ImageStudioConfig color background control이 올바르지 않습니다.')
			}
		} else {
			throw new Error(`지원하지 않는 ImageStudioFeature입니다: ${String(feature.type)}`)
		}
		if (featureTypes.has(feature.type as string)) {
			throw new Error(`Image feature type이 중복되었습니다: ${String(feature.type)}`)
		}
		featureTypes.add(feature.type as string)
	}

	const typed = input as ImageStudioConfig
	getImageStudioControls(typed)
	getImageColorAdjustmentControls(typed)
	return typed
}

/** Image와 Template 생성 경로가 공유하는 prompt 실행 판정이다. */
export function acceptsImagePromptExecution(
	control: ControlOfKind<'text'>,
	value: string,
): boolean {
	return value.trim().length > 0 && acceptsControllerExecutionValue(control, value)
}

export function resolveImagePromptExecution(control: ControlOfKind<'text'>, value: string): string {
	return control.availability === 'readonly' || control.availability === 'disabled'
		? (control.defaultValue ?? '')
		: value.trim()
}

/** stable ID로 이미지 도메인의 필수 생성 컨트롤과 선택 색 컨트롤을 찾는다. */
export function getImageStudioControls(config: ImageStudioConfig): ImageStudioControls {
	return {
		prompt: requireControl(config, IMAGE_STUDIO_CONTROL_IDS.prompt, 'text'),
		batch: requireControl(config, IMAGE_STUDIO_CONTROL_IDS.batch, 'select'),
		ratio: requireControl(config, IMAGE_STUDIO_CONTROL_IDS.ratio, 'select'),
		resolution: requireControl(config, IMAGE_STUDIO_CONTROL_IDS.resolution, 'select'),
	}
}

/** Image feature type으로 published capability를 찾는다. */
export function getImageStudioFeature<Type extends ImageStudioFeature['type']>(
	config: ImageStudioConfig,
	type: Type,
): Extract<ImageStudioFeature, { type: Type }> | undefined {
	return config.image.features.find((feature) => feature.type === type) as
		| Extract<ImageStudioFeature, { type: Type }>
		| undefined
}

/** color-adjustment feature의 semantic ref를 실제 color Definition으로 해석한다. */
export function getImageColorAdjustmentControls(config: ImageStudioConfig): {
	line: ControlOfKind<'color'>
	background?: ControlOfKind<'color'>
} | null {
	const feature = getImageStudioFeature(config, 'color-adjustment')
	if (!feature) return null
	return {
		line: requireControl(config, feature.controls.line, 'color'),
		...(feature.controls.background
			? { background: requireControl(config, feature.controls.background, 'color') }
			: {}),
	}
}

/** common ControllerRenderer에서 feature dispatcher가 소유한 control을 제외할 ID 목록이다. */
export function getImageStudioFeatureControlIds(config: ImageStudioConfig): readonly string[] {
	return config.image.features.flatMap((feature) => {
		switch (feature.type) {
			case 'color-adjustment':
				return [feature.controls.line, feature.controls.background].filter(
					(value): value is string => Boolean(value),
				)
			case 'camera-control':
				return []
			default:
				return assertNeverFeature(feature)
		}
	})
}

function assertNeverFeature(value: never): never {
	throw new Error(`지원하지 않는 ImageStudioFeature입니다: ${JSON.stringify(value)}`)
}

/**
 * published 프로파일을 브라우저에 내려도 안전한 이미지 StudioConfig로 투영한다.
 * 저장된 Controller가 없으면 기존 프로파일 필드를 stable control ID로 옮긴다.
 */
export function deriveImageStudioConfig(
	profile: PublishedImageProfileDefinition,
): ImageStudioConfig {
	const storedController = projectPayloadController(profile.controller)
	const storedFeatures = projectStoredFeatures(profile.features)
	const capability = getImageProfileServiceCapability(profile.imageModelPreset)
	const config: ImageStudioConfig = {
		studio: 'image',
		id: profile.id,
		version: 1,
		name: profile.name,
		output: {
			...capability.output,
			formats: resolveStudioOutputFormats(
				capability.output.formats,
				profile.output?.allowedFormats,
			),
			original: profile.output?.original ?? capability.output.original,
		},
		controller: storedController ?? deriveLegacyController(profile),
		image: {
			slug: profile.slug ?? null,
			// canonical Controller가 있으면 빈 features도 명시적 no-capability다. 기존 문서처럼
			// Controller가 없을 때만 빈 Payload blocks를 legacy 필드로 복구한다.
			features:
				storedController && !storedFeatures?.length
					? []
					: storedFeatures?.length
						? storedFeatures
						: deriveLegacyFeatures(profile),
		},
	}

	parseImageStudioConfig(config)
	assertImageServiceCapability(config, profile.imageModelPreset)
	return config
}

function deriveLegacyFeatures(
	profile: PublishedImageProfileDefinition,
): readonly ImageStudioFeature[] {
	const color = profile.colorAdjustment
	return [
		...(color?.line
			? [
					{
						type: 'color-adjustment' as const,
						controls: {
							line: IMAGE_STUDIO_CONTROL_IDS.lineColor,
							...(color.background
								? { background: IMAGE_STUDIO_CONTROL_IDS.backgroundColor }
								: {}),
						},
					},
				]
			: []),
		// 필드가 없던 시절의 문서는 지금까지처럼 시점 조정을 연다.
		...((profile.cameraControl ?? true) ? [{ type: 'camera-control' as const }] : []),
	]
}

function deriveLegacyController(
	profile: PublishedImageProfileDefinition,
): ImageStudioConfig['controller'] {
	const line = profile.colorAdjustment?.line
	const background = profile.colorAdjustment?.background
	const capability = getImageProfileServiceCapability(profile.imageModelPreset)

	return {
		groups: [
			{
				id: IMAGE_STUDIO_GROUP_IDS.image,
				title: 'Image',
				collapsible: true,
				defaultOpen: true,
				controls: [
					{
						id: IMAGE_STUDIO_CONTROL_IDS.prompt,
						kind: 'text',
						label: 'Prompt',
						defaultValue: '',
						multiline: true,
						maxLength: profile.maxPromptLength ?? IMAGE_PROMPT_MAX_LENGTH,
						placeholder: '이미지를 설명하세요',
					},
				],
			},
			...(line
				? [
						{
							id: IMAGE_STUDIO_GROUP_IDS.profileSettings,
							title: 'Profile Settings',
							collapsible: true as const,
							defaultOpen: true,
							controls: [
								{
									id: IMAGE_STUDIO_CONTROL_IDS.lineColor,
									kind: 'color' as const,
									label: 'Line Color',
									defaultValue: line,
								},
								...(background
									? [
											{
												id: IMAGE_STUDIO_CONTROL_IDS.backgroundColor,
												kind: 'color' as const,
												label: 'Background Color',
												defaultValue: background,
											},
										]
									: []),
							],
						},
					]
				: []),
			{
				id: IMAGE_STUDIO_GROUP_IDS.generationSettings,
				title: 'Setting',
				controls: [
					selectControl(
						IMAGE_STUDIO_CONTROL_IDS.batch,
						'장수',
						capability.controls.batch.options,
						capability.controls.batch.defaultValue,
					),
					selectControl(
						IMAGE_STUDIO_CONTROL_IDS.ratio,
						'비율',
						capability.controls.ratio.options,
						profile.aspectRatio,
					),
					selectControl(
						IMAGE_STUDIO_CONTROL_IDS.resolution,
						'해상도',
						capability.controls.resolution.options,
						profile.imageSize,
					),
				],
			},
		],
	}
}

function selectControl(
	id: string,
	label: string,
	values: readonly string[],
	defaultValue: string,
): ControlOfKind<'select'> {
	return {
		id,
		kind: 'select',
		label,
		defaultValue,
		options: values.map((value) => ({ label: value, value })),
	}
}

/** Payload feature block 메타데이터를 공개 capability IR로 좁힌다. */
function projectStoredFeatures(input: unknown): readonly ImageStudioFeature[] | null {
	if (input == null) return null
	if (!Array.isArray(input)) throw new Error('Image features가 배열이 아닙니다.')

	return input.map((value) => {
		const feature = record(value, 'Image feature')
		switch (feature.blockType) {
			case 'colorAdjustment':
				return {
					type: 'color-adjustment' as const,
					controls: {
						line: feature.line as string,
						...optionalProperty('background', feature.background as string | undefined),
					},
				}
			case 'cameraControl':
				return { type: 'camera-control' as const }
			default:
				throw new Error(`지원하지 않는 Image feature blockType입니다: ${feature.blockType}`)
		}
	})
}

function assertImageServiceCapability(
	config: ImageStudioConfig,
	model: PublishedImageProfileDefinition['imageModelPreset'],
) {
	const capability = getImageProfileServiceCapability(model)
	const { prompt, batch, ratio, resolution } = getImageStudioControls(config)
	if (!prompt.maxLength || prompt.maxLength > capability.promptMaxLength) {
		throw new Error(`Image prompt maxLength는 ${capability.promptMaxLength} 이하여야 합니다.`)
	}
	assertOptions(batch, capability.controls.batch.options, 'batch')
	assertOptions(ratio, capability.controls.ratio.options, 'ratio')
	assertOptions(resolution, capability.controls.resolution.options, 'resolution')

	const referencedFeatureControls = new Set<string>()
	const types = new Set<ImageStudioFeature['type']>()
	for (const feature of config.image.features) {
		if (!capability.features.includes(feature.type)) {
			throw new Error(`Image service가 지원하지 않는 feature입니다: ${feature.type}`)
		}
		if (types.has(feature.type)) {
			throw new Error(`Image feature type이 중복되었습니다: ${feature.type}`)
		}
		types.add(feature.type)
		if (feature.type !== 'color-adjustment') continue
		referencedFeatureControls.add(feature.controls.line)
		requireControl(config, feature.controls.line, 'color')
		if (feature.controls.background) {
			referencedFeatureControls.add(feature.controls.background)
			requireControl(config, feature.controls.background, 'color')
		}
	}

	for (const control of config.controller.groups.flatMap((group) => group.controls)) {
		const supported = capability.controls[control.id as keyof typeof capability.controls]
		const featureColor = referencedFeatureControls.has(control.id) && control.kind === 'color'
		if ((!supported || supported.kind !== control.kind) && !featureColor) {
			throw new Error(`Image service가 지원하지 않는 control입니다: ${control.id}`)
		}
		if (
			(control.id === IMAGE_STUDIO_CONTROL_IDS.lineColor ||
				control.id === IMAGE_STUDIO_CONTROL_IDS.backgroundColor) &&
			!referencedFeatureControls.has(control.id)
		) {
			throw new Error(`Image feature가 참조하지 않는 color control입니다: ${control.id}`)
		}
	}
}

function assertOptions(control: ControlOfKind<'select'>, allowed: readonly string[], name: string) {
	if (control.options.some((option) => !allowed.includes(option.value))) {
		throw new Error(`Image ${name} options가 서버 상한을 벗어났습니다.`)
	}
}

function requireControl<Kind extends ControllerControlDefinition['kind']>(
	config: ImageStudioConfig,
	id: string,
	kind: Kind,
): ControlOfKind<Kind> {
	const control = optionalControl(config, id, kind)
	if (!control) throw new Error(`Image controller에 ${id} ${kind} control이 필요합니다.`)
	return control
}

function optionalControl<Kind extends ControllerControlDefinition['kind']>(
	config: ImageStudioConfig,
	id: string,
	kind: Kind,
): ControlOfKind<Kind> | undefined {
	const control = config.controller.groups
		.flatMap((group) => group.controls)
		.find((candidate) => candidate.id === id)
	if (!control) return undefined
	if (control.kind !== kind) {
		throw new Error(`Image controller의 ${id} control은 ${kind}이어야 합니다.`)
	}
	return control as ControlOfKind<Kind>
}

function record(value: unknown, name: string): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${name}이 객체가 아닙니다.`)
	}
	return value as Record<string, unknown>
}

function assertKeys(value: Record<string, unknown>, allowed: readonly string[]) {
	const allowedKeys = new Set(allowed)
	for (const key of Object.keys(value)) {
		if (!allowedKeys.has(key))
			throw new Error(`ImageStudioConfig에 알 수 없는 필드가 있습니다: ${key}`)
	}
}

function optionalProperty<Key extends string, Value>(key: Key, value: Value | null | undefined) {
	return value == null ? {} : ({ [key]: value } as Record<Key, Value>)
}
