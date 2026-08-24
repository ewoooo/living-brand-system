'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { ControllerBar } from '@/components/shared/controller'
import { fitPreviewSize } from '@/components/studio/shared/fit-preview-size'
import {
	DEFAULT_PREVIEW_SIZE,
	PreviewSizeControl,
} from '@/components/studio/shared/preview-size-control'
import { slotHighlightCss } from '@/components/studio/template/slot-highlight-css'
import { Typography } from '@/components/ui/typography'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import {
	type GraphicRuntime,
	loadGraphicRuntimeAdapter,
} from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'
import type { ControllerValues } from '@/modules/studio-controller/controller-definition'

/**
 * 템플릿 스튜디오의 작업 공간(미리보기 캔버스) — 사이드바를 모른다.
 * 합성 결과와 미리보기 ref는 TemplateStudioProvider 컨텍스트로만 주고받는다.
 * 미리보기는 동일-문서 렌더(어드민 캔버스는 same-origin iframe) — opaque origin iframe은 벡터 mask의
 * CORS 로드를 깨뜨린다. 임포트 HTML은 스크립트 없는 inline-style이다.
 */
export function TemplateCanvas() {
	const { config, canvas, background, focus } = useTemplateStudio()
	const { width, height } = config.template.exportOption.canvas
	const stageRef = useRef<HTMLDivElement>(null)
	const [preview, setPreview] = useState({ width, height })
	const [previewSize, setPreviewSize] = useState(DEFAULT_PREVIEW_SIZE)
	const scale = preview.width / width
	const graphicConfig = config.template.graphicConfigs.find(
		(candidate) => candidate.id === background.state.graphicConfigId,
	)

	useEffect(() => {
		const stage = stageRef.current
		if (!stage) return
		const resize = (bounds: { width: number; height: number }) => {
			if (bounds.width > 0 && bounds.height > 0) {
				setPreview(fitPreviewSize(bounds, { width, height }))
			}
		}
		const observer = new ResizeObserver(([entry]) => {
			if (entry) resize(entry.contentRect)
		})
		resize({ width: stage.clientWidth, height: stage.clientHeight })
		observer.observe(stage)
		return () => observer.disconnect()
	}, [height, width])

	return (
		<div ref={stageRef} className="relative grid h-full min-h-0 min-w-0 overflow-hidden">
			<div
				data-slot="template-preview"
				className="m-auto shrink-0 overflow-hidden shadow-lg transition-transform duration-200 ease-out motion-reduce:transition-none lg:[transform:scale(var(--preview-scale))]"
				style={
					{
						...preview,
						'--preview-scale': previewSize / 100,
					} as CSSProperties
				}
			>
				{focus.slotId && <style>{slotHighlightCss(focus.slotId, scale)}</style>}
				<div
					className="relative"
					style={{
						width,
						height,
						transform: `scale(${scale})`,
						transformOrigin: 'top left',
					}}
				>
					{background.state.type === 'graphic' && graphicConfig && (
						<TemplateGraphicBackground
							config={graphicConfig}
							values={background.state.graphicValues}
							width={width}
							height={height}
						/>
					)}
					<div
						ref={canvas.previewRef}
						data-background-type={background.state.type}
						className="relative h-full w-full data-[background-type=graphic]:pointer-events-none"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: 서버 컨버터가 만든 inline-style HTML(스크립트 없음) — 어드민 캔버스와 동일 렌더
						dangerouslySetInnerHTML={{ __html: canvas.html }}
					/>
				</div>
			</div>
			<ControllerBar placement="canvas">
				<PreviewSizeControl value={previewSize} onChange={setPreviewSize} />
			</ControllerBar>
		</div>
	)
}

type TemplateGraphicBackgroundProps = {
	config: GraphicStudioConfig
	values: ControllerValues
	width: number
	height: number
}

function TemplateGraphicBackground({
	config,
	values,
	width,
	height,
}: TemplateGraphicBackgroundProps) {
	const { background, canvas } = useTemplateStudio()
	const containerRef = useRef<HTMLDivElement>(null)
	const runtimeRef = useRef<GraphicRuntime>(null)
	const valuesRef = useRef(values)
	const updateRef = useRef(background.updateGraphic)
	const [error, setError] = useState<string | null>(null)
	useEffect(() => {
		valuesRef.current = values
		runtimeRef.current?.update(values)
	}, [values])

	useEffect(() => {
		updateRef.current = background.updateGraphic
	}, [background.updateGraphic])

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		let runtime: GraphicRuntime | undefined
		let disposed = false
		setError(null)
		void loadGraphicRuntimeAdapter(config)
			.then((adapter) => {
				if (disposed) return null
				if (!adapter) throw new Error('Unsupported graphic runtime.')
				return adapter.mount({
					container,
					values: valuesRef.current,
					onChange: (controlId, value) => {
						updateRef.current(controlId, value)
						return true
					},
				})
			})
			.then((mounted) => {
				if (!mounted) return
				if (disposed) {
					mounted.destroy()
					return
				}
				runtime = mounted
				runtimeRef.current = mounted
				mounted.resize(width, height)
				canvas.registerGraphicFrame(() => {
					const frame = mounted.artifacts.raster.source.withSurface(
						{ width, height },
						(surface) => {
							if (surface.kind !== 'canvas') {
								throw new Error('Graphic runtime did not provide a canvas surface.')
							}
							return surface.element.toDataURL()
						},
					)
					if (typeof frame !== 'string') {
						throw new Error('Graphic frame capture must be synchronous.')
					}
					return frame
				})
				canvas.registerGraphicVideo(mounted.artifacts.video?.source ?? null)
			})
			.catch((mountError) => {
				console.error(mountError)
				if (!disposed) setError('그래픽 미리보기를 불러오지 못했습니다.')
			})

		return () => {
			disposed = true
			canvas.registerGraphicFrame(null)
			canvas.registerGraphicVideo(null)
			runtime?.destroy()
			runtimeRef.current = null
		}
	}, [canvas.registerGraphicFrame, canvas.registerGraphicVideo, config, height, width])

	return (
		<div
			ref={containerRef}
			data-slot="template-graphic-background"
			className="absolute inset-0 overflow-hidden [&>canvas]:block"
		>
			{error && (
				<Typography role="alert" size="sm" className="p-4 text-destructive">
					{error}
				</Typography>
			)}
		</div>
	)
}
