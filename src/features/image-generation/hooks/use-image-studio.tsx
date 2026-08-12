'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'
import {
	acceptsImagePromptExecution,
	getImageColorAdjustmentControls,
	getImageStudioControls,
	getImageStudioFeature,
	IMAGE_STUDIO_CONTROL_IDS,
	type ImageOutputFormat,
	type ImageStudioConfig,
} from '@/features/image-generation/domain/image-studio-config'
import { useImageGeneration } from '@/features/image-generation/hooks/use-image-generation'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/image-generation/image-size'
import type { ImageColorAdjustment } from '@/features/image-generation/runtime/image-colorize'
import type { ImageGenerationResult } from '@/features/image-generation/services/generate-image.client'
import { exportResultsToZip } from '@/features/studio-export/adapters/export-results-to-zip.client'
import { useExport } from '@/features/studio-export/hooks/use-export'
import {
	exportImage,
	type ImageExportRequest,
} from '@/features/studio-export/services/export-image.client'
import {
	acceptsControllerDraftValue,
	type ControllerControlValue,
	type ControllerRuntimeBindings,
	type ControllerValues,
	createControllerValues,
} from '@/modules/studio-controller/controller-definition'

type ImageStudioValue = {
	profiles: {
		/** 프로파일 교체 후보 — 계약은 언제나 이 중 하나다. */
		options: readonly ImageStudioConfig[]
		select: (profileId: number) => void
	}
	/** 현재 프로파일의 편집 계약 — 컨트롤러는 이 객체만 보고 컨트롤을 그린다. */
	config: ImageStudioConfig
	controls: {
		values: ControllerValues
		bindings: ControllerRuntimeBindings
		update: (controlId: string, value: ControllerControlValue) => void
	}
	prompt: {
		value: string
		setValue: (text: string) => void
	}
	generation: {
		batch: number
		setBatch: (count: number) => void
		ratio: ImageAspectRatio
		setRatio: (ratio: ImageAspectRatio) => void
		resolution: ImageOutputSize
		setResolution: (resolution: ImageOutputSize) => void
		run: () => void
		canRun: boolean
		busy: boolean
		error: string | null
	}
	color: {
		/** 색 조정 값 — 계약이 색을 열지 않으면 null이고, 그때는 색 행도 굽는 저장도 없다. */
		value: ImageColorAdjustment | null
		update: (patch: Partial<ImageColorAdjustment>) => void
	}
	camera: {
		azimuthDeg: number
		elevationDeg: number
		setAngles: (angles: { azimuthDeg: number; elevationDeg: number }) => void
		/** 시점을 다시 잡을 시드 — null이면 대상이 없다(컨트롤러가 그룹을 잠근다). */
		seedImage: string | null
		regenerate: () => void
	}
	results: {
		/** 직전 요청이 만든 결과 — 프로파일을 교체해도 유지된다(사용자가 만든 산출물). */
		result: ImageGenerationResult | null
		/** 결과와 현재 프로파일이 같을 때만 적용할 색. 다른 프로파일의 기능은 소급하지 않는다. */
		color: ImageColorAdjustment | null
		/** 요청한 장수 — 생성 중 자리표시자 개수. */
		requested: number
		selected: number | null
		select: (index: number | null) => void
	}
	/** PNG 저장 — 색이 있으면 구운 PNG, 없으면 원본이다. 서버에 남기지 않는다. */
	download: {
		available: boolean
		busy: boolean
		error: string | null
		formats: readonly ImageOutputFormat[]
		format: ImageOutputFormat | null
		setFormat: (format: ImageOutputFormat) => void
		selected: () => void
		all: () => void
	}
}

const ImageStudioContext = createContext<ImageStudioValue | null>(null)

/**
 * 이미지 스튜디오 편집 세션의 단일 소유자 — Controller와 Canvas는 이 컨텍스트만 알고 서로를
 * 모른다. Definition은 기본값·제약을, Provider는 현재 값·runtime binding·도메인 액션을 소유한다.
 */
