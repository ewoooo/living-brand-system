import { ContentHeading } from '@/components/shared/content-heading'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from './guideline-image'
import type { GuidelineVariant } from './guideline-variant'

const HEADER_STYLE = {
	onboard: { level: 1, size: '6xl', weight: 'bold' },
	chapter: { level: 1, size: '6xl', weight: 'semibold' },
	section: { level: 2, size: '5xl', weight: 'medium' },
	page: { level: 3, size: '2xl', weight: 'semibold' },
	block: { level: 3, size: 'base', weight: 'semibold' },
} as const

export function GuidelineHeader({
	title,
	variant = 'chapter',
	className,
}: {
	title?: string | null
	variant?: GuidelineVariant
	className?: string
}) {
	if (!title) return null
	const style = HEADER_STYLE[variant]

	return (
		<ContentHeading
			title={title}
			level={style.level}
			size={style.size}
			weight={style.weight}
			className={className}
			titleClassName={variant === 'block' ? undefined : 'leading-none tracking-tight'}
		/>
	)
}

export function GuidelineHeaderImage({ image }: { image?: GuidelineDocument['headerImage'] }) {
	if (typeof image !== 'object' || image === null || !image.url) return null

	return (
		<GuidelineImage
			variant="section"
			image={image}
			ratio="16:9"
			className="w-full overflow-hidden bg-scrim"
			imgClassName="size-full object-cover"
		/>
	)
}
