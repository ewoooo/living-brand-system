import {
	IMAGE_BATCH_DEFAULT,
	IMAGE_BATCH_SIZES,
	IMAGE_PROMPT_MAX_LENGTH,
} from '@/features/generate-image/image-generation-limits'
import {
	IMAGE_ASPECT_RATIOS,
	IMAGE_OUTPUT_SIZES,
	supportsImageOutputSize,
} from '@/features/generate-image/image-size'
import type { PublishedImageProfileDefinition } from '@/features/generate-image/repositories/image-profile.payload.repository'
import {
	type ControllerControlDefinition,
	type ControllerGroupDefinition,
	parseStudioControllerConfig,
	type StudioControllerConfig,
} from '@/features/studio-controller/controller-definition'

export const IMAGE_STUDIO_GROUP_IDS = {
	image: 'image',
	profileSettings: 'profile-settings',
	generationSettings: 'generation-settings',
} as const

export const IMAGE_STUDIO_CONTROL_IDS = {
	prompt: 'prompt',
	batch: 'batch',
	ratio: 'ratio',
	resolution: 'resolution',
	lineColor: 'lineColor',
	backgroundColor: 'backgroundColor',
} as const

export type ImageStudioFeature =
	| {
			type: 'color-adjustment'
			controls: { line: string; background?: string }
	  }
	| { type: 'camera-control' }

/** 이미지 프로파일 하나가 발행하는 공통 Controller envelope와 이미지 실행 descriptor. */
export type ImageStudioConfig = StudioControllerConfig<'image', number> & {
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
	const storedController = projectStoredController(profile.controller)
	const storedFeatures = projectStoredFeatures(profile.features)
	const config: ImageStudioConfig = {
		studio: 'image',
		id: profile.id,
		version: 1,
		name: profile.name,
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

	parseStudioControllerConfig(config)
	assertImageControllerLimits(config, profile)
	assertImageFeatures(config)
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
	const resolutionOptions = IMAGE_OUTPUT_SIZES.filter((size) =>
		supportsImageOutputSize(profile.imageModelPreset, size),
	)

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
						IMAGE_BATCH_SIZES.map(String),
						String(IMAGE_BATCH_DEFAULT),
					),
					selectControl(
						IMAGE_STUDIO_CONTROL_IDS.ratio,
						'비율',
						IMAGE_ASPECT_RATIOS,
						profile.aspectRatio,
					),
					selectControl(
						IMAGE_STUDIO_CONTROL_IDS.resolution,
						'해상도',
						resolutionOptions,
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

/** Payload의 row/block 메타데이터를 제거하고 공통 Definition 어휘로 바꾼다. */
function projectStoredController(input: unknown): ImageStudioConfig['controller'] | null {
	if (!input || typeof input !== 'object') return null
	const groups = (input as { groups?: unknown }).groups
	if (groups == null || (Array.isArray(groups) && groups.length === 0)) return null
	if (!Array.isArray(groups)) throw new Error('Image controller groups가 배열이 아닙니다.')

	return {
		groups: groups.map((value) => {
			const group = record(value, 'Image controller group')
			if (!Array.isArray(group.controls)) {
				throw new Error('Image controller controls가 배열이 아닙니다.')
			}
			const collapsible = group.collapsible === true
			return {
				id: group.key as string,
				title: group.title as string,
				controls: group.controls.map(projectStoredControl),
				...(collapsible
					? {
							collapsible: true as const,
							...(typeof group.defaultOpen === 'boolean'
								? { defaultOpen: group.defaultOpen }
								: {}),
						}
					: {}),
			}
		}) as readonly ControllerGroupDefinition[],
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

function projectStoredControl(value: unknown): ControllerControlDefinition {
	const control = record(value, 'Image controller control')
	const base = {
		id: control.key as string,
		label: control.label as string,
		...optionalProperty(
			'availability',
			control.availability as ControllerControlDefinition['availability'],
		),
	}

	switch (control.blockType) {
		case 'text':
			return {
				...base,
				kind: 'text',
				defaultValue: (control.defaultValue ?? null) as string | null,
				...optionalProperty('multiline', control.multiline as boolean | undefined),
				...optionalProperty('maxLength', control.maxLength as number | undefined),
				...optionalProperty('placeholder', control.placeholder as string | undefined),
			}
		case 'toggle':
			return {
				...base,
				kind: 'toggle',
				defaultValue: control.defaultValue as boolean,
			}
		case 'select': {
			const options = control.options
			if (!Array.isArray(options)) throw new Error('Image select options가 배열이 아닙니다.')
			return {
				...base,
				kind: 'select',
				defaultValue: (control.defaultValue ?? null) as string | null,
				options: options.map((option) => {
					const item = record(option, 'Image select option')
					return { label: item.label as string, value: item.value as string }
				}),
				...optionalProperty('placeholder', control.placeholder as string | undefined),
			}
		}
		case 'color':
			return {
				...base,
				kind: 'color',
				defaultValue: (control.defaultValue ?? null) as string | null,
			}
		case 'range': {
			const display = control.display
			return {
				...base,
				kind: 'range',
				defaultValue: control.defaultValue as number,
				min: control.min as number,
				max: control.max as number,
				step: control.step as number,
				...(display && typeof display === 'object'
					? {
							display: {
								...optionalProperty(
									'unit',
									(display as Record<string, unknown>).unit as string | undefined,
								),
								...optionalProperty(
									'precision',
									(display as Record<string, unknown>).precision as
										| number
										| undefined,
								),
							},
						}
					: {}),
			}
		}
		case 'pad': {
			const defaultValue = record(control.defaultValue, 'Image pad defaultValue')
			return {
				...base,
				kind: 'pad',
				defaultValue: { x: defaultValue.x as number, y: defaultValue.y as number },
				...optionalProperty('aspectRatio', control.aspectRatio as number | undefined),
			}
		}
		default:
			throw new Error(`지원하지 않는 Image controller blockType입니다: ${control.blockType}`)
	}
}

function assertImageControllerLimits(
	config: ImageStudioConfig,
	profile: PublishedImageProfileDefinition,
) {
	const { prompt, batch, ratio, resolution } = getImageStudioControls(config)
	if (!prompt.maxLength || prompt.maxLength > IMAGE_PROMPT_MAX_LENGTH) {
		throw new Error(`Image prompt maxLength는 ${IMAGE_PROMPT_MAX_LENGTH} 이하여야 합니다.`)
	}
	assertOptions(batch, IMAGE_BATCH_SIZES.map(String), 'batch')
	assertOptions(ratio, IMAGE_ASPECT_RATIOS, 'ratio')
	assertOptions(
		resolution,
		IMAGE_OUTPUT_SIZES.filter((size) =>
			supportsImageOutputSize(profile.imageModelPreset, size),
		),
		'resolution',
	)
}

function assertImageFeatures(config: ImageStudioConfig) {
	const types = new Set<ImageStudioFeature['type']>()
	for (const feature of config.image.features) {
		if (types.has(feature.type)) {
			throw new Error(`Image feature type이 중복되었습니다: ${feature.type}`)
		}
		types.add(feature.type)
		if (feature.type !== 'color-adjustment') continue
		requireControl(config, feature.controls.line, 'color')
		if (feature.controls.background) {
			requireControl(config, feature.controls.background, 'color')
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

function optionalProperty<Key extends string, Value>(key: Key, value: Value | null | undefined) {
	return value == null ? {} : ({ [key]: value } as Record<Key, Value>)
}
