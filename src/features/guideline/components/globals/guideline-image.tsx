import { IMAGE_RATIO_CLASS_NAMES, type ImageRatio } from '@/types/image-ratio'
import { GuidelineImageFallback } from '../guideline-content-fallbacks'
import type { GuidelineVariant } from './guideline-variant'

// 특정 Payload 컬렉션에 결합하지 않는다 — url/alt/name(색은 hex)만 있으면 무엇이든 렌더한다.
type ImageValue = { url?: string | null; alt?: string | null; name?: string | null }
type ColorValue = { hex?: string | null }
type ImageVariant = Extract<GuidelineVariant, 'topic' | 'page' | 'block'>
type ImageProps = {
	image: ImageValue
	alt: string
	backgroundColor?: number | ColorValue | null
	scale: string | null
	ratioClassName: string
	className?: string
	imgClassName: string
}

export function GuidelineImage({
	variant,
	image,
	alt = '',
	backgroundColor,
	scale = '100',
	ratio = '16:9',
	className,
	imgClassName = 'max-h-full max-w-full object-contain',
}: {
	variant?: ImageVariant
	image?: number | ImageValue | null
	alt?: string
	backgroundColor?: number | ColorValue | null
	scale?: string | null
	ratio?: ImageRatio | null
	className?: string
	imgClassName?: string
}) {
	const imageValue = getImage(image)
	const ratioClassName = IMAGE_RATIO_CLASS_NAMES[ratio ?? '16:9']

	if (!imageValue?.url) {
		return variant ? (
			<GuidelineImageFallback
				variant={variant}
				className={`${ratioClassName || 'aspect-video'} ${className ?? ''}`}
			/>
		) : null
	}

	const imageProps = {
		image: imageValue,
		alt,
		backgroundColor,
		scale,
		ratioClassName,
		className,
		imgClassName,
	} satisfies ImageProps

	return (
		<>
			{variant === 'topic' && <TopicImage {...imageProps} />}
			{variant === 'page' && <PageImage {...imageProps} />}
			{(variant === 'block' || !variant) && <BlockImage {...imageProps} />}
		</>
	)
}

function TopicImage(props: ImageProps) {
	return <BlockImage {...props} />
}

function PageImage(props: ImageProps) {
	return <BlockImage {...props} />
}

function BlockImage({
	image,
	alt,
	backgroundColor,
	scale,
	ratioClassName,
	className,
	imgClassName,
}: ImageProps) {
	const backgroundColorHex = getColorHex(backgroundColor)

	return (
		<div
			className={`flex items-center justify-center ${ratioClassName} ${className || ''}`}
			style={backgroundColorHex ? { backgroundColor: backgroundColorHex } : undefined}
		>
			{/* biome-ignore lint/performance/noImgElement: Payload upload URLs may be local or S3. */}
			<img
				src={image.url ?? undefined}
				alt={image.alt || image.name || alt}
				className={imgClassName}
				style={{ width: `${scale || '100'}%` }}
			/>
		</div>
	)
}

// 관계 필드는 populate되면 객체, 아니면 id(number) — 객체일 때만 렌더 값으로 쓴다.
function getImage(value?: number | ImageValue | null): ImageValue | null {
	return value && typeof value === 'object' ? value : null
}

function getColorHex(value?: number | ColorValue | null): string | null {
	return value && typeof value === 'object' ? (value.hex ?? null) : null
}
