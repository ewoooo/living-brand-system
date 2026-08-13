'use client'

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type { GraphicRuntime } from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import { canRenderGraphicStudioSvg } from '@/features/graphic-generation/runtime/graphic-studio-runtime'
import { exportGraphicStudioSvg } from '@/features/graphic-generation/services/export-graphic.client'
import { exportGraphicStudioVideo } from '@/features/graphic-generation/services/export-graphic-video.client'
import type {
	ExportRequest,
	RgbColorProfile,
	StudioOutputFormat,
	VideoExportSpec,
} from '@/features/studio-export/export-contract'
import { useExport } from '@/features/studio-export/hooks/use-export'
import {
	type StudioExportSource,
	supportsStudioExportSource,
} from '@/features/studio-export/services/execute-studio-export'
import {
	acceptsControllerDraftValue,
	type ControllerControlValue,
	type ControllerRuntimeBinding,
	type ControllerRuntimeBindings,
	type ControllerValues,
	createControllerValues,
} from '@/modules/studio-controller/controller-definition'

type GraphicOutputSize = { width: number; height: number }
type GraphicExportRequest = Extract<ExportRequest, { format: 'svg' | 'mp4' }>
type GraphicRuntimeSource = { video?: NonNullable<GraphicRuntime['video']> }

export type GraphicOutputDraft =
	| {
			format: 'svg'
			width: number | null
			height: number | null
	  }
	| {
			format: 'mp4'
			width: number
			height: number
			fps: VideoExportSpec['fps']
			durationSeconds: number
	  }
	| {
			format: Exclude<StudioOutputFormat, 'svg' | 'mp4'>
			width: number | null
			height: number | null
	  }

type GraphicStudioValue = {
	profiles: {
		options: readonly GraphicStudioConfig[]
		select: (profileId: string) => void
	}
	config: GraphicStudioConfig
	controls: {
		values: ControllerValues
		bindings: ControllerRuntimeBindings
		update: (controlId: string, value: ControllerControlValue) => boolean
		registerBindings: (bindings: ControllerRuntimeBindings) => void
	}
	canvas: {
		registerSource: (source: GraphicRuntimeSource | null, viewport?: GraphicOutputSize) => void
	}
	output: {
		draft: GraphicOutputDraft | null
		canExport: boolean
		busy: boolean
		error: string | null
		setFormat: (format: StudioOutputFormat) => void
		setSize: (size: GraphicOutputSize) => void
		setFps: (fps: VideoExportSpec['fps']) => void
		setDuration: (durationSeconds: number) => void
		run: () => void
	}
}

const GraphicStudioContext = createContext<GraphicStudioValue | null>(null)

/**
 * 가변 그래픽 편집 세션의 단일 소유자 — Controller와 P5·Shader 캔버스는 이 컨텍스트만
 * 알고 서로를 모른다. Definition은 기본값·제약을, Provider는 현재 값과 출력 액션을 소유한다.
 */
