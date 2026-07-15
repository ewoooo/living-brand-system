'use client'

import { useEffect, useRef } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from '../blocks/children/guideline-image'
import type { GuidelineVariant } from './guideline-variant'

// 최상위 헤더(section/chapter/onboard). page 헤더는 GuidelinePageHeading으로 분리됨.
// 이미지 없으면: 스크롤에 따라 축소 → 타이틀 높이에서 sticky. 배경은 사이트 단색(불투명)이라 하위 콘텐츠는 그 뒤로 가려짐.
// 높이는 리렌더 없이 rAF로 style.height만 직접 갱신한다(스크롤 성능).
// 이미지 있으면: 기존 16:9 히어로 유지.
const MAX_HEIGHT = 200
const MIN_HEIGHT = 88

export function GuidelineHeader({
	title,
	image,
	as: Heading = 'h1',
	label,
	variant = 'chapter',
}: {
	title: string
	image?: GuidelineDocument['headerImage']
	as?: 'h1' | 'h2'
	label?: string | number
	variant?: GuidelineVariant
}) {
	const hasImage = typeof image === 'object' && image !== null && Boolean(image.url)
	const ref = useRef<HTMLElement>(null)

	useEffect(() => {
		if (hasImage) return
		const el = ref.current
		if (!el) return
		// 중첩 스크롤 컨테이너(SectionLayout의 main)를 런타임에 찾는다. 없으면 window.
		let node = el.parentElement
		let scroller: HTMLElement | null = null
		while (node) {
			const overflowY = getComputedStyle(node).overflowY
			if (
				(overflowY === 'auto' || overflowY === 'scroll') &&
				node.scrollHeight > node.clientHeight
			) {
				scroller = node
				break
			}
			node = node.parentElement
		}
		const target: HTMLElement | Window = scroller ?? window
		const readTop = () => (scroller ? scroller.scrollTop : window.scrollY)
		let frame = 0
		const update = () => {
			frame = 0
			el.style.height = `${Math.max(MIN_HEIGHT, MAX_HEIGHT - readTop())}px`
		}
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update)
		}
		update()
		target.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			target.removeEventListener('scroll', onScroll)
			if (frame) cancelAnimationFrame(frame)
		}
	}, [hasImage])

	if (hasImage) {
		return (
			<header data-variant={variant}>
				<AspectRatio ratio={16 / 9} className="relative overflow-hidden bg-scrim">
					<GuidelineImage
						image={image}
						className="absolute inset-0 size-full"
						imgClassName="size-full object-cover"
					/>
					<div aria-hidden="true" className="absolute inset-0 bg-scrim/25" />
					<div className="relative z-10 flex size-full items-end p-4 pb-8 text-scrim-foreground">
						<div>
							{label !== undefined && (
								<p className="type-body mb-2 opacity-70">{label}</p>
							)}
							<Heading className="type-large-title text-6xl">{title}</Heading>
						</div>
					</div>
				</AspectRatio>
			</header>
		)
	}

	return (
		<header
			ref={ref}
			data-variant={variant}
			className="sticky top-0 z-20 flex items-end border-scrim/10 border-b bg-background pb-4"
			style={{ height: MAX_HEIGHT }}
		>
			{label !== undefined && <p className="type-body mr-3 text-foreground-muted">{label}</p>}
			<Heading className="type-large-title text-6xl text-foreground">{title}</Heading>
		</header>
	)
}
