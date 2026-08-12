'use client'

import {
	createContext,
	type ReactNode,
	type RefObject,
	useContext,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { getGraphicStudioRuntimeBindings } from '@/features/graphic-generation/runtime/graphic-studio-runtime'
import {
	acceptsImagePromptExecution,
	getImageColorAdjustmentControls,
	resolveImagePromptExecution,
} from '@/features/image-generation/domain/image-studio-config'
import { requestImageGeneration } from '@/features/image-generation/services/generate-image.client'
import type { StudioOutputFormat } from '@/features/studio-export/export-contract'
import { useExport } from '@/features/studio-export/hooks/use-export'
import {
	canExportTemplate,
	createTemplateExportRequest,
	supportsTemplateExport,
	type TemplateExportContext,
	type TemplateExportRequest,
} from '@/features/studio-export/services/export-template'
import { createTemplateExportSource } from '@/features/studio-export/services/export-template.client'
import type { ImageTransformValue } from '@/features/template-customization/domain/image-edit-transform'
import {
	findTemplateControl,
	listCompatibleTemplateImageConfigs,
	type PublishedHtmlTemplate,
	partitionTemplateSlots,
	type ResolvedTemplateImageConfig,
	type TemplateBackgroundSlot,
	type TemplateBackgroundType,
	type TemplateConfig,
	type TemplateImageConfigSlot,
	type TemplateTextSlot,
} from '@/features/template-customization/domain/template-config'
import { composeTemplateStudioHtml } from '@/features/template-customization/runtime/template-runtime.client'
import type { GetCreateNavigationOutput } from '@/features/template-customization/services/get-create-navigation.service'
import {
	acceptsControllerDraftValue,
	type ControllerControlDefinition,
	type ControllerControlValue,
	type ControllerRuntimeBindings,
	type ControllerValues,
	createControllerValues,
} from '@/modules/studio-controller/controller-definition'

const GENERATION_ERROR_MESSAGE = '이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'
const PINNED_CONFIG_ERROR_MESSAGE = '고정된 이미지 프로파일을 사용할 수 없습니다.'
const SELECTABLE_CONFIG_ERROR_MESSAGE = '사용 가능한 이미지 프로파일이 없습니다.'

/** 이미지 슬롯 하나의 입력·요청·결과 상태. 슬롯 단위를 쪼개지 않고 한 객체로 흐른다. */
export type TemplateImageSlotState = {
	profileId?: number
	prompt: string
	generating: boolean
	error: string | null
	featureValues: ControllerValues
	/** 생성으로 배정된 이미지 — 없으면 슬롯은 저작 이미지 그대로다(transform도 잠긴다). */
	image?: { backgroundImage: string; generatedImageId: number; profileId: number }
	transform?: ImageTransformValue
}

export type TemplateImageSlotPatch = Partial<Pick<TemplateImageSlotState, 'prompt' | 'transform'>>

/** 캔버스 배경 하나의 입력·요청·결과 상태. */
export type TemplateBackgroundState = {
	type: TemplateBackgroundType
	imageMode: 'preset' | 'generate'
	color: string | null
	profileId?: number
	prompt: string
	generating: boolean
	error: string | null
	featureValues: ControllerValues
	graphicConfigId?: string
	graphicValues: ControllerValues
	/** 생성으로 깔린 배경 이미지 — type=image일 때만 합성된다. */
	image?: { url: string; generatedImageId: number }
}

export type TemplateBackgroundPatch = Partial<Pick<TemplateBackgroundState, 'imageMode' | 'prompt'>>

type TemplateStudioValue = {
	navigation: GetCreateNavigationOutput
	/** 템플릿 편집 계약 — Sidebar와 Canvas는 이 객체와 세션 state만 소비한다. */
	config: TemplateConfig
	text: {
		values: Record<string, string>
		setValue: (slotId: string, text: string) => void
		color: string | null
		setColor: (hex: string | null) => void
		clippedSlotIds: ReadonlySet<string>
	}
	images: {
		states: Record<string, TemplateImageSlotState>
		contracts: Record<string, readonly ResolvedTemplateImageConfig[]>
		update: (slotId: string, patch: TemplateImageSlotPatch) => void
		updateFeature: (slotId: string, controlId: string, value: ControllerControlValue) => void
		selectProfile: (slotId: string, profileId: number) => void
		generate: (slotId: string) => Promise<void>
	}
	background: {
		state: TemplateBackgroundState
		contracts: readonly ResolvedTemplateImageConfig[]
		graphicConfigs: readonly GraphicStudioConfig[]
		graphicBindings: ControllerRuntimeBindings
		update: (patch: TemplateBackgroundPatch) => void
		setColor: (hex: string | null) => void
		selectType: (value: ControllerControlValue) => void
		updateFeature: (controlId: string, value: ControllerControlValue) => void
		selectImageProfile: (profileId: number) => void
		selectGraphicConfig: (configId: string) => void
		updateGraphic: (controlId: string, value: ControllerControlValue) => void
		generate: () => Promise<void>
	}
	canvas: {
		html: string
		previewRef: RefObject<HTMLDivElement | null>
	}
	exporting: {
		formats: readonly StudioOutputFormat[]
		format: StudioOutputFormat | null
		setFormat: (format: StudioOutputFormat) => void
		busy: boolean
		error: string | null
		run: (format: StudioOutputFormat) => void
	}
}

const TemplateStudioContext = createContext<TemplateStudioValue | null>(null)

/**
 * Template 편집 세션의 단일 소유자. Sidebar와 Canvas는 서로를 모르고 이 Context만 소비한다.
 * Image Config는 서버 계약을 슬롯 범위에서 좁혀 쓰고 Graphic Config는 순수 runtime adapter로 투영한다.
 * 생성 HTTP와 모든 배경·슬롯 세션 상태도 여기서 소유한다.
 * compose는 항상 불변 published template.html에서 다시 실행하므로 같은 세션 값을 반복 적용해도 누적되지 않는다.
 */
export function TemplateStudioProvider({
	config,
	template,
	navigation,
	children,
}: {
	config: TemplateConfig
	template: PublishedHtmlTemplate
	navigation: GetCreateNavigationOutput
	children: ReactNode
}) {
	const previewRef = useRef<HTMLDivElement>(null)
	const { html, width, height } = template
	const slots = config.template.slots
	const partitionedSlots = useMemo(() => partitionTemplateSlots(slots), [slots])
	const textSlots = partitionedSlots.text
	const imageSlots = partitionedSlots.image
	const backgroundSlot = partitionedSlots.background
	const textColorDefinition = config.template.textColorControlId
		? findTemplateControl(config, config.template.textColorControlId)
		: undefined
	const backgroundTypeDefinition = backgroundSlot
		? findTemplateControl(config, backgroundSlot.typeControlId)
		: undefined
	const backgroundColorDefinition = backgroundSlot
		? findTemplateControl(config, backgroundSlot.colorControlId)
		: undefined
	const [textValues, setTextValues] = useState<Record<string, string>>(() =>
		initialTemplateTextValues(config, textSlots),
	)
	const [textColor, setTextColor] = useState<string | null>(() =>
		textColorDefinition?.kind === 'color' ? textColorDefinition.defaultValue : null,
	)
	const [clippedSlotIds, setClippedSlotIds] = useState<ReadonlySet<string>>(new Set())
	const effectiveExportFormats = config.output.formats.filter((candidate) =>
		supportsTemplateExport(candidate, {
			fileName: template.name,
			height,
			html,
			printPpi: template.printPpi,
			templateId: template.id,
			templateVersion: template.templateVersion,
			width,
		}),
	)
	const [format, setFormat] = useState<StudioOutputFormat | null>(
		effectiveExportFormats[0] ?? null,
	)
	const imageContracts = useMemo(
		() =>
			Object.fromEntries(
				imageSlots.map((slot) => [
					slot.id,
					listCompatibleTemplateImageConfigs(slot, config.template.imageConfigs),
				]),
			),
		[imageSlots, config.template.imageConfigs],
	)
	const backgroundContracts = useMemo(
		() =>
			backgroundSlot
				? listCompatibleTemplateImageConfigs(
						backgroundSlot,
						config.template.imageConfigs,
						config.template.exportOption.canvas,
					)
				: [],
		[backgroundSlot, config.template.imageConfigs, config.template.exportOption.canvas],
	)

	const [imageStates, setImageStates] = useState<Record<string, TemplateImageSlotState>>(() =>
		Object.fromEntries(
			imageSlots.map((slot) => [
				slot.id,
				initialImageState(slot, imageContracts[slot.id] ?? []),
			]),
		),
	)
	const [background, setBackground] = useState<TemplateBackgroundState>(() =>
		initialBackgroundState(config, backgroundSlot, backgroundContracts),
	)
	const selectedGraphicConfig = config.template.graphicConfigs.find(
		(candidate) => candidate.id === background.graphicConfigId,
	)
	const graphicBindings = selectedGraphicConfig
		? getGraphicStudioRuntimeBindings(
				selectedGraphicConfig,
				config.template.exportOption.canvas,
			)
		: {}

	function updateImageState(slotId: string, patch: Partial<TemplateImageSlotState>) {
		setImageStates((current) => {
			const slot = imageSlots.find((candidate) => candidate.id === slotId)
			if (!slot) return current
			const previous =
				current[slotId] ?? initialImageState(slot, imageContracts[slotId] ?? [])
			return { ...current, [slotId]: { ...previous, ...patch } }
		})
	}

	function updateImageFeature(slotId: string, controlId: string, next: ControllerControlValue) {
		setImageStates((current) => {
			const previous = current[slotId]
			if (!previous) return current
			const contract = imageContracts[slotId]?.find(
				(candidate) => candidate.config.id === previous.profileId,
			)
			const color = contract ? getImageColorAdjustmentControls(contract.config) : null
			const definition = [color?.line, color?.background].find(
				(control) => control?.id === controlId,
			)
			if (!definition || !acceptsControllerDraftValue(definition, next)) return current
			return {
				...current,
				[slotId]: {
					...previous,
					featureValues: { ...previous.featureValues, [controlId]: next },
				},
			}
		})
	}

	async function generateImage(slotId: string) {
		const state = imageStates[slotId]
		const contract = imageContracts[slotId]?.find(
			(candidate) => candidate.config.id === state?.profileId,
		)
		const prompt = state?.prompt ?? ''
		if (!state || state.generating || !contract || !validPrompt(prompt, contract)) return
		const requestProfileId = contract.config.id
		updateImageState(slotId, { generating: true, error: null })
		const generated = await requestTemplateImageGeneration(prompt, contract)
		setImageStates((current) =>
			applyImageRequestResult(
				current,
				slotId,
				requestProfileId,
				generated
					? {
							image: {
								backgroundImage: generated.url,
								generatedImageId: generated.id,
								profileId: requestProfileId,
							},
						}
					: { error: GENERATION_ERROR_MESSAGE },
			),
		)
		updateImageState(slotId, { generating: false })
	}

	async function generateBackground() {
		const contract = backgroundContracts.find(
			(candidate) => candidate.config.id === background.profileId,
		)
		const prompt = background.prompt
		if (background.generating || !contract || !validPrompt(prompt, contract)) return
		setBackground((current) => ({ ...current, generating: true, error: null }))
		const generated = await requestTemplateImageGeneration(prompt, contract)
		setBackground((current) => ({
			...current,
			generating: false,
			...(generated
				? { image: { url: generated.url, generatedImageId: generated.id } }
				: { error: GENERATION_ERROR_MESSAGE }),
		}))
	}

	const deferredTextColor = useDeferredValue(textColor)
	const deferredImageStates = useDeferredValue(imageStates)
	const deferredBackground = useDeferredValue(background)

	const composedHtml = useMemo(
		() =>
			composeTemplateStudioHtml({
				html,
				textSlots,
				textValues,
				textColor: deferredTextColor,
				imageStates: deferredImageStates,
				imageSlots,
				imageContracts,
				background: deferredBackground,
				graphicConfigs: config.template.graphicConfigs,
				width,
				height,
			}),
		[
			html,
			textSlots,
			textValues,
			deferredTextColor,
			deferredImageStates,
			deferredBackground,
			config.template.graphicConfigs,
			imageSlots,
			imageContracts,
			width,
			height,
		],
	)

	// biome-ignore lint/correctness/useExhaustiveDependencies: 측정 대상 DOM이 html·textValues로 합성된 결과다.
	useEffect(() => {
		const container = previewRef.current
		if (!container) return
		const clipped = new Set<string>()
		for (const slot of textSlots) {
			const element = container.querySelector(`[data-node-id="${slot.id}"]`)
			if (element && element.scrollHeight > element.clientHeight + 1) clipped.add(slot.id)
		}
		setClippedSlotIds(clipped)
	}, [html, textSlots, textValues])

	const exportContext: TemplateExportContext = {
		fileName: template.name,
		height,
		html: composedHtml,
		printPpi: template.printPpi,
		templateId: template.id,
		templateVersion: template.templateVersion,
		width,
		output: config.output,
		controller: {
			groups: config.controller.groups,
			values: templateControllerValues(config, textSlots, textValues, textColor, background),
		},
	}
	const templateExport = useExport<TemplateExportRequest>({
		capability: config.output,
		canExport: (request) => canExportTemplate(request, exportContext),
		source: createTemplateExportSource(exportContext),
	})

	const value: TemplateStudioValue = {
		navigation,
		config,
		text: {
			values: textValues,
			setValue: (slotId, next) =>
				setTextValues((current) =>
					updateTemplateText(current, config, textSlots, slotId, next),
				),
			color: textColor,
			setColor: (next) =>
				setTextColor((current) => updateTemplateColor(current, textColorDefinition, next)),
			clippedSlotIds,
		},
		images: {
			states: imageStates,
			contracts: imageContracts,
			update: (slotId, patch) =>
				setImageStates((current) =>
					updateTemplateImageSlot(current, slotId, patch, imageContracts[slotId] ?? []),
				),
			updateFeature: updateImageFeature,
			selectProfile: (slotId, profileId) =>
				setImageStates((current) =>
					selectImageProfile(
						current,
						slotId,
						profileId,
						imageContracts[slotId] ?? [],
						imageSlots.find((slot) => slot.id === slotId)?.featureOverrides,
					),
				),
			generate: generateImage,
		},
		background: {
			state: background,
			contracts: backgroundContracts,
			graphicConfigs: config.template.graphicConfigs,
			graphicBindings,
			update: (patch) =>
				setBackground((current) =>
					updateTemplateBackground(current, patch, backgroundContracts),
				),
			setColor: (next) =>
				setBackground((current) =>
					updateTemplateBackgroundColor(current, backgroundColorDefinition, next),
				),
			selectType: (next) =>
				setBackground((current) =>
					selectBackgroundType(current, backgroundTypeDefinition, next),
				),
			// 배경 compose에 feature color 경로가 없으므로 runtime binding과 action을 함께 잠근다.
			updateFeature: () => {},
			selectImageProfile: (profileId) =>
				setBackground((current) =>
					selectBackgroundImageProfile(current, profileId, backgroundContracts),
				),
			selectGraphicConfig: (configId) =>
				setBackground((current) =>
					selectBackgroundGraphicConfig(
						current,
						configId,
						config.template.graphicConfigs,
					),
				),
			updateGraphic: (controlId, next) =>
				setBackground((current) =>
					updateBackgroundGraphic(
						current,
						controlId,
						next,
						config.template.graphicConfigs,
						config.template.exportOption.canvas,
					),
				),
			generate: generateBackground,
		},
		canvas: { html: composedHtml, previewRef },
		exporting: {
			formats: effectiveExportFormats,
			format,
			setFormat: (next) => {
				if (effectiveExportFormats.includes(next)) setFormat(next)
			},
			busy: templateExport.exporting !== null,
			error: templateExport.error,
			run: (next) => {
				const request = createTemplateExportRequest(next, template.printPpi)
				if (request) void templateExport.run(request)
			},
		},
	}

	return <TemplateStudioContext.Provider value={value}>{children}</TemplateStudioContext.Provider>
}

async function requestTemplateImageGeneration(
	prompt: string,
	contract: ResolvedTemplateImageConfig,
) {
	try {
		const result = await requestImageGeneration({
			prompt: resolvedPrompt(prompt, contract),
			count: 1,
			profileId: contract.config.id,
			aspectRatio: contract.ratio.defaultValue,
			imageSize: contract.imageSize,
		})
		return result.generatedImages?.[0]
	} catch (requestError) {
		console.error(requestError)
		return undefined
	}
}

function selectImageProfile(
	current: Record<string, TemplateImageSlotState>,
	slotId: string,
	profileId: number,
	contracts: readonly ResolvedTemplateImageConfig[],
	overrides: TemplateImageConfigSlot['featureOverrides'] | undefined,
) {
	const previous = current[slotId]
	const contract = contracts.find((candidate) => candidate.config.id === profileId)
	if (!previous || previous.generating || !contract) return current
	return {
		...current,
		[slotId]: {
			...previous,
			profileId,
			prompt: contract.prompt.defaultValue ?? '',
			featureValues: initialFeatureValues(contract, overrides),
			error: null,
		},
	}
}

function initialTemplateTextValues(
	config: TemplateConfig,
	slots: readonly TemplateTextSlot[],
): Record<string, string> {
	return Object.fromEntries(
		slots.map((slot) => {
			const definition = findTemplateControl(config, slot.controlId)
			return [slot.id, definition?.kind === 'text' ? (definition.defaultValue ?? '') : '']
		}),
	)
}

function updateTemplateText(
	current: Record<string, string>,
	config: TemplateConfig,
	slots: readonly TemplateTextSlot[],
	slotId: string,
	next: string,
): Record<string, string> {
	const slot = slots.find((candidate) => candidate.id === slotId)
	const definition = slot ? findTemplateControl(config, slot.controlId) : undefined
	return definition?.kind === 'text' && acceptsControllerDraftValue(definition, next)
		? { ...current, [slotId]: next }
		: current
}

function updateTemplateColor(
	current: string | null,
	definition: ControllerControlDefinition | undefined,
	next: string | null,
): string | null {
	return definition?.kind === 'color' && acceptsControllerDraftValue(definition, next)
		? next
		: current
}

function updateTemplateBackgroundColor(
	current: TemplateBackgroundState,
	definition: ControllerControlDefinition | undefined,
	next: string | null,
): TemplateBackgroundState {
	const color = updateTemplateColor(current.color, definition, next)
	return color === current.color ? current : { ...current, color }
}

function updateTemplateImageSlot(
	current: Record<string, TemplateImageSlotState>,
	slotId: string,
	patch: TemplateImageSlotPatch,
	contracts: readonly ResolvedTemplateImageConfig[],
) {
	const previous = current[slotId]
	if (!previous) return current
	const contract = contracts.find((candidate) => candidate.config.id === previous.profileId)
	const prompt =
		typeof patch.prompt === 'string' &&
		contract &&
		acceptsControllerDraftValue(contract.prompt, patch.prompt)
			? patch.prompt
			: undefined
	return {
		...current,
		[slotId]: {
			...previous,
			...(prompt === undefined ? {} : { prompt }),
			...(patch.transform === undefined ? {} : { transform: patch.transform }),
		},
	}
}

function applyImageRequestResult(
	current: Record<string, TemplateImageSlotState>,
	slotId: string,
	requestProfileId: number,
	patch: Partial<Pick<TemplateImageSlotState, 'image' | 'error'>>,
) {
	const previous = current[slotId]
	if (!previous || previous.profileId !== requestProfileId) return current
	return { ...current, [slotId]: { ...previous, ...patch } }
}

function updateTemplateBackground(
	current: TemplateBackgroundState,
	patch: TemplateBackgroundPatch,
	contracts: readonly ResolvedTemplateImageConfig[],
): TemplateBackgroundState {
	const contract = contracts.find((candidate) => candidate.config.id === current.profileId)
	const prompt =
		typeof patch.prompt === 'string' &&
		contract &&
		acceptsControllerDraftValue(contract.prompt, patch.prompt)
			? patch.prompt
			: undefined
	return {
		...current,
		...(patch.imageMode === undefined ? {} : { imageMode: patch.imageMode }),
		...(prompt === undefined ? {} : { prompt }),
	}
}

function selectBackgroundType(
	current: TemplateBackgroundState,
	definition: ControllerControlDefinition | undefined,
	next: ControllerControlValue,
): TemplateBackgroundState {
	if (
		definition?.kind !== 'select' ||
		typeof next !== 'string' ||
		!isBackgroundType(next) ||
		!acceptsControllerDraftValue(definition, next)
	) {
		return current
	}
	return { ...current, type: next }
}

function selectBackgroundImageProfile(
	current: TemplateBackgroundState,
	profileId: number,
	contracts: readonly ResolvedTemplateImageConfig[],
): TemplateBackgroundState {
	const contract = contracts.find((candidate) => candidate.config.id === profileId)
	if (!contract || current.generating) return current
	return {
		...current,
		profileId,
		prompt: contract.prompt.defaultValue ?? '',
		featureValues: initialFeatureValues(contract),
		error: null,
	}
}

function selectBackgroundGraphicConfig(
	current: TemplateBackgroundState,
	configId: string,
	configs: readonly GraphicStudioConfig[],
): TemplateBackgroundState {
	const config = configs.find((candidate) => candidate.id === configId)
	if (!config) return current
	return {
		...current,
		graphicConfigId: config.id,
		graphicValues: createControllerValues(config.controller.groups),
	}
}

function updateBackgroundGraphic(
	current: TemplateBackgroundState,
	controlId: string,
	next: ControllerControlValue,
	configs: readonly GraphicStudioConfig[],
	viewport: { width: number; height: number },
): TemplateBackgroundState {
	const config = configs.find((candidate) => candidate.id === current.graphicConfigId)
	if (!config) return current
	const definition = config.controller.groups
		.flatMap((group) => group.controls)
		.find((control) => control.id === controlId)
	const binding = getGraphicStudioRuntimeBindings(config, viewport)[controlId]
	if (!definition || !acceptsControllerDraftValue(definition, next, binding)) {
		return current
	}
	return {
		...current,
		graphicValues: { ...current.graphicValues, [controlId]: next },
	}
}

function templateControllerValues(
	config: TemplateConfig,
	textSlots: readonly TemplateTextSlot[],
	textValues: Readonly<Record<string, string>>,
	textColor: string | null,
	background: TemplateBackgroundState,
): ControllerValues {
	const values = createControllerValues(config.controller.groups)
	for (const slot of textSlots) {
		if (textValues[slot.id] !== undefined) values[slot.controlId] = textValues[slot.id]
	}
	if (config.template.textColorControlId) {
		values[config.template.textColorControlId] = textColor
	}
	const backgroundSlot = partitionTemplateSlots(config.template.slots).background
	if (backgroundSlot) {
		values[backgroundSlot.typeControlId] = background.type
		values[backgroundSlot.colorControlId] = background.color
	}
	return values
}

function initialImageState(
	slot: TemplateImageConfigSlot,
	contracts: readonly ResolvedTemplateImageConfig[],
): TemplateImageSlotState {
	const profileId =
		slot.imageConfig.mode === 'pinned' ? slot.imageConfig.configId : contracts[0]?.config.id
	return {
		profileId,
		prompt:
			contracts.find((contract) => contract.config.id === profileId)?.prompt.defaultValue ??
			'',
		generating: false,
		featureValues: initialFeatureValues(
			contracts.find((contract) => contract.config.id === profileId),
			slot.featureOverrides,
		),
		error:
			contracts.length > 0
				? null
				: slot.imageConfig.mode === 'pinned'
					? PINNED_CONFIG_ERROR_MESSAGE
					: SELECTABLE_CONFIG_ERROR_MESSAGE,
	}
}

function initialBackgroundState(
	config: TemplateConfig,
	slot: TemplateBackgroundSlot | undefined,
	contracts: readonly ResolvedTemplateImageConfig[],
): TemplateBackgroundState {
	const typeControl = slot ? findTemplateControl(config, slot.typeControlId) : undefined
	const colorControl = slot ? findTemplateControl(config, slot.colorControlId) : undefined
	const type =
		typeControl?.kind === 'select' && isBackgroundType(typeControl.defaultValue)
			? typeControl.defaultValue
			: 'color'
	return {
		type,
		imageMode: 'preset',
		color: colorControl?.kind === 'color' ? colorControl.defaultValue : null,
		profileId: contracts[0]?.config.id,
		prompt: contracts[0]?.prompt.defaultValue ?? '',
		generating: false,
		featureValues: initialFeatureValues(contracts[0]),
		graphicConfigId: config.template.graphicConfigs[0]?.id,
		graphicValues: config.template.graphicConfigs[0]
			? createControllerValues(config.template.graphicConfigs[0].controller.groups)
			: {},
		error: contracts.length > 0 ? null : SELECTABLE_CONFIG_ERROR_MESSAGE,
	}
}

function initialFeatureValues(
	contract: ResolvedTemplateImageConfig | undefined,
	overrides?: TemplateImageConfigSlot['featureOverrides'],
): ControllerValues {
	if (!contract) return {}
	const values = createControllerValues(contract.config.controller.groups)
	const color = getImageColorAdjustmentControls(contract.config)
	const override = overrides?.colorAdjustment
	if (!color || !override) return values
	return {
		...values,
		...(acceptsControllerDraftValue(color.line, override.line)
			? { [color.line.id]: override.line }
			: {}),
		...(color.background &&
		override.background &&
		acceptsControllerDraftValue(color.background, override.background)
			? { [color.background.id]: override.background }
			: {}),
	}
}

function validPrompt(prompt: string, contract: ResolvedTemplateImageConfig) {
	return acceptsImagePromptExecution(contract.prompt, prompt)
}

function resolvedPrompt(prompt: string, contract: ResolvedTemplateImageConfig) {
	return resolveImagePromptExecution(contract.prompt, prompt)
}

function isBackgroundType(value: string | null): value is TemplateBackgroundType {
	return value === 'color' || value === 'image' || value === 'graphic'
}

export function useTemplateStudio() {
	const context = useContext(TemplateStudioContext)
	if (!context) {
		throw new Error('useTemplateStudio는 TemplateStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
}