export function GraphicStudioProvider({
	configs,
	children,
}: {
	configs: GraphicStudioConfig[]
	children: ReactNode
}) {
	const initial = configs[0]
	if (!initial) {
		throw new Error('GraphicStudioProvider는 계약이 최소 하나 있을 때만 사용할 수 있습니다.')
	}

	const [profileId, setProfileId] = useState(initial.id)
	const config = configs.find((item) => item.id === profileId) ?? initial
	const groups = config.controller.groups
	const [values, setValues] = useState(() => createControllerValues(initial.controller.groups))
	const [bindings, setBindings] = useState<ControllerRuntimeBindings>({})
	const [runtimeSource, setRuntimeSource] = useState<GraphicRuntimeSource | null>(null)
	const [viewport, setViewport] = useState<GraphicOutputSize | null>(null)
	const [outputDraft, setOutputDraft] = useState<GraphicOutputDraft | null>(() =>
		createGraphicOutputDraft(initial),
	)
	const bindingsRef = useRef<ControllerRuntimeBindings>({})
	const definitions = useMemo(
		() =>
			new Map(
				groups.flatMap((group) =>
					group.controls.map((control) => [control.id, control] as const),
				),
			),
		[groups],
	)

	const update = useCallback(
		(controlId: string, value: ControllerControlValue) => {
			const definition = definitions.get(controlId)
			if (
				!definition ||
				!acceptsControllerDraftValue(definition, value, bindingsRef.current[controlId])
			) {
				return false
			}
			setValues((current) => ({ ...current, [controlId]: value }))
			return true
		},
		[definitions],
	)

	const registerBindings = useCallback(
		(runtimeBindings: ControllerRuntimeBindings) => {
			const next: Record<string, ControllerRuntimeBinding> = {}
			for (const [controlId, binding] of Object.entries(runtimeBindings)) {
				if (definitions.has(controlId)) next[controlId] = binding
			}
			bindingsRef.current = next
			setBindings(next)
		},
		[definitions],
	)

	const registerSource = useCallback(
		(source: GraphicRuntimeSource | null, nextViewport?: GraphicOutputSize) => {
			setRuntimeSource(source)
			if (nextViewport) {
				const size = normalizeOutputSize(nextViewport)
				setViewport(size)
				setOutputDraft((current) =>
					current?.format === 'svg' && (current.width === null || current.height === null)
						? { ...current, ...size }
						: current,
				)
			}
		},
		[],
	)
	const selectProfile = useCallback(
		(nextProfileId: string) => {
			const next = configs.find((item) => item.id === nextProfileId)
			if (!next || next.id === profileId) return
			bindingsRef.current = {}
			setRuntimeSource(null)
			setBindings({})
			setViewport(null)
			setOutputDraft(createGraphicOutputDraft(next))
			setValues(createControllerValues(next.controller.groups))
			setProfileId(next.id)
		},
		[configs, profileId],
	)
	const setFormat = useCallback(
		(format: StudioOutputFormat) => {
			if (!config.output.formats.includes(format)) return
			setOutputDraft(createGraphicOutputDraft(config, format, viewport))
		},
		[config, viewport],
	)
	const setSize = useCallback(
		(size: GraphicOutputSize) => {
			if (!validOutputSize(size)) return
			setOutputDraft((current) => {
				if (!current) return current
				if (current.format === 'mp4') {
					const video = config.output.video?.mp4
					if (!video || size.width > video.maxWidth || size.height > video.maxHeight) {
						return current
					}
				}
				return { ...current, ...size }
			})
		},
		[config.output.video],
	)
	const setFps = useCallback(
		(fps: VideoExportSpec['fps']) => {
			if (!config.output.video?.mp4.fps.includes(fps)) return
			setOutputDraft((current) => (current?.format === 'mp4' ? { ...current, fps } : current))
		},
		[config.output.video],
	)
	const setDuration = useCallback(
		(durationSeconds: number) => {
			const maxDuration = config.output.video?.mp4.maxDurationSeconds
			if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !maxDuration) return
			setOutputDraft((current) =>
				current?.format === 'mp4' && durationSeconds <= maxDuration
					? { ...current, durationSeconds }
					: current,
			)
		},
		[config.output.video],
	)
	const exportSource = useMemo<StudioExportSource<GraphicExportRequest>>(() => {
		const video = runtimeSource?.video
		return {
			vector: canRenderGraphicStudioSvg(config)
				? { svg: (request) => exportGraphicStudioSvg(config, values, request) }
				: undefined,
			video: video
				? { mp4: (request) => exportGraphicStudioVideo(config, request, video) }
				: undefined,
		}
	}, [config, runtimeSource, values])
	const graphicExport = useExport<GraphicExportRequest>({
		capability: config.output,
		source: exportSource,
	})
	const exportRequest = createGraphicExportRequest(config, outputDraft)
	const contextValue = useMemo<GraphicStudioValue>(
		() => ({
			profiles: { options: configs, select: selectProfile },
			config,
			controls: { values, bindings, update, registerBindings },
			canvas: { registerSource },
			output: {
				draft: outputDraft,
				canExport: Boolean(
					exportRequest && supportsStudioExportSource(exportSource, exportRequest),
				),
				busy: graphicExport.exporting !== null,
				error: graphicExport.error,
				setFormat,
				setSize,
				setFps,
				setDuration,
				run: () => {
					if (exportRequest) void graphicExport.run(exportRequest)
				},
			},
		}),
		[
			bindings,
			config,
			configs,
			registerBindings,
			registerSource,
			selectProfile,
			graphicExport.error,
			graphicExport.exporting,
			graphicExport.run,
			exportRequest,
			exportSource,
			outputDraft,
			setDuration,
			setFormat,
			setFps,
			setSize,
			update,
			values,
		],
	)

	return (
		<GraphicStudioContext.Provider value={contextValue}>
			{children}
		</GraphicStudioContext.Provider>
	)
}

function createGraphicOutputDraft(
	config: GraphicStudioConfig,
	requestedFormat?: StudioOutputFormat,
	viewport?: GraphicOutputSize | null,
): GraphicOutputDraft | null {
	const format = requestedFormat ?? config.output.formats[0]
	if (format === 'svg') {
		return {
			format,
			width: viewport?.width ?? null,
			height: viewport?.height ?? null,
		}
	}
	if (format === 'mp4') {
		const video = config.output.video?.mp4
		const fps = video?.fps.includes(30) ? 30 : video?.fps[0]
		if (!video || !fps) return null
		return {
			format,
			width: video.maxWidth,
			height: video.maxHeight,
			fps,
			durationSeconds: Math.min(5, video.maxDurationSeconds),
		}
	}
	if (!format) return null
	return {
		format,
		width: viewport?.width ?? null,
		height: viewport?.height ?? null,
	}
}

function createGraphicExportRequest(
	config: GraphicStudioConfig,
	draft: GraphicOutputDraft | null,
): GraphicExportRequest | null {
	if (!draft) return null
	if (draft.format === 'svg') {
		if (draft.width === null || draft.height === null) return null
		const icc: RgbColorProfile['icc'] = config.output.colorProfiles?.rgb?.[0] ?? 'srgb'
		return {
			format: 'svg',
			colorProfile: { space: 'rgb', icc },
			options: { width: draft.width, height: draft.height, outlineText: false },
		}
	}
	if (draft.format === 'mp4') {
		const video = config.output.video?.mp4
		if (!video) return null
		return {
			format: 'mp4',
			options: {
				container: 'mp4',
				codec: video.codec,
				colorSpace: video.colorSpace,
				width: draft.width,
				height: draft.height,
				fps: draft.fps,
				durationSeconds: draft.durationSeconds,
			},
		}
	}
	return null
}

function normalizeOutputSize(size: GraphicOutputSize): GraphicOutputSize {
	return {
		width: Math.max(1, Math.round(size.width)),
		height: Math.max(1, Math.round(size.height)),
	}
}

function validOutputSize(size: GraphicOutputSize): boolean {
	return (
		Number.isInteger(size.width) &&
		size.width > 0 &&
		Number.isInteger(size.height) &&
		size.height > 0
	)
}

export function useGraphicStudio() {
	const context = useContext(GraphicStudioContext)
	if (!context) {
		throw new Error('useGraphicStudio는 GraphicStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
}
