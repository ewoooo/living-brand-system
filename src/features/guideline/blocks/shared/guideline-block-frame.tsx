import type * as React from 'react'
import { ContentFrame, type ContentFrameVariant } from '@/components/shared/content-frame'
import { cn } from '@/lib/utils'

type GuidelineBlockFrameVariant = 'normal' | 'secondary' | 'inverted'

const variantClassNames: Record<GuidelineBlockFrameVariant, string> = {
	normal: 'bg-background text-foreground',
	secondary: 'bg-secondary text-secondary-foreground',
	inverted: 'bg-foreground text-background',
}

type GuidelineBlockFrameProps = React.ComponentProps<'div'> & {
	layout: ContentFrameVariant
	variant?: GuidelineBlockFrameVariant
	contentClassName?: string
	label?: string
}

/** 블록의 전체 폭 표면과 내부 콘텐츠 폭을 한 경계에서 정의한다. */
export function GuidelineBlockFrame({
	layout,
	variant = 'normal',
	className,
	contentClassName,
	children,
	label,
	...props
}: GuidelineBlockFrameProps) {
	return (
		<section
			data-slot="guideline-block-frame"
			data-variant={variant}
			className={cn(variantClassNames[variant], className)}
			aria-label={label}
			{...props}
		>
			<ContentFrame variant={layout} className={contentClassName}>
				{children}
			</ContentFrame>
		</section>
	)
}
