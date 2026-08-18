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
	const { error, generate, loading, requested, selected, session, setSelected } =
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
	// 그리드가 그리는 목록 — 참조가 있으면 0번을 차지한다.
	const items = useMemo(
		() =>
			session ? [...(session.reference ? [session.reference] : []), ...session.images] : [],
		[session],
	)
	const referenceIndex = session?.reference ? 0 : null
	const resultColor = items[0]?.profileId === config.id ? colorValue : null

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

	// 참조는 한 번 정해지면 고정된다 — 조정본을 다시 참조로 삼지 않아 세대 누적 열화가 없다.
	// 고정된 참조도 프로파일 일치는 지켜야 한다 — 서버가 시드를 scenario로 조회하므로
	// 프로파일을 바꾼 뒤의 재생성은 언제나 InvalidSeedImageError가 된다.
	const referenceImage = useMemo(() => {
		const pinned = session?.reference
		if (pinned) return pinned.profileId === config.id ? pinned : null
		const picked = selected === null ? undefined : items[selected]
		return picked?.generatedImageId && picked.profileId === config.id ? picked : null
	}, [config.id, items, selected, session])
	const cameraSeed = supportsCamera ? referenceImage : null

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
					if (!supportsCamera || !cameraSeed?.generatedImageId || !session) return
					void generate(
						{
							// 참조가 만들어진 비율로 다시 그린다 — 같은 피사체를 다른 각도에서
							// 볼 뿐이라, 비율이 갈리면 그리드에서 참조 카드가 잘린다.
							aspectRatio: session.output.aspectRatio,
							camera: angles,
							count: 1,
							imageSize: resolutionValue as ImageOutputSize,
							profileId: config.id,
							// 참조가 프롬프트를 물려주므로 비워 보낸다.
							prompt: '',
							reference: { generatedImageId: cameraSeed.generatedImageId },
						},
						cameraSeed,
					)
				},
			},
			results: {
				items,
				referenceIndex,
				color: resultColor,
				requested,
				selected,
				select: setSelected,
				output: session?.output ?? null,
			},
		}),
		[
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
			items,
			loading,
			options,
			prompt,
			ratioValue,
			referenceIndex,
			requested,
			resolutionValue,
			resultColor,
			selected,
			selectProfile,
			session,
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
