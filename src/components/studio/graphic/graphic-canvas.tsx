'use client'

import { type ComponentType, useEffect, useRef, useState } from 'react'
import { Typography } from '@/components/ui/typography'
import {
	type GraphicPreview,
	getGraphicPreviewAdapter,
} from '@/features/graphic-studio/graphic-preview.client'
import type { GraphicStudioConfig } from '@/features/graphic-studio/graphic-studio-config'
import {
	canRenderGraphicStudioSvg,
	getGraphicStudioRuntimeBindings,
} from '@/features/graphic-studio/graphic-studio-runtime'
import { useGraphicStudio } from '@/features/graphic-studio/hooks/use-graphic-studio'
import { exportGraphicStudioSvg } from '@/features/graphic-studio/services/export-graphic.client'
import { exportGraphicStudioVideo } from '@/features/graphic-studio/services/export-graphic-video.client'

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
	const adapter = getGraphicPreviewAdapter(config)
	if (!adapter || adapter.type !== type) return <UnsupportedGraphicCanvas />
	return <GraphicPreviewCanvas adapter={adapter} />
}

function GraphicPreviewCanvas({
	adapter,
}: {
	adapter: NonNullable<ReturnType<typeof getGraphicPreviewAdapter>>
}) {
	const { config, controls, canvas } = useGraphicStudio()
	const valuesRef = useRef(controls.values)
	const containerRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<GraphicPreview>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		valuesRef.current = controls.values
		previewRef.current?.update(controls.values)
	}, [controls.values])

	useEffect(() => {
		let preview: GraphicPreview | undefined
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
				preview = mounted
				previewRef.current = mounted
				const viewport = mounted.getViewport()
				controls.registerBindings(getGraphicStudioRuntimeBindings(config, viewport))
				if (canRenderGraphicStudioSvg(config) || mounted.video) {
					canvas.registerOutput((request) => {
						if (request.format === 'svg') {
							const currentViewport = previewRef.current?.getViewport()
							if (!currentViewport || !canRenderGraphicStudioSvg(config)) {
								throw new Error('SVG export is unavailable.')
							}
							return exportGraphicStudioSvg(
								config,
								valuesRef.current,
								currentViewport,
							)
						}
						const video = previewRef.current?.video
						if (!video) throw new Error('MP4 export is unavailable.')
						return exportGraphicStudioVideo(config, request, video)
					})
				}
			} catch (mountError) {
				console.error(mountError)
				if (!disposed) setError('그래픽 미리보기를 불러오지 못했습니다.')
			}
		}

		void mountPreview()
		return () => {
			disposed = true
			preview?.destroy()
			previewRef.current = null
			canvas.registerOutput(null)
			controls.registerBindings({})
		}
	}, [adapter, canvas.registerOutput, config, controls.registerBindings, controls.update])

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const resizeObserver = new ResizeObserver(([entry]) => {
			if (!entry) return
			previewRef.current?.resize(entry.contentRect.width, entry.contentRect.height)
			controls.registerBindings(
				getGraphicStudioRuntimeBindings(config, {
					width: entry.contentRect.width,
					height: entry.contentRect.height,
				}),
			)
		})
		resizeObserver.observe(container)
		return () => resizeObserver.disconnect()
	}, [config, controls.registerBindings])

	return (
		<figure data-slot="graphic-canvas" className="flex min-h-0 flex-1 flex-col">
			<div
				ref={containerRef}
				className="min-h-96 flex-1 overflow-hidden rounded-xl lg:min-h-0 [&>canvas]:block"
			/>
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
