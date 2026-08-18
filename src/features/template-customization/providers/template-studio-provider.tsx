'use client'

import {
	type ReactNode,
	type RefObject,
	useCallback,
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
	getImageStudioFeatureControlIds,
	resolveImagePromptExecution,
} from '@/features/image-generation/domain/image-studio-config'
import { requestImageGeneration } from '@/features/image-generation/services/generate-image.client'
import { composeTemplateHtml } from '@/features/template-core/runtime/compose-template-html.client'
import {
	type TemplateBackgroundPatch,
	type TemplateBackgroundState,
	type TemplateImageSlotPatch,
	type TemplateImageSlotState,
	TemplateStudioContext,
	type TemplateStudioValue,
} from '@/features/template-customization/contexts/template-studio-context'
import {
	findTemplateControl,
	listCompatibleTemplateImageConfigs,
	type PublishedTemplateView,
	partitionTemplateSlots,
	type ResolvedTemplateImageConfig,
	type TemplateBackgroundSlot,
	type TemplateBackgroundType,
	type TemplateImageConfigSlot,
	type TemplateStudioConfig,
	type TemplateTextSlot,
	type TemplateVectorSlot,
} from '@/features/template-customization/domain/template-studio-config'
import {
	composeTemplateStudioHtml,
	createTemplateRasterArtifact,
	type TemplateRasterArtifact,
} from '@/features/template-customization/runtime/template-runtime.client'
import { fetchCreateNavigation } from '@/features/template-customization/services/get-create-navigation.client'
import { useLazyResource } from '@/hooks/use-lazy-resource'
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

function useTemplateTextSession(
	config: TemplateStudioConfig,
	textSlots: readonly TemplateTextSlot[],
	html: string,
	previewRef: RefObject<HTMLDivElement | null>,
): TemplateStudioValue['text'] {
	const colorDefinition = config.template.textColorControlId
		? findTemplateControl(config, config.template.textColorControlId)
		: undefined
	const [values, setValues] = useState<Record<string, string>>(() =>
		initialTemplateTextValues(config, textSlots),
	)
	const [color, setColor] = useState<string | null>(() =>
		colorDefinition?.kind === 'color' ? colorDefinition.defaultValue : null,
	)
	const [clippedSlotIds, setClippedSlotIds] = useState<ReadonlySet<string>>(new Set())
	const setValue = useCallback(
		(slotId: string, next: string) =>
			setValues((current) => updateTemplateText(current, config, textSlots, slotId, next)),
		[config, textSlots],
	)
	const updateColor = useCallback(
		(next: string | null) =>
			setColor((current) => updateTemplateColor(current, colorDefinition, next)),
		[colorDefinition],
	)

	// biome-ignore lint/correctness/useExhaustiveDependencies: 측정 대상 DOM이 html·values로 합성된 결과다.
	useEffect(() => {
		const container = previewRef.current
		if (!container) return
		const clipped = new Set<string>()
		for (const slot of textSlots) {
			const element = container.querySelector(`[data-node-id="${slot.id}"]`)
			if (element && element.scrollHeight > element.clientHeight + 1) clipped.add(slot.id)
		}
		setClippedSlotIds(clipped)
	}, [html, previewRef, textSlots, values])

	return useMemo(
		() => ({ values, setValue, color, setColor: updateColor, clippedSlotIds }),
		[clippedSlotIds, color, setValue, updateColor, values],
	)
}

