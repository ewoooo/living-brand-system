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
import type {
	ExportRequest,
	ExportResult,
	StudioOutputFormat,
} from '@/features/studio-export/export-contract'
import { useExport } from '@/features/studio-export/hooks/use-export'
import {
	acceptsControllerDraftValue,
	type ControllerControlValue,
	type ControllerRuntimeBinding,
	type ControllerRuntimeBindings,
	type ControllerValues,
	createControllerValues,
} from '@/modules/studio-controller/controller-definition'

const SVG_EXPORT_REQUEST = {
	format: 'svg',
	colorProfile: { space: 'rgb', icc: 'srgb' },
	options: { outlineText: false },
} as const satisfies ExportRequest

const MP4_EXPORT_REQUEST = {
	format: 'mp4',
	options: {
		container: 'mp4',
		codec: 'h264',
		durationSeconds: 5,
		fps: 30,
		width: 1920,
		height: 1080,
		colorSpace: 'rec709',
	},
} as const satisfies ExportRequest

const GRAPHIC_EXPORT_REQUESTS = {
	svg: SVG_EXPORT_REQUEST,
	mp4: MP4_EXPORT_REQUEST,
} as const

export type GraphicExportRequest =
	(typeof GRAPHIC_EXPORT_REQUESTS)[keyof typeof GRAPHIC_EXPORT_REQUESTS]

type GraphicStudioValue = {
	config: GraphicStudioConfig
	controls: {
		values: ControllerValues
		bindings: ControllerRuntimeBindings
		update: (controlId: string, value: ControllerControlValue) => boolean
		registerBindings: (bindings: ControllerRuntimeBindings) => void
	}
	canvas: {
		registerOutput: (
			render:
				| ((request: GraphicExportRequest) => ExportResult | Promise<ExportResult>)
				| null,
		) => void
	}
	output: {
		formats: readonly GraphicExportRequest['format'][]
		ready: (format: GraphicExportRequest['format']) => boolean
		busy: boolean
		error: string | null
		download: (format: GraphicExportRequest['format']) => void
	}
}

const GraphicStudioContext = createContext<GraphicStudioValue | null>(null)

/**
 * 가변 그래픽 편집 세션의 단일 소유자 — Controller와 P5·Shader 캔버스는 이 컨텍스트만
 * 알고 서로를 모른다. Definition은 기본값·제약을, Provider는 현재 값과 출력 액션을 소유한다.
 */
export function GraphicStudioProvider({
	config,
	children,
}: {
	config: GraphicStudioConfig
	children: ReactNode
}) {
	const groups = config.controller.groups
	const [values, setValues] = useState(() => createControllerValues(groups))
	const [bindings, setBindings] = useState<ControllerRuntimeBindings>({})
	const [outputReady, setOutputReady] = useState(false)
	const outputRef = useRef<
		((request: GraphicExportRequest) => ExportResult | Promise<ExportResult>) | null
	>(null)
	const bindingsRef = useRef<ControllerRuntimeBindings>({})
	const definitions = useRef(
		new Map(
			groups.flatMap((group) =>
				group.controls.map((control) => [control.id, control] as const),
			),
		),
	)

	const update = useCallback((controlId: string, value: ControllerControlValue) => {
		const definition = definitions.current.get(controlId)
		if (
			!definition ||
			!acceptsControllerDraftValue(definition, value, bindingsRef.current[controlId])
		) {
			return false
		}
		setValues((current) => ({ ...current, [controlId]: value }))
		return true
	}, [])

	const registerBindings = useCallback((runtimeBindings: ControllerRuntimeBindings) => {
		const next: Record<string, ControllerRuntimeBinding> = {}
		for (const [controlId, binding] of Object.entries(runtimeBindings)) {
			if (definitions.current.has(controlId)) next[controlId] = binding
		}
		bindingsRef.current = next
		setBindings(next)
	}, [])

	const registerOutput = useCallback(
		(
			render:
				| ((request: GraphicExportRequest) => ExportResult | Promise<ExportResult>)
				| null,
		) => {
			outputRef.current = render
			setOutputReady(Boolean(render))
		},
		[],
	)
	const graphicExport = useExport<GraphicExportRequest>({
		capability: config.output,
		canExport: () => outputReady,
		execute: (request) => {
			const render = outputRef.current
			if (!render) throw new Error(`${request.format.toUpperCase()} export is unavailable.`)
			return render(request)
		},
	})
	const contextValue = useMemo<GraphicStudioValue>(
		() => ({
			config,
			controls: { values, bindings, update, registerBindings },
			canvas: { registerOutput },
			output: {
				formats: config.output.formats.filter(isGraphicExportFormat),
				ready: (format) => graphicExport.canExport(GRAPHIC_EXPORT_REQUESTS[format]),
				busy: graphicExport.exporting !== null,
				error: graphicExport.error,
				download: (format) => void graphicExport.run(GRAPHIC_EXPORT_REQUESTS[format]),
			},
		}),
		[
			bindings,
			config,
			registerBindings,
			registerOutput,
			graphicExport.canExport,
			graphicExport.error,
			graphicExport.exporting,
			graphicExport.run,
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

function isGraphicExportFormat(
	format: StudioOutputFormat,
): format is GraphicExportRequest['format'] {
	return format in GRAPHIC_EXPORT_REQUESTS
}

export function useGraphicStudio() {
	const context = useContext(GraphicStudioContext)
	if (!context) {
		throw new Error('useGraphicStudio는 GraphicStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
}
