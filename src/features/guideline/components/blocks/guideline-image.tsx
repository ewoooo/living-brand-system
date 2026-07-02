type ImageValue = {
	url?: string | null
	alt?: string | null
	name?: string | null
}

export function GuidelineImage({
	image,
	alt = '',
	backgroundColor,
	scale = '100',
	className,
}: {
	image: unknown
	alt?: string
	backgroundColor?: unknown
	scale?: string | null
	className?: string
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
				className="max-h-full max-w-full"
				style={{ width: `${scale || '100'}%` }}
			/>
		</div>
	)
}

function getImage(value: unknown): ImageValue | null {
	return value && typeof value === 'object' ? (value as ImageValue) : null
}

function getColorHex(value: unknown): string | null {
	if (!value || typeof value !== 'object' || !('hex' in value)) {
		return null
	}

	return typeof value.hex === 'string' ? value.hex : null
}
