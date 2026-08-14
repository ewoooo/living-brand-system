'use client'

import { type ReactNode, useCallback, useMemo, useState } from 'react'
import {
	ImageStudioContext,
	type ImageStudioValue,
} from '@/features/image-generation/contexts/image-studio-context'
import {
	acceptsImagePromptExecution,
	getImageColorAdjustmentControls,
	getImageStudioControls,
	getImageStudioFeature,
	IMAGE_STUDIO_CONTROL_IDS,
	type ImageStudioConfig,
} from '@/features/image-generation/domain/image-studio-config'
import { useImageGeneration } from '@/features/image-generation/hooks/use-image-generation'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/image-generation/image-size'
import type { ImageColorAdjustment } from '@/features/image-generation/runtime/image-colorize'
import { fetchImageStudioConfigs } from '@/features/image-generation/services/list-image-studio-configs.client'
import { useLazyResource } from '@/hooks/use-lazy-resource'
import {
	acceptsControllerDraftValue,
	type ControllerControlValue,
	type ControllerValues,
	createControllerValues,
} from '@/modules/studio-controller/controller-definition'

/**
 * 이미지 스튜디오 편집 세션의 단일 소유자 — Controller와 Canvas는 이 컨텍스트만 알고 서로를
 * 모른다. Definition은 기본값·제약을, Provider는 현재 값·runtime binding·도메인 액션을 소유한다.
 */
