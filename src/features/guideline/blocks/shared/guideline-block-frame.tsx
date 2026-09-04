import type * as React from 'react'
import { ContentFrame, type ContentFrameVariant } from '@/components/shared/content-frame'
import { cn } from '@/lib/utils'

type GuidelineBlockFrameVariant = 'normal' | 'secondary' | 'inverted'

// 🔴 normal은 면을 **칠하지 않는다.** 기본 바탕 위에서는 `bg-background`와 결과가 같지만,
//    문서(Page)가 옅은 면을 깔면 불투명한 흰 면이 그 위를 덮어 제목만 색이 있고 배치는 흰
//    상태가 된다(실측). 색을 갖지 않은 블록은 아무 면도 갖지 않는 것이 맞다.
const variantClassNames: Record<GuidelineBlockFrameVariant, string> = {
	normal: 'text-foreground',
	secondary: 'bg-secondary text-secondary-foreground',
	inverted: 'bg-foreground text-background',
}

type GuidelineBlockFrameProps = React.ComponentProps<'div'> & {
	layout: ContentFrameVariant
	variant?: GuidelineBlockFrameVariant
	contentClassName?: string
}

/** 블록의 전체 폭 표면과 내부 콘텐츠 폭을 한 경계에서 정의한다. */
export function GuidelineBlockFrame({
	layout,
	variant = 'normal',
	className,
	contentClassName,
	children,
	...props
}: GuidelineBlockFrameProps) {
	return (
		// <section>이 아니다 — 제목 없는 블록도 있어 이름 없는 랜드마크만 늘고, 제목이 있는 블록은
		// 헤딩이 이미 아웃라인을 만든다. 랜드마크는 토픽의 <article> 하나가 갖는다.
		<div
			data-slot="guideline-block-frame"
			data-variant={variant}
			className={cn(variantClassNames[variant], className)}
			{...props}
		>
			<ContentFrame variant={layout} className={contentClassName}>
				{children}
			</ContentFrame>
		</div>
	)
}
