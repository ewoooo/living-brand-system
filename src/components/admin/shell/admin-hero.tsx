'use client'

import { useEffect, useRef } from 'react'
import { RADIAL_FLUTED_GLASS_DEFAULT_INPUT } from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/definition'
import { toRadialFlutedGlassInput } from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/model'
import {
	createRadialFlutedGlassRuntime,
	type RadialFlutedGlassRuntime,
} from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/runtime.client'

/**
 * 대시보드 상단 배너. Radial Fluted Glass shader가 배경을 그리고, 워드마크가 그 위에 앉는다.
 *
 * 정지 이미지를 배경에 먼저 깔아 두므로 shader가 붙지 않는 경우(WebGL 불가, 모션 감소 설정)를
 * 따로 분기하지 않는다 — canvas가 없으면 그 이미지가 그대로 남는다.
 *
 * shader 값은 상수를 그대로 쓴다. 어드민에서 튜닝하려면 graphic-profiles로 잇는 별도 작업이 필요하다.
 */
export function AdminHero() {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container) return
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

		let runtime: RadialFlutedGlassRuntime | undefined
		let disposed = false

		const observer = new ResizeObserver(([entry]) => {
			if (!entry) return
			const { height, width } = entry.contentRect
			runtime?.resize(Math.round(width), Math.round(height))
		})

		createRadialFlutedGlassRuntime({
			container,
			input: toRadialFlutedGlassInput({ ...RADIAL_FLUTED_GLASS_DEFAULT_INPUT }),
		})
			.then((mounted) => {
				if (disposed) {
					mounted.destroy()
					return
				}
				runtime = mounted
				observer.observe(container)
			})
			.catch((error) => {
				// 배경 이미지가 남으므로 화면은 깨지지 않는다. 원인만 남긴다.
				console.error('대시보드 배너 shader를 띄우지 못했습니다.', error)
			})

		return () => {
			disposed = true
			observer.disconnect()
			runtime?.destroy()
		}
	}, [])

	return (
		<div className="relative isolate aspect-[1412/381] w-full overflow-hidden rounded-[24px] bg-[image:var(--admin-hero-fallback)] bg-cover bg-center [--admin-hero-fallback:url('/images/hero_admin.png')]">
			<div className="absolute inset-0" ref={containerRef} />
			{/* biome-ignore lint/performance/noImgElement: Payload admin은 next/image의 최적화 경로를 타지 않는다. */}
			<img
				alt="HD"
				className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 w-[11%] min-w-[96px]"
				src="/logos/logo_wht.svg"
			/>
		</div>
	)
}
