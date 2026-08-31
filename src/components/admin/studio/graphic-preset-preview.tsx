'use client'

import { useEffect, useRef, useState } from 'react'
import { fitPreviewSize } from '@/components/studio/shared/fit-preview-size'
import type { GraphicRuntimeManifest } from '@/features/graphic-generation/domain/graphic-studio-config'
import {
	type GraphicRuntime,
	loadGraphicRuntimeAdapter,
} from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import type { ControllerValues } from '@/modules/studio-controller/controller-definition'

/**
 * Admin에서 프리셋 값을 실제 그래픽으로 보여 준다. 스튜디오와 **같은 runtime adapter**를 쓴다 —
 * 셰이더를 다시 만들지 않는다.
 *
 * 🔴 WebGL 컨텍스트는 브라우저당 십수 개가 한계다. 프리셋이 여럿이면 화면 밖 미리보기가 컨텍스트를
 *    다 먹어 「나중에 연 것이 검게 나오는」 사고가 난다. 그래서 **보일 때만 마운트하고 벗어나면 버린다.**
 */
export function GraphicPresetPreview({
	manifest,
	values,
	aspectRatio,
}: {
	manifest: GraphicRuntimeManifest
	values: ControllerValues
	/** 미리보기 판의 가로세로 비. 창작자가 쓸 판을 보면서 맞추라고 Admin이 고른다. */
	aspectRatio: number
}) {
	const stageRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const runtimeRef = useRef<GraphicRuntime | null>(null)
	const valuesRef = useRef(values)
	const [visible, setVisible] = useState(false)
	const [error, setError] = useState<string | null>(null)

	valuesRef.current = values

	// 화면에 들어올 때만 GPU를 쓴다.
	useEffect(() => {
		const stage = stageRef.current
		if (!stage) return
		const observer = new IntersectionObserver(([entry]) =>
			setVisible(Boolean(entry?.isIntersecting)),
		)
		observer.observe(stage)
		return () => observer.disconnect()
	}, [])

	useEffect(() => {
		const container = containerRef.current
		if (!visible || !container) return
		let disposed = false
		setError(null)
		loadGraphicRuntimeAdapter(manifest)
			.then(async (adapter) => {
				if (!adapter) throw new Error(`등록되지 않은 Graphic runtime입니다: ${manifest.id}`)
				const runtime = await adapter.mount({
					container,
					values: valuesRef.current,
					// Admin 미리보기는 읽기 전용이다 — runtime이 값을 되밀어도 받지 않는다.
					onChange: () => false,
				})
				if (disposed) {
					runtime.destroy()
					return
				}
				runtimeRef.current = runtime
			})
			.catch((cause: unknown) => {
				setError(cause instanceof Error ? cause.message : '미리보기를 만들지 못했습니다.')
			})
		return () => {
			disposed = true
			runtimeRef.current?.destroy()
			runtimeRef.current = null
		}
	}, [manifest, visible])

	// 값이 바뀌면 다시 마운트하지 않고 갱신만 한다 — 셰이더 컴파일을 매번 하면 슬라이더가 끊긴다.
	useEffect(() => {
		runtimeRef.current?.update(values)
	}, [values])

	useEffect(() => {
		const stage = stageRef.current
		const container = containerRef.current
		if (!stage || !container) return
		const resize = (width: number, height: number) => {
			if (width <= 0 || height <= 0) return
			const viewport = fitPreviewSize(
				{ width, height },
				{ width: Math.round(aspectRatio * 1000), height: 1000 },
			)
			container.style.width = `${viewport.width}px`
			container.style.height = `${viewport.height}px`
			runtimeRef.current?.resize(viewport.width, viewport.height)
		}
		const observer = new ResizeObserver(([entry]) => {
			if (entry) resize(entry.contentRect.width, entry.contentRect.height)
		})
		resize(stage.clientWidth, stage.clientHeight)
		observer.observe(stage)
		return () => observer.disconnect()
	}, [aspectRatio])

	return (
		<div
			ref={stageRef}
			data-slot="graphic-preset-preview"
			className="flex h-64 items-center justify-center overflow-hidden rounded-2xl border bg-muted"
		>
			{error ? (
				<span className="px-4 text-center text-sm text-destructive">{error}</span>
			) : (
				<div ref={containerRef} className="relative" />
			)}
		</div>
	)
}
