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
import {
	type GraphicStudioConfig,
	parseGraphicStudioConfig,
} from '@/features/graphic-studio/graphic-studio-config'
import { canRenderGraphicStudioSvg } from '@/features/graphic-studio/graphic-studio-runtime'
import {
	acceptsControllerDraftValue,
	type ControllerControlValue,
	type ControllerRuntimeBinding,
	type ControllerRuntimeBindings,
	type ControllerValues,
	createControllerValues,
} from '@/features/studio-controller/controller-definition'
import { useExport } from '@/features/studio-export/utils/use-export'

type GraphicStudioValue = {
	config: GraphicStudioConfig
	controls: {
		values: ControllerValues
		bindings: ControllerRuntimeBindings
		update: (controlId: string, value: ControllerControlValue) => boolean
		registerBindings: (bindings: ControllerRuntimeBindings) => void
	}
	canvas: {
		registerOutput: (download: (() => void) | null) => void
	}
	output: {
		ready: boolean
		busy: boolean
		error: string | null
		download: () => void
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
	config: unknown
	children: ReactNode
}) {
	const parsedConfig = useMemo(() => parseGraphicStudioConfig(config), [config])
	const groups = parsedConfig.controller.groups
	const [values, setValues] = useState(() => createControllerValues(groups))
	const [bindings, setBindings] = useState<ControllerRuntimeBindings>({})
	const [outputReady, setOutputReady] = useState(false)
	const outputRef = useRef<(() => void) | null>(null)
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

	const registerOutput = useCallback((download: (() => void) | null) => {
		outputRef.current = download
		setOutputReady(Boolean(download))
	}, [])
	const svgExport = useExport<'svg'>({
		canExport: () => outputReady && canRenderGraphicStudioSvg(parsedConfig),
		execute: () => outputRef.current?.(),
	})
	const contextValue = useMemo<GraphicStudioValue>(
		() => ({
			config: parsedConfig,
			controls: { values, bindings, update, registerBindings },
			canvas: { registerOutput },
			output: {
				ready: svgExport.canExport('svg'),
				busy: svgExport.exporting !== null,
				error: svgExport.error,
				download: () => void svgExport.run('svg'),
			},
		}),
		[
			bindings,
			parsedConfig,
			registerBindings,
			registerOutput,
			svgExport.canExport,
			svgExport.error,
			svgExport.exporting,
			svgExport.run,
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

export function useGraphicStudio() {
	const context = useContext(GraphicStudioContext)
	if (!context) {
		throw new Error('useGraphicStudio는 GraphicStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
}
