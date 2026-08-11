'use client'

import { type ComponentType, useEffect, useMemo, useRef, useState } from 'react'
import { Typography } from '@/components/ui/typography'
import {
	toControllerPadValue,
	toForwardStraightInput,
} from '@/features/generate-graphic/forward-straight'
import type { ForwardStraightPreview } from '@/features/generate-graphic/preview.client'
import {
	getGraphicStudioRuntimeBindings,
	renderGraphicStudioSvg,
} from '@/features/graphic-studio/graphic-studio-runtime'
import { useGraphicStudio } from '@/features/graphic-studio/hooks/use-graphic-studio'
import { downloadBlob } from '@/lib/object-url'

type GraphicRuntimeRegistration = {
	type: 'p5' | 'shader'
	Renderer: ComponentType
}

const graphicRuntimeRenderers = {
	'forward-straight': { type: 'p5', Renderer: ForwardStraightCanvas },
} satisfies Record<string, GraphicRuntimeRegistration>

/** 현재 등록된 P5 그래픽을 그린다. Controller와는 GraphicStudioContext로만 통신한다. */
export function GraphicCanvas() {
	const { config } = useGraphicStudio()
	const runtime = graphicRuntimeRenderers[config.id as keyof typeof graphicRuntimeRenderers]
	if (!runtime || runtime.type !== config.type) {
		return <UnsupportedGraphicCanvas />
	}
	const RuntimeRenderer: ComponentType = runtime.Renderer
	return <RuntimeRenderer />
}

function ForwardStraightCanvas() {
	const { config, controls, canvas } = useGraphicStudio()
	const input = useMemo(() => toForwardStraightInput(controls.values), [controls.values])
	const inputRef = useRef(input)
	const valuesRef = useRef(controls.values)
	const containerRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<ForwardStraightPreview>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		inputRef.current = input
		valuesRef.current = controls.values
		previewRef.current?.update(input)
	}, [controls.values, input])

	useEffect(() => {
		let preview: ForwardStraightPreview | undefined
		let disposed = false

		async function mountPreview() {
			const container = containerRef.current
			if (!container) return

			try {
				const { createForwardStraightPreview } = await import(
					'@/features/generate-graphic/preview.client'
				)
				if (disposed) return

				preview = createForwardStraightPreview({
					container,
					input: inputRef.current,
					onInputChange: (next) =>
						controls.update('origin', toControllerPadValue(next.origin)),
				})
				previewRef.current = preview
				const viewport = preview.getViewport()
				controls.registerBindings(getGraphicStudioRuntimeBindings(config, viewport))
				canvas.registerOutput(() => {
					const currentViewport = previewRef.current?.getViewport()
					if (!currentViewport) return
					const svg = renderGraphicStudioSvg(config, valuesRef.current, currentViewport)
					if (!svg) return
					downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${config.id}.svg`)
				})
			} catch (mountError) {
				console.error(mountError)
				setError('그래픽 미리보기를 불러오지 못했습니다.')
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
	}, [canvas.registerOutput, config, controls.registerBindings, controls.update])

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