export function ImageStudioProvider({
	config: initial,
	children,
}: {
	config: ImageStudioConfig
	children: ReactNode
}) {
	// 교체 후보 전체는 자산 브라우저가 열릴 때 가져온다 — 페이지는 시작 계약 하나만 싣는다.
	const browse = useLazyResource(fetchImageStudioConfigs)
	// 세션에서 한 번이라도 쓴 계약은 남긴다 — 결과 카드가 그 결과를 만든 프로파일의 출력 능력을 되찾는다.
	const [configs, setConfigs] = useState<ImageStudioConfig[]>([initial])
	const [profileId, setProfileId] = useState(initial.id)
	const [values, setValues] = useState(() => createControllerValues(initial.controller.groups))
	const [angles, setAngles] = useState({ azimuthDeg: 0, elevationDeg: 0 })
	const { adjustCamera, error, generate, loading, requested, result, selected, setSelected } =
		useImageGeneration()

	const config = configs.find((item) => item.id === profileId) ?? initial
	const definitions = useMemo(() => getImageStudioControls(config), [config])
	const colorDefinitions = useMemo(() => getImageColorAdjustmentControls(config), [config])
	const supportsCamera = Boolean(getImageStudioFeature(config, 'camera-control'))
	const options = configs

	const prompt = stringValue(values[definitions.prompt.id], definitions.prompt.defaultValue)
	const batchValue = stringValue(values[definitions.batch.id], definitions.batch.defaultValue)
	const ratioValue = stringValue(values[definitions.ratio.id], definitions.ratio.defaultValue)
	const resolutionValue = stringValue(
		values[definitions.resolution.id],
		definitions.resolution.defaultValue,
	)
	const promptError =
		definitions.prompt.maxLength && prompt.length > definitions.prompt.maxLength
			? `프롬프트가 최대 ${definitions.prompt.maxLength}자를 초과했습니다.`
			: undefined
	const bindings = useMemo(
		() => (promptError ? { [definitions.prompt.id]: { error: promptError } } : {}),
		[definitions.prompt.id, promptError],
	)
	const canRun = acceptsImagePromptExecution(definitions.prompt, prompt) && !promptError

	const lineColor = colorDefinitions ? values[colorDefinitions.line.id] : undefined
	const backgroundColor = colorDefinitions?.background
		? values[colorDefinitions.background.id]
		: undefined
	const colorValue = useMemo<ImageColorAdjustment | null>(
		() =>
			typeof lineColor === 'string'
				? {
						line: lineColor,
						...(typeof backgroundColor === 'string'
							? { background: backgroundColor }
							: {}),
					}
				: null,
		[backgroundColor, lineColor],
	)
	const resultColor = result?.profileId === config.id ? colorValue : null

	const update = useCallback(
		(controlId: string, value: ControllerControlValue) => {
			const definition = findControl(config, controlId)
			if (!definition || !acceptsControllerDraftValue(definition, value)) return
			setValues((current) => ({ ...current, [controlId]: value }))
		},
		[config],
	)

	const selectProfile = useCallback(
		(nextProfileId: number) => {
			const next = (browse.data ?? configs).find((item) => item.id === nextProfileId)
			if (!next) return
			setConfigs((current) =>
				current.some((item) => item.id === next.id) ? current : [...current, next],
			)
			setValues((current) => reconcileProfileValues(next, current))
			setProfileId(nextProfileId)
		},
		[browse.data, configs],
	)

	// 시점 조정은 저장된 생성 이미지를 시드로 쓴다 — 셋(시드 URL·생성 이미지 id·프로파일)이
	// 모두 있을 때만 대상이 성립하므로 한 객체로 파생한다.
	const generatedImage = selected === null ? undefined : result?.generatedImages?.[selected]
	const cameraSeed = useMemo(
		() =>
			supportsCamera && selected !== null && result?.profileId === config.id && generatedImage
				? {
						generatedImageId: generatedImage.id,
						profileId: result.profileId,
						src: result.images[selected],
					}
				: null,
		[config.id, generatedImage, result, selected, supportsCamera],
	)

	const value = useMemo<ImageStudioValue>(
		() => ({
			profiles: { options, browse, select: selectProfile },
			config,
			controls: { values, bindings, update },
			prompt: {
				value: prompt,
				setValue: (text) => update(definitions.prompt.id, text),
			},
			generation: {
				batch: Number(batchValue),
				setBatch: (count) => update(definitions.batch.id, String(count)),
				ratio: ratioValue as ImageAspectRatio,
				setRatio: (ratio) => update(definitions.ratio.id, ratio),
				resolution: resolutionValue as ImageOutputSize,
				setResolution: (resolution) => update(definitions.resolution.id, resolution),
				run: () => {
					if (!canRun) return
					void generate({
						aspectRatio: ratioValue as ImageAspectRatio,
						count: Number(batchValue),
						imageSize: resolutionValue as ImageOutputSize,
						profileId: config.id,
						prompt,
					})
				},
				canRun,
				busy: loading,
				error,
			},
			color: {
				value: colorValue,
				update: (patch) => {
					if (patch.line !== undefined && colorDefinitions) {
						update(colorDefinitions.line.id, patch.line)
					}
					if (patch.background !== undefined && colorDefinitions?.background) {
						update(colorDefinitions.background.id, patch.background)
					}
				},
			},
			camera: {
				...angles,
				setAngles,
				seedImage: cameraSeed?.src ?? null,
				regenerate: () => {
					if (!supportsCamera || !cameraSeed) return
					void adjustCamera({
						camera: angles,
						count: 1,
						generatedImageId: cameraSeed.generatedImageId,
						profileId: cameraSeed.profileId,
					})
				},
			},
			results: { result, color: resultColor, requested, selected, select: setSelected },
		}),
		[
			adjustCamera,
			angles,
			batchValue,
			bindings,
			browse,
			cameraSeed,
			canRun,
			colorDefinitions,
			colorValue,
			config,
			definitions,
			error,
			generate,
			loading,
			options,
			prompt,
			ratioValue,
			requested,
			resolutionValue,
			result,
			resultColor,
			selected,
			selectProfile,
			setSelected,
			supportsCamera,
			update,
			values,
		],
	)

	return <ImageStudioContext.Provider value={value}>{children}</ImageStudioContext.Provider>
}

function reconcileProfileValues(
	config: ImageStudioConfig,
	current: ControllerValues,
): ControllerValues {
	const next = createControllerValues(config.controller.groups)
	for (const control of config.controller.groups.flatMap((group) => group.controls)) {
		if ((control.availability ?? 'enabled') !== 'enabled') continue
		const currentValue = current[control.id]
		if (control.id === IMAGE_STUDIO_CONTROL_IDS.prompt && typeof currentValue === 'string') {
			next[control.id] = currentValue
			continue
		}
		if (
			control.kind === 'select' &&
			((typeof currentValue === 'string' &&
				control.options.some((option) => option.value === currentValue)) ||
				(currentValue === null && control.defaultValue === null))
		) {
			next[control.id] = currentValue
		}
	}
	return next
}

function findControl(config: ImageStudioConfig, id: string) {
	return config.controller.groups
		.flatMap((group) => group.controls)
		.find((control) => control.id === id)
}

function stringValue(value: ControllerControlValue | undefined, fallback: string | null) {
	return typeof value === 'string' ? value : (fallback ?? '')
}
