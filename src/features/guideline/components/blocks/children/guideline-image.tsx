// 특정 Payload 컬렉션에 결합하지 않는다 — url/alt/name(색은 hex)만 있으면 무엇이든 렌더한다.
type ImageValue = { url?: string | null; alt?: string | null; name?: string | null }
type ColorValue = { hex?: string | null }

export function GuidelineImage({
	image,
	alt = '',
	backgroundColor,
	scale = '100',
	className,
	imgClassName = 'max-h-full max-w-full object-contain',
}: {
	image?: number | ImageValue | null
	alt?: string
	backgroundColor?: number | ColorValue | null
	scale?: string | null
	className?: string
	imgClassName?: string
}) {
	const imageValue = getImage(image)

	if (!imageValue?.url) {
		return null
	}

	const backgroundColorHex = getColorHex(backgroundColor)

	return (
		<div
			className={`flex items-center justify-center ${className || ''}`}
			style={backgroundColorHex ? { backgroundColor: backgroundColorHex } : undefined}
		>
			{/* biome-ignore lint/performance/noImgElement: Payload upload URLs may be local or S3. */}
			<img
				src={imageValue.url}
				alt={imageValue.alt || imageValue.name || alt}
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