export function ImageStudioProvider({
	configs,
	initialProfileId,
	children,
}: {
	configs: ImageStudioConfig[]
	initialProfileId?: number
	children: ReactNode
}) {
	const initial = configs.find(({ id }) => id === initialProfileId) ?? configs[0]
	if (!initial) {
		throw new Error('ImageStudioProvider는 계약이 최소 하나 있을 때만 사용할 수 있습니다.')
	}

	const [profileId, setProfileId] = useState(initial.id)
	const [selectedExportFormat, setSelectedExportFormat] = useState<ImageOutputFormat>(
		initial.output.formats[0] ?? 'png',
	)
	const [values, setValues] = useState(() => createControllerValues(initial.controller.groups))
	const [angles, setAngles] = useState({ azimuthDeg: 0, elevationDeg: 0 })
	const { adjustCamera, error, generate, loading, requested, result, selected, setSelected } =
		useImageGeneration()

	const config = configs.find((item) => item.id === profileId) ?? initial
	const definitions = getImageStudioControls(config)
	const colorDefinitions = getImageColorAdjustmentControls(config)
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
	const bindings: ControllerRuntimeBindings = promptError
		? { [definitions.prompt.id]: { error: promptError } }
		: {}
	const canRun = acceptsImagePromptExecution(definitions.prompt, prompt) && !promptError

	const lineColor = colorDefinitions ? values[colorDefinitions.line.id] : undefined
	const backgroundColor = colorDefinitions?.background
		? values[colorDefinitions.background.id]
		: undefined
	const colorValue: ImageColorAdjustment | null =
		typeof lineColor === 'string'
			? {
					line: lineColor,
					...(typeof backgroundColor === 'string' ? { background: backgroundColor } : {}),
				}
			: null
	const resultConfig = configs.find((candidate) => candidate.id === result?.profileId)
	const resultColor = resultConfig?.id === config.id ? colorValue : null
	const resultOutput = resultConfig?.output ?? { formats: [] }
	const exportFormats = resultOutput.formats.filter(
		(format): format is ImageOutputFormat =>
			format === 'original' || format === 'png' || format === 'jpeg',
	)
	const exportFormat = exportFormats.includes(selectedExportFormat)
		? selectedExportFormat
		: (exportFormats[0] ?? null)
	const canDownload = Boolean(result?.images.length && exportFormat)
	const imageExport = useExport<ImageExportRequest>({
		capability: resultOutput,
		canExport: ({ package: packageFormat, scope }) =>
			Boolean(
				result &&
					(!packageFormat || resultOutput.packages?.includes(packageFormat)) &&
					(scope === 'all' ||
						(selected !== null && result.images[selected] !== undefined)),
			),
		execute: async (request) => {
			if (!result) throw new Error('저장할 이미지가 없습니다.')
			if (request.scope === 'selected') {
				if (selected === null || !result.images[selected]) {
					throw new Error('저장할 이미지를 선택해 주세요.')
				}
				return exportImage(result.images[selected], selected, resultColor, request)
			}
			const items = await Promise.all(
				result.images.map((src, index) => exportImage(src, index, resultColor, request)),
			)
			return request.package
				? exportResultsToZip({ format: request.package, filename: 'hd-images.zip', items })
				: items
		},
	})

	function update(controlId: string, value: ControllerControlValue) {
		const definition = findControl(config, controlId)
		if (!definition || !acceptsControllerDraftValue(definition, value)) return
		setValues((current) => ({ ...current, [controlId]: value }))
	}

	function selectProfile(nextProfileId: number) {
		const next = configs.find((item) => item.id === nextProfileId)
		if (!next) return
		setValues((current) => reconcileProfileValues(next, current))
		setProfileId(nextProfileId)
	}

	// 시점 조정은 저장된 생성 이미지를 시드로 쓴다 — 셋(시드 URL·생성 이미지 id·프로파일)이
	// 모두 있을 때만 대상이 성립하므로 한 객체로 파생한다.
	const generatedImage = selected === null ? undefined : result?.generatedImages?.[selected]
	const cameraSeed =
		supportsCamera && selected !== null && result?.profileId === config.id && generatedImage
			? {
					basePrompt: result.prompt,
					generatedImageId: generatedImage.id,
					profileId: result.profileId,
					src: result.images[selected],
				}
			: null

	const value: ImageStudioValue = {
		profiles: { options, select: selectProfile },
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
					basePrompt: cameraSeed.basePrompt,
					camera: angles,
					count: 1,
					generatedImageId: cameraSeed.generatedImageId,
					profileId: cameraSeed.profileId,
				})
			},
		},
		results: { result, color: resultColor, requested, selected, select: setSelected },
		download: {
			available: canDownload,
			busy: imageExport.exporting !== null,
			error: imageExport.error,
			formats: exportFormats,
			format: exportFormat,
			setFormat: (next) => {
				if (exportFormats.includes(next)) setSelectedExportFormat(next)
			},
			selected: () => {
				const request = createImageExportRequest(exportFormat, 'selected')
				if (request) void imageExport.run(request)
			},
			all: () => {
				const request = createImageExportRequest(exportFormat, 'all')
				if (request) void imageExport.run(request)
			},
		},
	}

	return <ImageStudioContext.Provider value={value}>{children}</ImageStudioContext.Provider>
}

function createImageExportRequest(
	format: 'original' | 'png' | 'jpeg' | null,
	scope: ImageExportRequest['scope'],
): ImageExportRequest | null {
	const packageFormat = scope === 'all' ? { package: 'zip' as const } : {}
	if (format === 'original') return { format, options: {}, scope, ...packageFormat }
	if (format === 'png') {
		return {
			format,
			colorProfile: { space: 'rgb', icc: 'srgb' },
			options: { scale: 1, transparent: true },
			scope,
			...packageFormat,
		}
	}
	if (format === 'jpeg') {
		return {
			format,
			colorProfile: { space: 'rgb', icc: 'srgb' },
			options: { quality: 90 },
			scope,
			...packageFormat,
		}
	}
	return null
}

export function useImageStudio() {
	const context = useContext(ImageStudioContext)
	if (!context) {
		throw new Error('useImageStudio는 ImageStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
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
