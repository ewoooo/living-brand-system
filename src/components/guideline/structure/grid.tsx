import Image from 'next/image'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { type GuidelineCaption, GuidelineCardCaption } from './caption'
import styles from './grid.module.css'

export const DISPLAY_WIDTHS = [240, 320, 480, 720, 1440] as const
export const DISPLAY_RATIOS = ['1:1', '4:3', '16:9', '2:3', '3:4'] as const
export type DisplayWidth = (typeof DISPLAY_WIDTHS)[number]
export type DisplayRatio = (typeof DISPLAY_RATIOS)[number]
export type GridColumns = 1 | 2 | 3 | 4 | 5

export type GuidelineCardData = {
	id: string
	ratio: DisplayRatio
	display: ReactNode
	caption?: GuidelineCaption
}

type GridProps = Omit<ComponentProps<'div'>, 'children'> & {
	cards: readonly GuidelineCardData[]
	displayWidth?: DisplayWidth
	minDisplayWidth?: DisplayWidth
	columns?: GridColumns
}

export function GuidelineGridContainer({
	displayWidth = 480,
	minDisplayWidth,
	cards,
	columns = 3,
	className,
	style,
	...props
}: GridProps) {
	return (
		<div
			{...props}
			data-slot="guideline-grid-container"
			className={cn(styles.grid, minDisplayWidth !== undefined && styles.fluid, className)}
			style={
				{
					...style,
					'--display-width': `${displayWidth}px`,
					'--min-display-width': `${Math.min(minDisplayWidth ?? displayWidth, displayWidth)}px`,
					'--grid-columns': columns,
				} as CSSProperties
			}
		>
			{cards.map((card) => (
				<GuidelineCard
					key={card.id}
					style={{ '--display-ratio': card.ratio.replace(':', ' / ') } as CSSProperties}
				>
					{card.display}
					{card.caption && <GuidelineCardCaption {...card.caption} />}
				</GuidelineCard>
			))}
		</div>
	)
}

export function GuidelineCard({ className, ...props }: ComponentProps<'figure'>) {
	return <figure {...props} data-slot="guideline-card" className={cn(styles.card, className)} />
}

/** 이미지와 위젯이 공유하는 판형·배경·잘림 영역입니다. */
export function GuidelineDisplayFrame({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			{...props}
			data-slot="guideline-card-display"
			className={cn(styles.display, className)}
		/>
	)
}

type DisplayProps = {
	children?: ReactNode
	src: string
	alt: string
	sizes?: string
	className?: string
} & ({ fit?: 'contain'; scale?: number } | { fit: 'cover'; scale?: never })

export function GuidelineCardDisplay({
	src,
	alt,
	sizes = '(max-width: 480px) 100vw, 480px',
	fit = 'contain',
	scale = 80,
	className,
	children,
}: DisplayProps) {
	const contentScale =
		fit === 'cover'
			? 1
			: (Number.isFinite(scale) ? Math.min(100, Math.max(30, scale)) : 80) / 100
	return (
		<GuidelineDisplayFrame data-fit={fit} className={className}>
			<Image
				src={src}
				alt={alt}
				fill
				sizes={sizes}
				className={styles.image}
				style={{ objectFit: fit, transform: `scale(${contentScale})` }}
			/>
			{children}
		</GuidelineDisplayFrame>
	)
}

export { GuidelineCardCaption } from './caption'
