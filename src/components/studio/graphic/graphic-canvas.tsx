'use client'

import { type ComponentType, useEffect, useRef, useState } from 'react'
import { fitPreviewSize } from '@/components/studio/shared/fit-preview-size'
import { Typography } from '@/components/ui/typography'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { useGraphicStudio } from '@/features/graphic-generation/hooks/use-graphic-studio'
import {
	type GraphicRuntime,
	getGraphicRuntimeAdapter,
} from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import { getGraphicStudioRuntimeBindings } from '@/features/graphic-generation/runtime/graphic-studio-runtime'

const canvasByType = {
	p5: P5Canvas,
	shader: WebGLCanvas,
} satisfies Record<GraphicStudioConfig['type'], ComponentType>

/** runtime type에 맞는 공용 Canvas를 고른다. 개별 그래픽 id는 Preview registry가 해석한다. */
export function GraphicCanvas() {
	const { config } = useGraphicStudio()
	const RuntimeCanvas = canvasByType[config.type]
	return <RuntimeCanvas />
}

function P5Canvas() {
	return <RegisteredGraphicCanvas type="p5" />
}

function WebGLCanvas() {
	return <RegisteredGraphicCanvas type="shader" />
}

function RegisteredGraphicCanvas({ type }: { type: GraphicStudioConfig['type'] }) {
	const { config } = useGraphicStudio()
	const adapter = getGraphicRuntimeAdapter(config)
	if (!adapter || adapter.type !== type) return <UnsupportedGraphicCanvas />
	return <GraphicPreviewCanvas adapter={adapter} />
}

function GraphicPreviewCanvas({
	adapter,
}: {
	adapter: NonNullable<ReturnType<typeof getGraphicRuntimeAdapter>>
}) {
	const { config, controls, canvas, output } = useGraphicStudio()
	const valuesRef = useRef(controls.values)
	const stageRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const runtimeRef = useRef<GraphicRuntime>(null)
	const [error, setError] = useState<string | null>(null)
	const outputWidth = output.draft?.width
	const outputHeight = output.draft?.height

	useEffect(() => {
		valuesRef.current = controls.values
		runtimeRef.current?.update(controls.values)
	}, [controls.values])

	useEffect(() => {
		let runtime: GraphicRuntime | undefined
		let disposed = false

		async function mountPreview() {
			const container = containerRef.current
			if (!container || !adapter) return

			try {
				const mounted = await adapter.mount({
					container,
					values: valuesRef.current,
					onChange: controls.update,
				})
				if (disposed) {
					mounted.destroy()
					return
				}
				runtime = mounted
				runtimeRef.current = mounted
				const viewport = mounted.getViewport()
				controls.registerBindings(getGraphicStudioRuntimeBindings(config, viewport))
				canvas.registerArtifacts(mounted.artifacts, viewport)
			} catch (mountError) {
				console.error(mountError)
				if (!disposed) setError('그래픽 미리보기를 불러오지 못했습니다.')
			}
		}

		void mountPreview()
		return () => {
			disposed = true
			runtime?.destroy()
			runtimeRef.current = null
			canvas.registerArtifacts(null)
			controls.registerBindings({})
		}
	}, [adapter, canvas.registerArtifacts, config, controls.registerBindings, controls.update])

	useEffect(() => {
		const stage = stageRef.current
		const container = containerRef.current
		if (!stage || !container) return

		const resizePreview = (width: number, height: number) => {
			if (width <= 0 || height <= 0) return
			const viewport =
				outputWidth && outputHeight
					? fitPreviewSize(
							{ width, height },
							{ width: outputWidth, height: outputHeight },
						)
					: { width, height }
			container.style.width = `${viewport.width}px`
			container.style.height = `${viewport.height}px`
			runtimeRef.current?.resize(viewport.width, viewport.height)
			controls.registerBindings(getGraphicStudioRuntimeBindings(config, viewport))
		}

		const resizeObserver = new ResizeObserver(([entry]) => {
			if (!entry) return
			resizePreview(entry.contentRect.width, entry.contentRect.height)
		})
		resizePreview(stage.clientWidth, stage.clientHeight)
		resizeObserver.observe(stage)
		return () => resizeObserver.disconnect()
	}, [config, controls.registerBindings, outputHeight, outputWidth])

	return (
		<figure data-slot="graphic-canvas" className="flex min-h-0 flex-1 flex-col">
			<div
				ref={stageRef}
				className="flex min-h-96 flex-1 items-center justify-center overflow-hidden lg:min-h-0"
			>
				<div
					ref={containerRef}
					className="h-full w-full shrink-0 overflow-hidden rounded-xl [&>canvas]:block"
				/>
			</div>
			{error && (
				<Typography role="alert" size="sm" className="pt-2 text-destructive">
					{error}
				</Typography>
			)}
		</figure>
	)
}

function UnsupportedGraphicCanvas() {
	return (
		<div
			data-slot="graphic-canvas-unsupported"
			className="flex h-full items-center justify-center"
		>
			<Typography role="alert" size="sm" tone="muted">
				지원하지 않는 그래픽 런타임입니다.
			</Typography>
		</div>
	)
}
