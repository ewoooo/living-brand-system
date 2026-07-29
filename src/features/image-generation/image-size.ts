export const IMAGE_OUTPUT_SIZE_PRESET_OPTIONS = [
	{ label: '정사각형 (1:1, 1024×1024)', value: 'square' },
	{ label: '가로형 (3:2, 1536×1024)', value: 'landscape' },
	{ label: '세로형 (2:3, 1024×1536)', value: 'portrait' },
] as const

export type ImageOutputSizePreset = (typeof IMAGE_OUTPUT_SIZE_PRESET_OPTIONS)[number]['value']
export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536'

export const IMAGE_SIZE_BY_PRESET: Record<ImageOutputSizePreset, ImageSize> = {
	square: '1024x1024',
	landscape: '1536x1024',
	portrait: '1024x1536',
}