function useTemplateImageSession(
	config: TemplateStudioConfig,
	imageSlots: readonly TemplateImageConfigSlot[],
): TemplateStudioValue['images'] {
	const contracts = useMemo(
		() =>
			Object.fromEntries(
				imageSlots.map((slot) => [
					slot.id,
					listCompatibleTemplateImageConfigs(slot, config.template.imageConfigs),
				]),
			),
		[config.template.imageConfigs, imageSlots],
	)
	const [states, setStates] = useState<Record<string, TemplateImageSlotState>>(() =>
		Object.fromEntries(
			imageSlots.map((slot) => [slot.id, initialImageState(slot, contracts[slot.id] ?? [])]),
		),
	)
	const updateState = useCallback(
		(slotId: string, patch: Partial<TemplateImageSlotState>) => {
			setStates((current) => {
				const slot = imageSlots.find((candidate) => candidate.id === slotId)
				if (!slot) return current
				const previous = current[slotId] ?? initialImageState(slot, contracts[slotId] ?? [])
				return { ...current, [slotId]: { ...previous, ...patch } }
			})
		},
		[contracts, imageSlots],
	)
	const update = useCallback(
		(slotId: string, patch: TemplateImageSlotPatch) =>
			setStates((current) =>
				updateTemplateImageSlot(current, slotId, patch, contracts[slotId] ?? []),
			),
		[contracts],
	)
	const updateFeature = useCallback(
		(slotId: string, controlId: string, next: ControllerControlValue) => {
			setStates((current) => {
				const previous = current[slotId]
				if (!previous) return current
				const contract = contracts[slotId]?.find(
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
		},
		[contracts],
	)
	const selectProfile = useCallback(
		(slotId: string, profileId: number) =>
			setStates((current) =>
				selectImageProfile(
					current,
					slotId,
					profileId,
					contracts[slotId] ?? [],
					imageSlots.find((slot) => slot.id === slotId)?.featureOverrides,
				),
			),
		[contracts, imageSlots],
	)
	const generate = useCallback(
		async (slotId: string) => {
			const state = states[slotId]
			const contract = contracts[slotId]?.find(
				(candidate) => candidate.config.id === state?.profileId,
			)
			const prompt = state?.prompt ?? ''
			if (!state || state.generating || !contract || !validPrompt(prompt, contract)) return
			const requestProfileId = contract.config.id
			updateState(slotId, { generating: true, error: null })
			const generated = await requestTemplateImageGeneration(prompt, contract)
			setStates((current) =>
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
			updateState(slotId, { generating: false })
		},
		[contracts, states, updateState],
	)

	return useMemo(
		() => ({ states, contracts, update, updateFeature, selectProfile, generate }),
		[contracts, generate, selectProfile, states, update, updateFeature],
	)
}

function useTemplateVectorSession(
	vectorSlots: readonly TemplateVectorSlot[],
): TemplateStudioValue['vectors'] {
	const [colors, setColors] = useState<Record<string, string | undefined>>(() =>
		Object.fromEntries(vectorSlots.map((slot) => [slot.id, slot.color])),
	)
	const setColor = useCallback(
		(slotId: string, color: string) =>
			setColors((current) => {
				const slot = vectorSlots.find((candidate) => candidate.id === slotId)
				return slot?.access === 'editable' ? { ...current, [slotId]: color } : current
			}),
		[vectorSlots],
	)
	return useMemo(
		() => ({ slots: vectorSlots, colors, setColor }),
		[colors, setColor, vectorSlots],
	)
}

function useTemplateLayerSession(
	slots: readonly (TemplateTextSlot | TemplateImageConfigSlot | TemplateVectorSlot)[],
): TemplateStudioValue['layers'] {
	const [visibility, setVisibility] = useState<Record<string, boolean>>(() =>
		Object.fromEntries(slots.map((slot) => [slot.id, slot.visibility.defaultVisible])),
	)
	const setVisible = useCallback(
		(slotId: string, visible: boolean) =>
			setVisibility((current) => {
				const slot = slots.find((candidate) => candidate.id === slotId)
				return slot?.access === 'editable' && slot.visibility.allowToggle
					? { ...current, [slotId]: visible }
					: current
			}),
		[slots],
	)
	return useMemo(() => ({ visibility, setVisible }), [setVisible, visibility])
}

function useTemplateBackgroundSession(
	config: TemplateStudioConfig,
	slot: TemplateBackgroundSlot | undefined,
): TemplateStudioValue['background'] {
	const contracts = useMemo(
		() =>
			slot
				? listCompatibleTemplateImageConfigs(
						slot,
						config.template.imageConfigs,
						config.template.exportOption.canvas,
					)
				: [],
		[config.template.exportOption.canvas, config.template.imageConfigs, slot],
	)
	const [state, setState] = useState<TemplateBackgroundState>(() =>
		initialBackgroundState(config, slot, contracts),
	)
	const typeDefinition = slot ? findTemplateControl(config, slot.typeControlId) : undefined
	const colorDefinition = slot ? findTemplateControl(config, slot.colorControlId) : undefined
	const selectedContract = contracts.find((candidate) => candidate.config.id === state.profileId)
	const featureBindings = useMemo(
		() => getBackgroundFeatureBindings(selectedContract),
		[selectedContract],
	)
	const selectedGraphicConfig = config.template.graphicConfigs.find(
		(candidate) => candidate.id === state.graphicConfigId,
	)
	const graphicBindings = useMemo(
		() =>
			selectedGraphicConfig
				? getGraphicStudioRuntimeBindings(
						selectedGraphicConfig,
						config.template.exportOption.canvas,
					)
				: {},
		[config.template.exportOption.canvas, selectedGraphicConfig],
	)
	const update = useCallback(
		(patch: TemplateBackgroundPatch) =>
			setState((current) => updateTemplateBackground(current, patch, contracts)),
		[contracts],
	)
	const setColor = useCallback(
		(next: string | null) =>
			setState((current) => updateTemplateBackgroundColor(current, colorDefinition, next)),
		[colorDefinition],
	)
	const selectType = useCallback(
		(next: ControllerControlValue) =>
			setState((current) => selectBackgroundType(current, typeDefinition, next)),
		[typeDefinition],
	)
	const updateFeature = useCallback(
		(controlId: string, next: ControllerControlValue) =>
			setState((current) => updateBackgroundFeature(current, controlId, next, contracts)),
		[contracts],
	)
	const selectImageProfile = useCallback(
		(profileId: number) =>
			setState((current) => selectBackgroundImageProfile(current, profileId, contracts)),
		[contracts],
	)
	const selectGraphicConfig = useCallback(
		(configId: string) =>
			setState((current) =>
				selectBackgroundGraphicConfig(current, configId, config.template.graphicConfigs),
			),
		[config.template.graphicConfigs],
	)
	const updateGraphic = useCallback(
		(controlId: string, next: ControllerControlValue) =>
			setState((current) =>
				updateBackgroundGraphic(
					current,
					controlId,
					next,
					config.template.graphicConfigs,
					config.template.exportOption.canvas,
				),
			),
		[config.template.exportOption.canvas, config.template.graphicConfigs],
	)
	const generate = useCallback(async () => {
		const contract = contracts.find((candidate) => candidate.config.id === state.profileId)
		const prompt = state.prompt
		if (state.generating || !contract || !validPrompt(prompt, contract)) return
		setState((current) => ({ ...current, generating: true, error: null }))
		const generated = await requestTemplateImageGeneration(prompt, contract)
		setState((current) => ({
			...current,
			generating: false,
			...(generated
				? { image: { url: generated.url, generatedImageId: generated.id } }
				: { error: GENERATION_ERROR_MESSAGE }),
		}))
	}, [contracts, state])

	return useMemo(
		() => ({
			state,
			contracts,
			featureBindings,
			graphicConfigs: config.template.graphicConfigs,
			graphicBindings,
			update,
			setColor,
			selectType,
			updateFeature,
			selectImageProfile,
			selectGraphicConfig,
			updateGraphic,
			generate,
		}),
		[
			config.template.graphicConfigs,
			contracts,
			featureBindings,
			generate,
			graphicBindings,
			selectGraphicConfig,
			selectImageProfile,
			selectType,
			setColor,
			state,
			update,
			updateFeature,
			updateGraphic,
		],
	)
}

/**
 * Template 편집 세션의 단일 소유자. Sidebar와 Canvas는 서로를 모르고 이 Context만 소비한다.
 * Image Config는 서버 계약을 슬롯 범위에서 좁혀 쓰고 Graphic Config는 순수 runtime adapter로 투영한다.
 * 생성 HTTP와 모든 배경·슬롯 세션 상태도 여기서 소유한다.
 * compose는 항상 불변 published template.html에서 다시 실행하므로 같은 세션 값을 반복 적용해도 누적되지 않는다.
 */
export function TemplateStudioProvider({
	config,
	template,
	categoryTitle,
	children,
}: {
	config: TemplateStudioConfig
	template: PublishedTemplateView
	categoryTitle: string | null
	children: ReactNode
}) {
	// 교체 후보 목록은 자산 브라우저가 열릴 때 가져온다 — 페이지는 현재 카테고리 이름 하나만 싣는다.
	const templateBrowse = useLazyResource(fetchCreateNavigation)
	const navigation = useMemo<TemplateStudioValue['navigation']>(
		() => ({ categoryTitle, browse: templateBrowse }),
		[categoryTitle, templateBrowse],
	)
	const previewRef = useRef<HTMLDivElement>(null)
	const graphicFrameRef = useRef<(() => string) | null>(null)
	const registerGraphicFrame = useCallback((capture: (() => string) | null) => {
		graphicFrameRef.current = capture
	}, [])
	const { html, width, height } = template
	const slots = config.template.slots
	const partitionedSlots = useMemo(() => partitionTemplateSlots(slots), [slots])
	const textSlots = partitionedSlots.text
	const imageSlots = partitionedSlots.image
	const vectorSlots = partitionedSlots.vector
	const backgroundSlot = partitionedSlots.background
	const editableSlots = useMemo(
		() => [...textSlots, ...imageSlots, ...vectorSlots],
		[imageSlots, textSlots, vectorSlots],
	)
	const text = useTemplateTextSession(config, textSlots, html, previewRef)
	const images = useTemplateImageSession(config, imageSlots)
	const vectors = useTemplateVectorSession(vectorSlots)
	const layers = useTemplateLayerSession(editableSlots)
	const background = useTemplateBackgroundSession(config, backgroundSlot)
	const deferredTextColor = useDeferredValue(text.color)
	const deferredImageStates = useDeferredValue(images.states)
	const deferredVectorColors = useDeferredValue(vectors.colors)
	const deferredLayerVisibility = useDeferredValue(layers.visibility)
	const deferredBackground = useDeferredValue(background.state)

	const composedHtml = useMemo(
		() =>
			composeTemplateStudioHtml({
				html,
				textSlots,
				textValues: text.values,
				textColor: deferredTextColor,
				imageStates: deferredImageStates,
				imageSlots,
				imageContracts: images.contracts,
				vectorSlots,
				vectorColors: deferredVectorColors,
				layerVisibility: deferredLayerVisibility,
				background: deferredBackground,
				width,
				height,
			}),
		[
			html,
			textSlots,
			text.values,
			deferredTextColor,
			deferredImageStates,
			deferredBackground,
			imageSlots,
			images.contracts,
			vectorSlots,
			deferredVectorColors,
			deferredLayerVisibility,
			width,
			height,
		],
	)

	const controllerValues = useMemo(
		() =>
			templateControllerValues(config, textSlots, text.values, text.color, background.state),
		[background.state, config, text.color, text.values, textSlots],
	)
	const artifact = useCallback((): TemplateRasterArtifact => {
		const graphicFrame =
			background.state.type === 'graphic' ? graphicFrameRef.current?.() : undefined
		return createTemplateRasterArtifact({
			height,
			html: graphicFrame
				? composeTemplateHtml(
						composedHtml,
						{},
						{ canvasBackground: { imageUrl: graphicFrame } },
					)
				: composedHtml,
			width,
		})
	}, [background.state.type, composedHtml, height, width])

	const value = useMemo<TemplateStudioValue>(
		() => ({
			navigation,
			config,
			text,
			images,
			vectors,
			layers,
			background,
			canvas: { html: composedHtml, artifact, previewRef, registerGraphicFrame },
			execution: { controllerValues },
		}),
		[
			artifact,
			background,
			composedHtml,
			config,
			controllerValues,
			images,
			layers,
			navigation,
			registerGraphicFrame,
			text,
			vectors,
		],
	)

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
	config: TemplateStudioConfig,
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
	config: TemplateStudioConfig,
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

function updateBackgroundFeature(
	current: TemplateBackgroundState,
	controlId: string,
	next: ControllerControlValue,
	contracts: readonly ResolvedTemplateImageConfig[],
): TemplateBackgroundState {
	const contract = contracts.find((candidate) => candidate.config.id === current.profileId)
	if (!contract) return current
	const binding = getBackgroundFeatureBindings(contract)[controlId]
	const definition = contract.config.controller.groups
		.flatMap((group) => group.controls)
		.find((control) => control.id === controlId)
	if (!binding || !definition || !acceptsControllerDraftValue(definition, next, binding)) {
		return current
	}
	return {
		...current,
		featureValues: { ...current.featureValues, [controlId]: next },
	}
}

function getBackgroundFeatureBindings(
	contract: ResolvedTemplateImageConfig | undefined,
): ControllerRuntimeBindings {
	return contract
		? Object.fromEntries(
				getImageStudioFeatureControlIds(contract.config).map((id) => [
					id,
					{ availability: 'disabled' as const },
				]),
			)
		: {}
}

function templateControllerValues(
	config: TemplateStudioConfig,
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
	config: TemplateStudioConfig,
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
